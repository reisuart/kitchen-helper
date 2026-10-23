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
