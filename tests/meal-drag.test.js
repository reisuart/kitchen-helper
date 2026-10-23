import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindMealDrag} from '../dist/meal-drag.js';
class Node extends EventTarget{
 constructor(){super();this.dataset={};this.style={};this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)};this.children=[]}
 append(node){this.children.push(node);node.parent=this}
 remove(){this.parent.children=this.parent.children.filter(n=>n!==this)}
 setAttribute(){}
 closest(selector){return selector==='.slot'&&this.isSlot?this:null}
 querySelector(selector){return selector==='b,h3'?{textContent:'My meal'}:null}
}
function fixture(){
 const doc=new EventTarget(),root=new Node(),source=new Node(),slot=new Node();
 source.dataset.drag='meal-1';slot.isSlot=true;slot.dataset={date:'2026-10-25',slot:'Dinner'};
 doc.body=new Node();doc.createElement=()=>new Node();doc.elementFromPoint=()=>doc.pointTarget;
 doc.querySelector=()=>({getBoundingClientRect:()=>({height:74})});
 doc.defaultView={innerWidth:390,innerHeight:844,requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},scrollBy:()=>{}};
 root.ownerDocument=doc;root.querySelectorAll=s=>s==='[data-drag]'?[source]:s==='.slot'?[slot]:[];root.querySelector=()=>null;root.contains=node=>node===source||node===slot;
 const drops=[],dispose=bindMealDrag(root,(...args)=>drops.push(args));
 const finger=(x=50,y=300)=>({identifier:1,clientX:x,clientY:y});
 const touch=(target,type,t= finger())=>{const e=new Event(type,{cancelable:true});Object.defineProperties(e,{touches:{value:type==='touchend'?[]:[t]},changedTouches:{value:[t]}});target.dispatchEvent(e);return e};
 return {doc,root,source,slot,drops,dispose,touch,finger};
}
const hold=()=>new Promise(resolve=>setTimeout(resolve,230));
test('a held touch drops into the highlighted date and meal slot',async()=>{
 const f=fixture();try{f.touch(f.source,'touchstart');await hold();f.doc.pointTarget=f.slot;const move=f.touch(f.doc,'touchmove',f.finger(160,430));assert.equal(move.defaultPrevented,true);assert.equal(f.slot.classes.has('dragover'),true);f.touch(f.doc,'touchend');assert.deepEqual(f.drops,[['meal-1','2026-10-25','Dinner']]);assert.equal(f.doc.body.children.length,0);assert.equal(f.source.classes.has('touch-drag-source'),false)}finally{f.dispose()}
});
test('a swipe before pickup keeps ordinary scrolling and does not schedule',async()=>{
 const f=fixture();try{f.touch(f.source,'touchstart');const move=f.touch(f.doc,'touchmove',f.finger(85,300));assert.equal(move.defaultPrevented,false);await hold();f.doc.pointTarget=f.slot;f.touch(f.doc,'touchend');assert.deepEqual(f.drops,[]);assert.equal(f.doc.body.children.length,0)}finally{f.dispose()}
});
test('cancelling a held drag removes the preview without planning a meal',async()=>{
 const f=fixture();try{f.touch(f.source,'touchstart');await hold();assert.equal(f.doc.body.children.length,1);f.touch(f.doc,'touchcancel');assert.equal(f.doc.body.children.length,0);assert.deepEqual(f.drops,[])}finally{f.dispose()}
});
test('dropping outside a slot does not schedule and navigation cancels pending pickup',async()=>{
 const f=fixture();f.touch(f.source,'touchstart');await hold();f.touch(f.doc,'touchend');assert.deepEqual(f.drops,[]);f.touch(f.source,'touchstart');f.dispose();await hold();assert.equal(f.doc.body.children.length,0);
});
test('holding near calendar and screen edges scrolls toward off-screen meal slots',async()=>{
 const f=fixture(),calendar={scrollLeft:0,getBoundingClientRect:()=>({left:10,right:380,top:400,bottom:850})},scrolls=[];
 let frame;f.root.querySelector=()=>calendar;f.doc.defaultView.requestAnimationFrame=fn=>{frame=fn;return 1};f.doc.defaultView.scrollBy=(...args)=>scrolls.push(args);
 try{f.touch(f.source,'touchstart');await hold();f.touch(f.doc,'touchmove',f.finger(385,780));frame();assert.ok(calendar.scrollLeft>0);assert.ok(scrolls.some(([,dy])=>dy>0))}finally{f.dispose()}
});
test('desktop drag data is preserved through a slot drop',()=>{
 const f=fixture(),data=new Map(),transfer={setData:(key,value)=>data.set(key,value),getData:key=>data.get(key)};
 try{const start=new Event('dragstart');Object.defineProperty(start,'dataTransfer',{value:transfer});f.source.dispatchEvent(start);const drop=new Event('drop',{cancelable:true});Object.defineProperty(drop,'dataTransfer',{value:transfer});f.slot.dispatchEvent(drop);assert.equal(drop.defaultPrevented,true);assert.deepEqual(f.drops,[['meal-1','2026-10-25','Dinner']])}finally{f.dispose()}
});
