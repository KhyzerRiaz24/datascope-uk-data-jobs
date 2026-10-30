/** Shared presentational helpers. Pages call these; calculations live in analytics.js.
 * Escape all dataset strings before inserting markup, including imported job text.
 */
export const e = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const number = value => new Intl.NumberFormat('en-GB').format(value);
export const money = value => value == null ? 'Not available' : new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(value);
export const percent = (a,b) => b ? `${Math.round(a/b*100)}%` : '—';
export const dateLabel = value => value ? new Date(value+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}) : 'No observation date';
export const shortDate = value => new Date(value+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
export const heading = (eyebrow,title,description,action='') => `<div class="page-heading"><div><div class="eyebrow">${e(eyebrow)}</div><h1>${e(title)}</h1><p>${e(description)}</p></div>${action}</div>`;
export const empty = (title='No jobs match these filters.',text='Try another role, location or seniority, or reset the filters.') => `<div class="empty"><span aria-hidden="true">⌕</span><h2>${e(title)}</h2><p>${e(text)}</p><button class="button" data-reset>Reset filters</button></div>`;
export const metric = (label,value,note,accent=false) => `<article class="metric ${accent?'metric-accent':''}"><div class="metric-label">${e(label)}</div><div class="metric-value">${e(value)}</div><div class="metric-note">${e(note)}</div></article>`;
export const panel = (title,subtitle,body,extra='') => `<section class="panel"><div class="panel-heading"><div><h2>${e(title)}</h2><p>${e(subtitle)}</p></div>${extra}</div>${body}</section>`;
export function bars(items, {denominator, value='count', format=number, limit=8}={}) {
  const shown=items.slice(0,limit), max=Math.max(...shown.map(x=>x[value]),1);
  return `<div class="bar-chart">${shown.map((item,i)=>`<div class="bar-row"><div class="bar-label"><span>${e(item.name)}</span><span class="bar-number">${e(format(item[value]))}${denominator?` <small>${percent(item[value],denominator)}</small>`:''}</span></div><div class="bar-track"><div class="bar-fill ${i===0?'bar-primary':''}" style="width:${item[value]/max*100}%"></div></div></div>`).join('')}</div>`;
}
export function lineChart(points) {
  if (!points.length) return '<p class="muted">No historical observations in this period.</p>';
  const w=760,h=210,left=38,right=15,top=18,bottom=35,max=Math.max(...points.map(p=>p.count),1);
  const x=i=>left+i*(w-left-right)/Math.max(points.length-1,1),y=v=>top+(h-top-bottom)*(1-v/max);
  const path=points.map((p,i)=>`${i?'L':'M'} ${x(i)} ${y(p.count)}`).join(' ');
  const grid=[0,.5,1].map(v=>`<line x1="${left}" x2="${w-right}" y1="${y(v*max)}" y2="${y(v*max)}" class="chart-grid"/><text x="${left-9}" y="${y(v*max)+4}" text-anchor="end">${Math.round(v*max)}</text>`).join('');
  const labels=[...new Set([0,Math.floor((points.length-1)/2),points.length-1])].map(i=>`<text x="${x(i)}" y="${h-12}" text-anchor="${i===0?'start':i===points.length-1?'end':'middle'}">${e(shortDate(points[i].date))}</text>`).join('');
  return `<div class="chart-axis">Distinct adverts observed</div><svg class="line-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Distinct adverts observed by date. ${points.map(p=>`${p.date}: ${p.count}`).join('; ')}">${grid}<path d="${path} L ${x(points.length-1)} ${y(0)} L ${x(0)} ${y(0)} Z" class="chart-area"/><path d="${path}" class="chart-line"/>${points.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.count)}" r="3" class="chart-dot"><title>${e(dateLabel(p.date))}: ${p.count} adverts</title></circle>`).join('')}${labels}</svg><div class="chart-caption">Observation date (UTC) · Filters apply to every date · Missing days are not recorded as zero</div>`;
}
export function downloadCSV(text,filename) {
  const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/csv;charset=utf-8;'}));
  const link=document.createElement('a'); link.href=url; link.download=filename; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export const icon = name => {
  const paths={overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',jobs:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3"/>',skills:'<path d="M4 20V10m8 10V4m8 16v-7"/>',salary:'<circle cx="12" cy="12" r="9"/><path d="M15 7h-3a2 2 0 0 0-2 2v8m-3-5h7m-7 5h9"/>',quality:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',guide:'<path d="M4 4h6l2 2 2-2h6v16h-6l-2 1-2-1H4zM12 6v15M7 9h2m6 0h2M7 13h2m6 0h2"/>'};
  return `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.overview}</svg>`;
};
