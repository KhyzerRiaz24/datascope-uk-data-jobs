/** Capture real dashboard screenshots for README/LinkedIn, with provenance visible.
 * Owns and cleans up a temporary local server. It never contacts a live jobs API.
 */
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output=path.join(root,'docs/images');
const address='http://127.0.0.1:8767';
const server=spawn('python3',['-m','http.server','8767','--bind','127.0.0.1','--directory',path.join(root,'web')],{stdio:'ignore'});
let browser;
try {
  let ready=false;
  for(let i=0;i<50;i++){
    if(server.exitCode!==null)throw new Error('The screenshot server could not start. Check port 8767.');
    try{const response=await fetch(address);if(response.ok){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(!ready)throw new Error('The screenshot server did not become ready.');
  await mkdir(output,{recursive:true});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  for(const hash of ['overview','skills','salary','quality']){
    await page.goto(`${address}/#${hash}`);
    await page.locator('#page h1').waitFor();
    await page.getByText('Demonstration workspace',{exact:true}).waitFor();
    await page.screenshot({path:path.join(output,`${hash}-desktop.png`),fullPage:true});
  }
  await page.setViewportSize({width:390,height:900});
  await page.goto(address+'/#overview');
  await page.locator('#page h1').waitFor();
  await page.screenshot({path:path.join(output,'overview-mobile.png'),fullPage:true});
  console.log('Captured five dashboard screenshots in docs/images/.');
}finally{
  await browser?.close();
  server.kill('SIGTERM');
}
