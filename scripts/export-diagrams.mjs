// Export the original renderer as real standalone SVG files, with dev running.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser=await chromium.launch();
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:3000/demo/water-cycle');
 const target=new URL('../public/illustrations/water-cycle/',import.meta.url);await mkdir(target,{recursive:true});
 for(const condition of ['low','medium','high']){
  await page.getByLabel('Demo visual density').selectOption(condition);
  const svg=await page.locator('.lesson-canvas>svg').evaluate(el=>{el.setAttribute('xmlns','http://www.w3.org/2000/svg');return el.outerHTML;});
  await writeFile(new URL(`cycle-${condition}.svg`,target),svg+'\n');
 }
 console.log('Exported three original standalone SVG density diagrams.');
}finally{await browser.close();}
