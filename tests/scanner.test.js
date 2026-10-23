import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startBarcodeScanner} from '../dist/scanner.js';
function mockNavigator(t,getUserMedia){const original=Object.getOwnPropertyDescriptor(globalThis,'navigator');Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia}}});t.after(()=>{if(original)Object.defineProperty(globalThis,'navigator',original);else delete globalThis.navigator})}
test('closing while camera permission is pending stops the late camera stream',async t=>{
 let resolveCamera,stops=0;mockNavigator(t,()=>new Promise(resolve=>resolveCamera=resolve));
 const video={srcObject:null,play:async()=>{throw Error('Closed camera must not play')}};
 const scanner=startBarcodeScanner(video,()=>assert.fail('Closed camera must not scan'));
 scanner.stop();resolveCamera({getTracks:()=>[{stop:()=>stops++}]});await scanner.ready;
 assert.equal(stops,1);assert.equal(video.srcObject,null);
});
test('camera permission errors are returned for the manual-entry UI',async t=>{
 mockNavigator(t,async()=>{throw Object.assign(Error('Permission denied'),{name:'NotAllowedError'})});
 const scanner=startBarcodeScanner({srcObject:null},()=>assert.fail());
 await assert.rejects(scanner.ready,{name:'NotAllowedError'});
});
test('a native barcode result releases the camera before notifying the app',async t=>{
 let stopped=false,finish;const original=globalThis.BarcodeDetector;
 globalThis.BarcodeDetector=class{static async getSupportedFormats(){return ['ean_13']}async detect(){return [{rawValue:'3017620422003'}]}};
 t.after(()=>{if(original)globalThis.BarcodeDetector=original;else delete globalThis.BarcodeDetector});
 mockNavigator(t,async()=>({getTracks:()=>[{stop:()=>stopped=true}]}));
 const result=new Promise(resolve=>finish=resolve),video={srcObject:null,play:async()=>{}};
 const scanner=startBarcodeScanner(video,code=>{assert.equal(stopped,true);finish(code)});
 await scanner.ready;assert.equal(await result,'3017620422003');assert.equal(video.srcObject,null);
});
