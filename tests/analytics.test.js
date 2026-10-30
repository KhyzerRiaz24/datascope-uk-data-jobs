/** Check numerical and export behaviour independently of the page layouts. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {median,quantile,snapshot,skillCounts,skillPairs,salaryRows,salaryGroups,trends,newObserved,csvText,dayOffset} from '../web/analytics.js';
const job=(id,changes={})=>({id,title:'Data Analyst',role:'Data Analyst',location:'Leeds',seniority:'Entry level',working:'Hybrid',skills:['SQL','Python'],currency:'GBP',contract_type:'permanent',salary_unit:'annual',salary_is_predicted:false,salary_min:30000,salary_max:40000,observed_at:'2026-10-30',...changes});
test('median and quartiles use interpolated finite numerical values',()=>{
  assert.equal(median([1,9,2,8]),5);assert.equal(median([null,NaN]),null);
  assert.equal(quantile([1,2,3,4],.25),1.75);assert.equal(quantile([8],.75),8);
});
test('snapshot applies shared filters and removes duplicates without counting history',()=>{
  const dataset={latest_date:'2026-10-30',observations:[job('a'),job('a'),job('b',{observed_at:'2026-10-29'}),job('c',{role:'Data Engineer'})]};
  assert.equal(snapshot(dataset,{role:'Data Analyst'}).length,1);
  assert.equal(snapshot(dataset,{}).length,2);
  assert.equal(snapshot(dataset,{working:'Remote'}).length,0);
});
test('salary calculation excludes contracts, estimates, currencies, bad ranges and missing bounds',()=>{
  const rows=[job('a'),job('b',{salary_min:50000,salary_max:70000}),job('c',{salary_is_predicted:true}),job('d',{salary_unit:'daily'}),job('e',{contract_type:'contract'}),job('f',{salary_max:null}),job('g',{currency:'USD'}),job('h',{salary_max:100}),job('i',{salary_min:Infinity})];
  assert.equal(salaryRows(rows).length,2);
  assert.equal(salaryGroups(rows,'role')[0].median,47500);
});
test('skill and pair counts count each skill once per advert',()=>{
  const rows=[job('a',{skills:['SQL','SQL','Python']}),job('b',{skills:['SQL']})];
  assert.equal(skillCounts(rows)[0].count,2);
  assert.equal(skillPairs(rows)[0].count,1);
  assert.equal(skillCounts(rows)[0].pct,100);
});
test('missing observation days are omitted rather than converted to zero',()=>{
  const dataset={latest_date:'2026-10-30',dates:['2026-10-01','2026-10-28','2026-10-30'],observations:[job('a'),job('b',{observed_at:'2026-10-28'})]};
  assert.deepEqual(trends(dataset,{}).map(p=>p.date),['2026-10-28','2026-10-30']);
});
test('newly observed counts first seen dates, not repeated sightings or posting dates',()=>{
  const dataset={latest_date:'2026-10-30',observations:[job('a',{observed_at:'2026-10-10'}),job('a'),job('b',{observed_at:'2026-10-25'}),job('b')]};
  assert.equal(newObserved(dataset,{}),1);
  assert.equal(dayOffset('2026-03-01',-1),'2026-02-28');
});
test('CSV exports quote values, escape quotes and neutralize formula-like strings',()=>{
  const csv=csvText([{name:'=1+1',description:'a,"b"',skills:['SQL','Python']},{name:' @SUM(1)',description:'safe',skills:[]}],['name','description','skills']);
  assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"a,""b"""'));assert.ok(csv.includes('SQL; Python'));
  assert.ok(csv.includes('"\' @SUM(1)"'));
});
