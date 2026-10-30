/** Application controller: index.html shell -> data.json -> shared filter state
 * -> analytics.snapshot() -> selected page module. Page links are URL hashes so
 * refresh/back/forward work on a plain static host with no routing server.
 */
import * as overview from './pages/overview.js';
import * as jobs from './pages/jobs.js';
import * as skills from './pages/skills.js';
import * as salary from './pages/salary.js';
import * as quality from './pages/quality.js';
import * as guide from './pages/guide.js';
import {snapshot} from './analytics.js';
import {e,icon,dateLabel} from './ui.js';

const pages={overview:{label:'Market overview',module:overview},jobs:{label:'Opportunities',module:jobs},skills:{label:'Skill landscape',module:skills},salary:{label:'Salary intelligence',module:salary},quality:{label:'Data quality',module:quality},guide:{label:'How it works',module:guide}};
let dataset,filters={role:'',seniority:'',location:'',working:'',date:''};
const current=()=>Object.hasOwn(pages,location.hash.slice(1))?location.hash.slice(1):'overview';
function filterMarkup() {
  const controls=[['role','Role family'],['seniority','Seniority'],['location','Location'],['working','Working style']];
  return `<div class="filter-head"><span>EXPLORE THE DATA</span><button class="reset" data-reset>Reset filters</button></div><div class="filter-grid">${controls.map(([key,label])=>{
    const options=[...new Set(dataset.observations.filter(r=>r.observed_at===filters.date).map(r=>r[key]))].sort();
    if(filters[key]&&!options.includes(filters[key]))options.push(filters[key]);
    return `<label>${e(label)}<select data-filter="${key}"><option value="">All ${key==='seniority'?'levels':key==='working'?'arrangements':key==='role'?'roles':'locations'}</option>${options.map(value=>`<option value="${e(value)}" ${filters[key]===value?'selected':''}>${e(value)}</option>`).join('')}</select></label>`;
  }).join('')}<label>Observation date<select data-filter="date">${[...dataset.dates].reverse().map(date=>`<option value="${e(date)}" ${filters.date===date?'selected':''}>${e(dateLabel(date))}</option>`).join('')}</select></label></div>`;
}
function render() {
  const page=current(),config=pages[page];
  document.title=`${config.label} · DataScope`;
  document.getElementById('breadcrumb').textContent=config.label;
  document.getElementById('nav').innerHTML=Object.entries(pages).map(([key,value],i)=>`${i===4?'<div class="nav-divider"></div><div class="nav-label">THE PROJECT</div>':''}<a href="#${key}" class="nav-item ${key===page?'active':''}" ${key===page?'aria-current="page"':''}>${icon(key)}<span>${e(value.label)}</span>${key===page?'<span class="nav-indicator"></span>':''}</a>`).join('');
  document.getElementById('filters').innerHTML=filterMarkup();
  const ctx={dataset,filters,rows:snapshot(dataset,filters)};
  document.getElementById('page').innerHTML=config.module.render(ctx);
  config.module.mount?.(ctx);
}
document.addEventListener('change',event=>{
  const key=event.target.dataset.filter;if(!key)return;
  filters[key]=event.target.value;render();
  document.querySelector(`[data-filter="${key}"]`)?.focus();
});
document.addEventListener('click',event=>{
  if(event.target.closest('[data-reset]')){filters={role:'',seniority:'',location:'',working:'',date:dataset.latest_date};jobs.reset();render();}
});
window.addEventListener('hashchange',()=>{if(dataset){render();document.getElementById('main').focus({preventScroll:true});window.scrollTo(0,0);}});
async function boot() {
  try {
    const response=await fetch('./data.json',{cache:'no-cache'});
    if(!response.ok)throw new Error('The exported dataset could not be loaded.');
    dataset=await response.json();
    if(dataset.schema_version!==1||!Array.isArray(dataset.observations)||!dataset.dates?.length||!Array.isArray(dataset.runs))throw new Error('The dataset is empty or has an unsupported format.');
    filters.date=dataset.latest_date;
    const demo=dataset.mode==='demo';
    const sourceLabel=demo?'Demonstration workspace':dataset.mode==='imported'?'Imported dataset':'Adzuna UK sample';
    document.getElementById('dataset-banner').innerHTML=`<div class="dataset-banner ${demo?'demo-banner':''}"><div><span class="status-dot"></span><strong>${e(sourceLabel)}</strong><span class="banner-detail">${demo?'Synthetic data. Explore the product; these are not real market figures.':`Latest observation: ${e(dateLabel(dataset.latest_date))}. Collected adverts, not total market demand.`}</span></div><a href="#quality">View provenance →</a></div>`;
    render();
  } catch(error) {
    document.getElementById('filters').hidden=true;
    document.getElementById('page').innerHTML=`<div class="empty"><h1>The dataset could not be opened.</h1><p>${e(error.message)}</p><p>Run the data pipeline from the project folder, then serve the web folder over HTTP. See README.md for the exact steps.</p><button class="button" id="retry">Try again</button></div>`;
    document.getElementById('retry').onclick=()=>location.reload();
  }
}
boot();
