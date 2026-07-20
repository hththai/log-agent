import { chromium } from 'playwright';

const url = process.argv[2];
const outfile = process.argv[3];
const width = Number(process.argv[4] || 1600);
const height = Number(process.argv[5] || 900);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
page.on('console', msg => console.log('CONSOLE', msg.type(), msg.text()));
page.on('pageerror', err => console.log('PAGEERROR', err.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: outfile, fullPage: false });
await browser.close();
