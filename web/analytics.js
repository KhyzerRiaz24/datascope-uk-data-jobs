/** Pure calculations shared by every page and tested in tests/analytics.test.js.
 * Pipeline JSON -> app.js shared state -> these functions -> page renderers.
 * A snapshot is one observation date, not all historic rows added together.
 */
export const dayOffset = (date, days) => new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);
export const median = values => {
  const a = values.filter(v => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
export function quantile(values, p) {
  const a = values.filter(v => typeof v === 'number' && Number.isFinite(v)).sort((a,b) => a-b);
  if (!a.length) return null;
  const position = (a.length - 1) * p, low = Math.floor(position), fraction = position - low;
  return a[low] + (a[Math.min(low + 1, a.length - 1)] - a[low]) * fraction;
}
export function matches(row, filters) {
  return ['role', 'seniority', 'location', 'working'].every(key => !filters[key] || row[key] === filters[key]);
}
export function snapshot(dataset, filters, date = filters.date || dataset.latest_date) {
  // Enforce uniqueness at the UI boundary too: duplicate rows must not inflate KPIs.
  return [...new Map(dataset.observations.filter(r => r.observed_at === date && matches(r, filters)).map(r => [r.id, r])).values()];
}
export function groupCount(rows, key) {
  const groups = new Map();
  for (const row of rows) groups.set(row[key], (groups.get(row[key]) || 0) + 1);
  return [...groups].map(([name, count]) => ({name, count})).sort((a,b) => b.count-a.count || a.name.localeCompare(b.name));
}
export function skillCounts(rows) {
  const counts = new Map();
  for (const row of rows) for (const skill of new Set(row.skills)) counts.set(skill, (counts.get(skill) || 0) + 1);
  return [...counts].map(([name, count]) => ({name, count, pct: rows.length ? count/rows.length*100 : 0})).sort((a,b) => b.count-a.count || a.name.localeCompare(b.name));
}
export function skillPairs(rows) {
  const counts = new Map();
  for (const row of rows) {
    const skills = [...new Set(row.skills)].sort();
    for (let i=0; i<skills.length; i++) for (let j=i+1; j<skills.length; j++) {
      const pair = `${skills[i]} + ${skills[j]}`;
      counts.set(pair, (counts.get(pair) || 0) + 1);
    }
  }
  return [...counts].map(([name,count]) => ({name,count})).sort((a,b) => b.count-a.count || a.name.localeCompare(b.name));
}
export function salaryRows(rows) {
  // Repeat the eligibility rule explicitly rather than trusting imported derived values.
  return rows.filter(r => r.currency === 'GBP' && r.contract_type === 'permanent' &&
    r.salary_unit === 'annual' && !r.salary_is_predicted &&
    typeof r.salary_min === 'number' && typeof r.salary_max === 'number' &&
    Number.isFinite(r.salary_min) && Number.isFinite(r.salary_max) &&
    r.salary_min > 0 && r.salary_max >= r.salary_min).map(r => ({...r, salary_mid: (r.salary_min+r.salary_max)/2}));
}
export function salaryGroups(rows, key) {
  const eligible = salaryRows(rows);
  return [...new Set(eligible.map(r=>r[key]))].map(name => {
    const values = eligible.filter(r=>r[key]===name).map(r=>r.salary_mid);
    return {name, count: values.length, median:median(values), q1:quantile(values,.25), q3:quantile(values,.75)};
  }).sort((a,b)=>b.median-a.median);
}
export function trends(dataset, filters) {
  const end = filters.date || dataset.latest_date;
  if (!end) return [];
  return dataset.dates.filter(d => d <= end && d >= dayOffset(end,-27)).map(date=>({date,count:snapshot(dataset,filters,date).length}));
}
export function newObserved(dataset, filters) {
  const end = filters.date || dataset.latest_date;
  if (!end) return 0;
  const first = new Map();
  for (const row of dataset.observations) if (row.observed_at <= end) {
    if (!first.has(row.id) || row.observed_at < first.get(row.id)) first.set(row.id,row.observed_at);
  }
  return snapshot(dataset,filters,end).filter(row=>first.get(row.id)>=dayOffset(end,-6)).length;
}
export function csvText(rows, columns) {
  // Quotes prevent broken fields; prefix formula-like strings to stop spreadsheet execution.
  const cell = value => {
    let text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
    if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"','""') + '"';
  };
  return [columns.map(cell).join(','), ...rows.map(row=>columns.map(key=>cell(row[key])).join(','))].join('\r\n');
}
