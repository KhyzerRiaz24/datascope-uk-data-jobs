/** PAGE 3: skills. Counts each skill once per advert; percentages use ALL filtered
 * jobs as denominator. Pairs are co-occurrence, never proof of salary or hiring impact.
 * Links back to opportunities so users can inspect the underlying adverts.
 */
import {skillCounts,skillPairs} from '../analytics.js';
import {heading,panel,bars,e,number,empty,percent} from '../ui.js';
export function render({rows}) {
  if(!rows.length)return heading('SKILL LANDSCAPE','Build a useful combination.','See which skills employers mention together.')+empty();
  const skills=skillCounts(rows),pairs=skillPairs(rows),covered=rows.filter(r=>r.skills.length).length;
  return heading('SKILL LANDSCAPE','Build a useful combination.','Explore skill mentions and the combinations that appear in the same advert.')+
    `<div class="two-columns skills-columns">${panel('Most-mentioned skills','Number and share of filtered adverts mentioning each skill',skills.length?bars(skills,{denominator:rows.length,limit:14}):'<p>No tracked skill keywords were found in this snapshot.</p>')}
    <div>${panel('Skills that travel together','Top combinations · each pair counted once per advert',pairs.length?`<ol class="pair-list">${pairs.slice(0,8).map((p,i)=>`<li><span class="pair-rank">${String(i+1).padStart(2,'0')}</span><span>${e(p.name)}<small>${percent(p.count,rows.length)} of filtered adverts</small></span><strong>${number(p.count)}</strong></li>`).join('')}</ol>`:'<p>No tracked skill pairs were found.</p>')}
    <aside class="note-panel"><div class="eyebrow">READ THE SIGNAL CORRECTLY</div><h2>A mention is a clue, not a guarantee.</h2><p>${percent(covered,rows.length)} of these adverts contain at least one tracked skill. Keywords can miss synonyms, and API descriptions may be shortened. Skill percentages can add up to more than 100%.</p><a class="text-link" href="#guide">See the matching rules →</a></aside></div></div>`;
}
