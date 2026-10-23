import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shopping} from '../dist/domain.js';
const meal={id:'m',servings:2,ingredients:[{name:'Carbs',quantity:200,unit:'g',group:true}]};
test('allocates flexible stock once, scales portions, excludes expired lots',()=>{
 const s={meals:[meal],inventory:[{name:'Rice',category:'Carbs',unit:'g',quantity:300,expiry:'2026-10-25'},{name:'Pasta',category:'Carbs',unit:'g',quantity:500,expiry:'2026-10-20'}],plan:[{mealId:'m',date:'2026-10-24',servings:2},{mealId:'m',date:'2026-10-25',servings:4}]};
 assert.deepEqual(shopping(s,'2026-10-24','2026-10-25'),[{name:'Carbs',unit:'g',quantity:300,group:true}]);
});
test('does not mix units or include plans outside interval',()=>{
 const s={meals:[meal],inventory:[{name:'Rice',category:'Carbs',unit:'pcs',quantity:999,expiry:'2027-01-01'}],plan:[{mealId:'m',date:'2026-10-24',servings:1},{mealId:'m',date:'2026-10-26',servings:2}]};
 assert.equal(shopping(s,'2026-10-24','2026-10-25')[0].quantity,100);
});
test('allocates stock in meal date order regardless of insertion order',()=>{
 const s={meals:[meal],inventory:[{name:'Rice',category:'Carbs',unit:'g',quantity:200,expiry:'2026-10-24'}],plan:[{mealId:'m',date:'2026-10-25',servings:2},{mealId:'m',date:'2026-10-24',servings:2}]};
 assert.equal(shopping(s,'2026-10-24','2026-10-25')[0].quantity,200);
});
test('unmeasured ingredients remain tracked with no invented amount',()=>{
 const s={meals:[{id:'m',servings:2,ingredients:[{name:'Spinach',quantity:null,unit:'g',group:false},{name:'Carbs',quantity:null,unit:'g',group:true}]}],inventory:[{name:'Spinach',category:'Vegetables',quantity:200,unit:'g',expiry:'2026-10-26'},{name:'Rice',category:'Carbs',quantity:1,unit:'pcs',expiry:'2026-10-26'}],plan:[{mealId:'m',date:'2026-10-24',servings:4}]};
 const result=shopping(s,'2026-10-24','2026-10-25');
 assert.equal(result.length,2);assert.ok(result.every(x=>x.quantity===null&&x.unquantified&&x.available));
 assert.equal(s.inventory[0].quantity,200);
});
test('missing or expired unmeasured ingredients need buying, deduplicated across meals',()=>{
 const s={meals:[{id:'m',servings:2,ingredients:[{name:'Spinach',quantity:null,unit:'g'}]}],inventory:[{name:'Spinach',quantity:200,unit:'g',expiry:'2026-10-24'}],plan:[{mealId:'m',date:'2026-10-24',servings:2},{mealId:'m',date:'2026-10-25',servings:2}]};
 const result=shopping(s,'2026-10-24','2026-10-25');assert.equal(result.length,1);assert.equal(result[0].available,false);
});
test('by-feel availability uses stock left after measured ingredients reserve it',()=>{
 const s={meals:[{id:'m',servings:2,ingredients:[{name:'Pasta',quantity:null,unit:'g'},{name:'Pasta',quantity:200,unit:'g'}]}],inventory:[{name:'Pasta',quantity:200,unit:'g',expiry:'2026-10-26'}],plan:[{mealId:'m',date:'2026-10-24',servings:2}]};
 const result=shopping(s,'2026-10-24','2026-10-25');assert.equal(result.length,1);assert.equal(result[0].available,false);
});
test('legacy ingredients without quantities are tracked too',()=>{
 const s={meals:[{id:'m',servings:2,ingredients:[{name:'Salt'}]}],inventory:[],plan:[{mealId:'m',date:'2026-10-24',servings:2}]};
 assert.deepEqual(shopping(s,'2026-10-24','2026-10-25'),[{name:'Salt',unit:'',quantity:null,group:undefined,unquantified:true,available:false}]);
});
