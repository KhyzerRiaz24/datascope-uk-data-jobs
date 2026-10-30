/** PAGE 1: overview. Receives filtered rows from app.js; links to deeper pages.
 * Reads trends, salary eligibility and skill counts from analytics.js.
 * No KPI is hardcoded: changing shared filters recalculates every value.
 */
import {median,salaryRows,skillCounts,groupCount,trends,newObserved} from '../analytics.js';
import {heading,metric,panel,bars,lineChart,number,money,percent,empty,e,dateLabel} from '../ui.js';
export function render({dataset,filters,rows}) {
  const paid=salaryRows(rows),entry=rows.filter(r=>r.seniority==='Entry level'),skills=skillCounts(rows);
  const top=skills[0];
  return heading('THE BIG PICTURE','A clearer view of data careers.','Explore the roles, skills and salary ranges behind your next move.',`<a class="button button-primary" href="#jobs">Explore opportunities <span aria-hidden="true">↗</span></a>`)+
    (!rows.length?empty():`<div class="metrics">${metric('Observed opportunities',number(rows.length),`${number(newObserved(dataset,filters))} first observed in the past 7 days`,true)}${metric('Median advertised salary',money(median(paid.map(r=>r.salary_mid))),`${paid.length} comparable permanent salary ranges`)}${metric('Explicitly entry level',percent(entry.length,rows.length),`${entry.length} adverts with a junior or graduate title`)}${metric('Fully remote',percent(rows.filter(r=>r.working==='Remote').length,rows.length),'Hybrid roles counted separately')}</div>
    <div class="overview-main">${panel('Opportunity pulse','Distinct adverts observed over the last 28 calendar days',lineChart(trends(dataset,filters)),`<span class="badge">${e(dateLabel(filters.date))}</span>`)}
    <aside class="insight"><div class="eyebrow">IN THIS SNAPSHOT</div><h2>${e(top?.name||'Skills')} ${top?'leads the skill mentions.':'need more description coverage.'}</h2><p>${top?`${number(top.count)} of ${number(rows.length)} filtered adverts mention ${e(top.name)}. Explore combinations to see which skills appear together.`:'Open the methodology to see how skill matching works.'}</p><a href="#skills">Explore the skills landscape <span aria-hidden="true">→</span></a><div class="insight-bottom">${dataset.mode==='demo'?'Illustrative pattern from synthetic data.':'Observed sample, not a whole-market estimate.'}</div></aside></div>
    <div class="two-columns">${panel('Skills in demand','Adverts mentioning each skill · a job can mention several',bars(skills,{denominator:rows.length,limit:6}),'<a class="text-link" href="#skills">View skills →</a>')}${panel('Where the opportunities are','Distinct adverts by advertised location',bars(groupCount(rows,'location'),{denominator:rows.length,limit:6}),'<a class="text-link" href="#jobs">View jobs →</a>')}</div>
    <div class="footnote">${dataset.mode==='demo'?'Synthetic demonstration data. These figures illustrate functionality and are not UK labour-market findings.':'Figures describe collected adverts only. Search coverage, missing salaries and unclassified titles affect interpretation.'} <a href="#quality">Review data quality →</a></div>`);
}
