// ZXing's browser decoder supplies 1D barcode support where BarcodeDetector is absent.
// Camera frames stay on-device. Only the resulting barcode is used for product lookup.
export function startBarcodeScanner(video,onDetected,onStatus=()=>{}){
 let stopped=false,stream=null,controls=null,timer=null;
 const stop=()=>{stopped=true;clearTimeout(timer);controls?.stop();stream?.getTracks().forEach(track=>track.stop());if(video.srcObject===stream)video.srcObject=null};
 const found=code=>{if(stopped||!/^\d{8,14}$/.test(code))return;stop();onDetected(code)};
 const ready=(async()=>{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera access needs HTTPS and a browser with camera support.');
  onStatus('Opening your rear camera…');
  stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
  if(stopped){stream.getTracks().forEach(track=>track.stop());return}
  video.srcObject=stream;await video.play();if(stopped)return;
  let detector=null;
  if('BarcodeDetector' in globalThis){try{const supported=await BarcodeDetector.getSupportedFormats();const formats=['ean_13','ean_8','upc_a','upc_e'].filter(f=>supported.includes(f));if(formats.length)detector=new BarcodeDetector({formats})}catch{}}
  if(stopped)return;
  if(detector){
   onStatus('Keep the barcode flat, well lit, and inside the camera view.');
   const tick=async()=>{if(stopped)return;try{const results=await detector.detect(video);if(results.length)found(results[0].rawValue)}catch{}if(!stopped)timer=setTimeout(tick,180)};tick();
  }else{
   onStatus('Loading the Safari-compatible barcode reader…');
   const {BrowserMultiFormatOneDReader}=await import('https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm');
   if(stopped)return;
   const reader=new BrowserMultiFormatOneDReader(undefined,{delayBetweenScanAttempts:180,delayBetweenScanSuccess:600});
   controls=await reader.decodeFromStream(stream,video,(result,_error,activeControls)=>{if(result){controls=activeControls;found(result.getText())}});
   if(stopped)controls.stop();else onStatus('Keep the barcode flat, well lit, and inside the camera view.');
  }
 })().catch(error=>{stop();throw error});
 return {stop,ready};
}
