/** PAGE 2: opportunities. Shared snapshot -> local search/sort -> paginated table.
 * Export includes every matching search result, not just the visible page.
 * Uses safe text escaping; only validated http(s) source URLs are clickable.
 */
import {csvText} from '../analytics.js';
import {heading,e,money,number,dateLabel,empty,downloadCSV} from '../ui.js';
let query='',sort='newest',page=1;
const pageSize=12;
export function reset() { query='';sort='newest';page=1; }
export function render(ctx) {
  return heading('OPPORTUNITIES','Find your next starting point.','Search the observed adverts and compare the details that matter.')+
    `<section class="panel jobs-panel"><div class="jobs-toolbar"><label class="search-box"><span aria-hidden="true">⌕</span><span class="sr-only">Search job title, employer or skills</span><input id="job-search" type="search" placeholder="Search a title, employer or skill…" value="${e(query)}"></label><label class="sort-control">Sort by <select id="job-sort"><option value="newest" ${sort==='newest'?'selected':''}>Posting date</option><option value="salary" ${sort==='salary'?'selected':''}>Annual salary</option><option value="title" ${sort==='title'?'selected':''}>Job title</option></select></label><button class="button" id="export-jobs">Export CSV ↓</button></div><div id="job-results"></div></section><p class="footnote">${ctx.dataset.mode==='demo'?'All employers and adverts in this demonstration are fictional.':'Observed adverts can close or change. Check the original listing before applying.'} Annual figures are shown only for comparable, disclosed permanent GBP ranges.</p>`;
}
export function mount(ctx) {
  page=1;
  function selected() {
    const words=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return ctx.rows.filter(r=>words.every(word=>`${r.title} ${r.company} ${r.location} ${r.skills.join(' ')}`.toLowerCase().includes(word))).sort((a,b)=>sort==='salary'?(b.salary_mid??-1)-(a.salary_mid??-1):sort==='title'?a.title.localeCompare(b.title):b.posted_at.localeCompare(a.posted_at)||a.title.localeCompare(b.title));
  }
  function update() {
    const rows=selected(),pages=Math.max(1,Math.ceil(rows.length/pageSize));page=Math.min(page,pages);
    document.getElementById('job-results').innerHTML=rows.length?`<div class="result-count">${number(rows.length)} matching opportunities <span>· Snapshot ${e(dateLabel(ctx.filters.date))}</span></div><div class="table-scroll"><table><thead><tr><th scope="col">Opportunity</th><th scope="col">Location / working</th><th scope="col">Advertised salary</th><th scope="col">Skills mentioned</th></tr></thead><tbody>${rows.slice((page-1)*pageSize,page*pageSize).map(r=>`<tr><td><div class="job-title">${r.url&&/^https?:\/\//.test(r.url)?`<a href="${e(r.url)}" target="_blank" rel="noopener noreferrer">${e(r.title)} ↗</a>`:e(r.title)}</div><div class="table-sub">${e(r.company)}</div><span class="pill ${r.seniority==='Entry level'?'pill-green':''}">${e(r.seniority)}</span></td><td>${e(r.location)}<div class="table-sub">${e(r.working)}</div></td><td>${r.salary_mid!=null?`${money(r.salary_min)}–${money(r.salary_max)}<div class="table-sub">per year · permanent</div>`:r.salary_min!=null&&r.salary_max!=null?`${e(r.currency==='GBP'?'£':r.currency+' ')}${number(r.salary_min)}–${number(r.salary_max)}<div class="table-sub">${e(r.salary_unit)} · ${e(r.contract_type)}${r.salary_is_predicted?' · estimated':''}</div>`:'<span class="muted">Not disclosed</span>'}</td><td><div class="skills-wrap">${r.skills.slice(0,4).map(s=>`<span class="skill-tag">${e(s)}</span>`).join('')}${r.skills.length>4?`<span class="more-skills" title="${e(r.skills.slice(4).join(', '))}">+${r.skills.length-4}</span>`:''}</div></td></tr>`).join('')}</tbody></table></div><div class="pagination"><span>Showing ${(page-1)*pageSize+1}–${Math.min(page*pageSize,rows.length)} of ${number(rows.length)}</span><div><button class="button small" id="prev-page" ${page===1?'disabled':''}>← Previous</button><span>Page ${page} of ${pages}</span><button class="button small" id="next-page" ${page===pages?'disabled':''}>Next →</button></div></div>`:empty('No opportunities match your search.','Clear the search box or choose different filters.');
    document.getElementById('prev-page')?.addEventListener('click',()=>{page--;update();});
    document.getElementById('next-page')?.addEventListener('click',()=>{page++;update();});
  }
  document.getElementById('job-search').addEventListener('input',event=>{query=event.target.value;page=1;update();});
  document.getElementById('job-sort').addEventListener('change',event=>{sort=event.target.value;page=1;update();});
  document.getElementById('export-jobs').addEventListener('click',()=>downloadCSV(csvText(selected(),['title','company','role','seniority','location','working','salary_min','salary_max','salary_unit','contract_type','currency','salary_is_predicted','skills','posted_at','observed_at','source','url']),`datascope-${ctx.dataset.mode}-jobs-${ctx.filters.date}.csv`));
  update();
}
