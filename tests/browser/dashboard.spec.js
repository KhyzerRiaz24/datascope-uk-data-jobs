/** End-to-end checks exercise the shipped dataset and real browser interactions. */
import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const dataset=JSON.parse(readFileSync(new URL('../../web/data.json',import.meta.url)));
const latest=dataset.observations.filter(r=>r.observed_at===dataset.latest_date);
test('every page renders with no browser runtime errors',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'A clearer view of data careers.'})).toBeVisible();
  await expect(page.getByText('Demonstration workspace')).toBeVisible();
  for(const [hash,title] of [['jobs','Find your next starting point.'],['skills','Build a useful combination.'],['salary','Compare like with like.'],['quality','Know what is behind the numbers.'],['guide','Understand every connection.']]){
    await page.locator(`#nav a[href="#${hash}"]`).click();
    await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
    await expect(page.locator('#page')).not.toContainText('undefined');
  }
  expect(errors).toEqual([]);
});
test('shared filters persist across pages and salary agrees with known data',async({page})=>{
  await page.goto('/');
  await page.locator('[data-filter="role"]').selectOption('Data Analyst');
  const expected=latest.filter(r=>r.role==='Data Analyst').length;
  await expect(page.locator('.metric-value').first()).toHaveText(String(expected));
  await page.locator('#nav a[href="#salary"]').click();
  const eligible=latest.filter(r=>r.role==='Data Analyst'&&r.salary_mid!=null).map(r=>r.salary_mid).sort((a,b)=>a-b);
  const middle=Math.floor(eligible.length/2), median=eligible.length%2?eligible[middle]:(eligible[middle-1]+eligible[middle])/2;
  await expect(page.locator('.metric-value').first()).toHaveText(new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(median));
  await expect(page.locator('[data-filter="role"]')).toHaveValue('Data Analyst');
  await page.getByRole('button',{name:'Reset filters',exact:true}).first().click();
  await expect(page.locator('[data-filter="role"]')).toHaveValue('');
});
test('search, pagination and CSV export include all matching results',async({page})=>{
  await page.goto('/#jobs');
  await page.locator('#job-search').fill('SQL');
  const expected=latest.filter(r=>`${r.title} ${r.company} ${r.location} ${r.skills.join(' ')}`.toLowerCase().includes('sql')).length;
  await expect(page.locator('.result-count')).toContainText(`${expected} matching opportunities`);
  await page.getByRole('button',{name:'Next →'}).click();
  await expect(page.locator('.pagination')).toContainText('Page 2');
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export CSV ↓'}).click();
  const download=await pending;
  expect(download.suggestedFilename()).toContain('demo-jobs');
  const path=await download.path();
  const csv=readFileSync(path,'utf8');
  expect(csv.trim().split('\r\n').length).toBe(expected+1);
});
test('no-results state can be reset and historical dates really change the snapshot',async({page})=>{
  await page.goto('/#jobs');
  await page.locator('#job-search').fill('this-job-does-not-exist-abcdef');
  await expect(page.getByRole('heading',{name:'No opportunities match your search.'})).toBeVisible();
  await page.locator('#page [data-reset]').click();
  await expect(page.locator('#job-search')).toHaveValue('');
  await page.locator('#nav a[href="#overview"]').click();
  await page.locator('[data-filter="date"]').selectOption(dataset.dates[0]);
  const expected=dataset.observations.filter(r=>r.observed_at===dataset.dates[0]).length;
  await expect(page.locator('.metric-value').first()).toHaveText(String(expected));
});
test('desktop and mobile layouts stay inside the viewport',async({page})=>{
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});
    for(const hash of ['overview','jobs','skills','salary','quality','guide']){
      await page.goto('/#'+hash);
      await expect(page.locator('#page h1').first()).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    }
    await page.goto('/#overview');
    await expect(page.locator('.metric-value').first()).toHaveText(String(latest.length));
    await page.screenshot({path:`test-results/overview-${width}.png`,fullPage:true});
  }
});
test('dataset failure offers a useful retry state instead of a broken screen',async({page})=>{
  await page.route('**/data.json',route=>route.fulfill({status:500,body:'failed'}));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'The dataset could not be opened.'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Try again'})).toBeVisible();
});
test('pages have no serious or critical automated accessibility violations',async({page})=>{
  for(const hash of ['overview','jobs','skills','salary','quality','guide']){
    await page.goto('/#'+hash);
    await expect(page.locator('#page h1').first()).toBeVisible();
    const results=await new AxeBuilder({page}).analyze();
    const issues=results.violations.filter(v=>['serious','critical'].includes(v.impact));
    expect(issues.map(v=>({rule:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),hash).toEqual([]);
  }
});
