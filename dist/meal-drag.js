// Native desktop dragging plus a hold-and-drag gesture for touch browsers.
// Moving before the hold completes remains ordinary page/tray scrolling.
export function bindMealDrag(root,onDrop){
 const doc=root.ownerDocument,win=doc.defaultView,removers=[];
 let gesture=null,hold=null,frame=null,target=null,ghost=null,suppressClickUntil=0;
 const listen=(el,type,fn,options)=>{el.addEventListener(type,fn,options);removers.push(()=>el.removeEventListener(type,fn,options))};
 const highlight=slot=>{if(target===slot)return;target?.classList.remove('dragover');target=slot;target?.classList.add('dragover')};
 const clear=()=>{clearTimeout(hold);if(frame!==null)win.cancelAnimationFrame(frame);frame=null;gesture?.source.classList.remove('touch-drag-source');ghost?.remove();ghost=null;highlight(null);doc.body.classList.remove('meal-touch-dragging');gesture=null};
 const hit=()=>{if(!gesture?.active)return;const {x,y}=gesture;ghost.style.left=x+'px';ghost.style.top=(y-18)+'px';const slot=doc.elementFromPoint(x,y)?.closest('.slot');highlight(slot&&root.contains(slot)?slot:null)};
 const autoScroll=()=>{
  if(!gesture?.active)return;
  const {x,y}=gesture,navHeight=win.innerWidth<=650?(doc.querySelector('#nav')?.getBoundingClientRect().height||74):0;
  const bottom=win.innerHeight-navHeight-12;
  const dy=y<65?-Math.min(12,(65-y)/4):y>bottom-45?Math.min(12,(y-bottom+45)/4):0;
  if(dy)win.scrollBy(0,dy);
  const calendar=root.querySelector('.calendar-wrap');
  if(calendar){const r=calendar.getBoundingClientRect();if(y>=r.top&&y<=r.bottom){const dx=x<r.left+40?-Math.min(12,(r.left+40-x)/3):x>r.right-40?Math.min(12,(x-r.right+40)/3):0;if(dx)calendar.scrollLeft+=dx}}
  hit();frame=win.requestAnimationFrame(autoScroll);
 };
 for(const source of root.querySelectorAll('[data-drag]')){
  listen(source,'dragstart',event=>{if(gesture){event.preventDefault();return}event.dataTransfer.setData('text/plain',source.dataset.drag);event.dataTransfer.effectAllowed='copy'});
  listen(source,'dragend',()=>highlight(null));
  listen(source,'contextmenu',event=>event.preventDefault());
  listen(source,'touchstart',event=>{
   if(event.touches.length!==1||event.target.closest('button,input,select,textarea,a'))return;
   clear();const touch=event.touches[0];gesture={id:source.dataset.drag,source,finger:touch.identifier,x:touch.clientX,y:touch.clientY,startX:touch.clientX,startY:touch.clientY,active:false};
   hold=setTimeout(()=>{
    if(!gesture)return;gesture.active=true;source.classList.add('touch-drag-source');doc.body.classList.add('meal-touch-dragging');
    ghost=doc.createElement('div');ghost.className='meal-drag-ghost';ghost.textContent=source.querySelector('b,h3')?.textContent||'Meal';ghost.setAttribute('aria-hidden','true');doc.body.append(ghost);hit();frame=win.requestAnimationFrame(autoScroll);
   },200);
  },{passive:true});
 }
 for(const slot of root.querySelectorAll('.slot')){
  listen(slot,'dragover',event=>{event.preventDefault();event.dataTransfer.dropEffect='copy';highlight(slot)});
  listen(slot,'dragleave',event=>{if(!slot.contains(event.relatedTarget))highlight(null)});
  listen(slot,'drop',event=>{event.preventDefault();const id=event.dataTransfer.getData('text/plain');highlight(null);if(id)onDrop(id,slot.dataset.date,slot.dataset.slot)});
 }
 listen(doc,'touchmove',event=>{
  if(!gesture)return;if(event.touches.length!==1){clear();return}
  const touch=[...event.touches].find(t=>t.identifier===gesture.finger);if(!touch)return;
  gesture.x=touch.clientX;gesture.y=touch.clientY;
  if(!gesture.active){if(Math.hypot(gesture.x-gesture.startX,gesture.y-gesture.startY)>9)clear();return}
  if(event.cancelable)event.preventDefault();hit();
 },{passive:false});
 listen(doc,'touchend',event=>{
  if(!gesture||![...event.changedTouches].some(t=>t.identifier===gesture.finger))return;
  const touch=[...event.changedTouches].find(t=>t.identifier===gesture.finger);
  if(gesture.active){gesture.x=touch.clientX;gesture.y=touch.clientY;hit()}
  const active=gesture.active,id=gesture.id,slot=target;
  if(active){if(event.cancelable)event.preventDefault();suppressClickUntil=Date.now()+400}
  clear();if(active&&slot)onDrop(id,slot.dataset.date,slot.dataset.slot);
 },{passive:false});
 listen(doc,'touchcancel',clear,{passive:true});
 listen(root,'click',event=>{if(gesture?.active||Date.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation()}},true);
 listen(doc,'keydown',event=>{if(event.key==='Escape')clear()});
 listen(doc,'visibilitychange',()=>{if(doc.hidden)clear()});
 return ()=>{clear();removers.forEach(remove=>remove())};
}
