#!/usr/bin/env node
// Minimal chromium-cli-like REPL driver for wargame-web.
// Used when the `chromium-cli` skill/tool isn't available on the host.
// Reads newline-delimited commands from stdin, drives a persistent
// headless Chromium page, prints one-line results to stdout.
//
// Commands:
//   nav <url>                    goto a URL (relative paths are resolved against BASE_URL)
//   wait-for <selector-or-text>  wait for text=... or a CSS selector
//   click <selector>             click a CSS selector (use text=... for text)
//   fill <selector> <text>       fill an input via Playwright's fill()
//   press <key>                  press a key (e.g. Enter)
//   eval <js>                    run page.evaluate(js) and print the JSON result
//   screenshot [name]            save PNG to shots/<name-or-counter>.png
//   console                      print buffered console messages since last call
//   quit                         close the browser and exit
//
// Usage:
//   node driver.mjs                       # interactive stdin
//   node driver.mjs < script.txt          # batch mode
//   BASE_URL=http://localhost:3000 node driver.mjs

import { chromium } from 'playwright';
import readline from 'node:readline';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SHOTS_DIR = process.env.SHOTS_DIR || path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS_DIR, { recursive: true });

let shotCounter = 0;
const consoleBuf = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (msg) => consoleBuf.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => consoleBuf.push(`[pageerror] ${err.message}`));

function resolveSelector(sel) {
  if (sel.startsWith('text=')) return page.getByText(sel.slice(5), { exact: false });
  return page.locator(sel);
}

async function runLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const [cmd, ...rest] = trimmed.split(' ');
  const arg = rest.join(' ');
  try {
    switch (cmd) {
      case 'nav': {
        const url = arg.startsWith('http') ? arg : new URL(arg, BASE_URL).toString();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        console.log(`ok nav ${url}`);
        break;
      }
      case 'wait-for': {
        await resolveSelector(arg).first().waitFor({ timeout: 15000 });
        console.log(`ok wait-for ${arg}`);
        break;
      }
      case 'click': {
        await resolveSelector(arg).first().click();
        console.log(`ok click ${arg}`);
        break;
      }
      case 'fill': {
        const sp = arg.indexOf(' ');
        const sel = arg.slice(0, sp);
        const text = arg.slice(sp + 1);
        await resolveSelector(sel).first().fill(text);
        console.log(`ok fill ${sel}`);
        break;
      }
      case 'press': {
        await page.keyboard.press(arg);
        console.log(`ok press ${arg}`);
        break;
      }
      case 'eval': {
        const result = await page.evaluate(arg);
        console.log(`ok eval ${JSON.stringify(result)}`);
        break;
      }
      case 'screenshot': {
        const name = arg || String(shotCounter++);
        const file = path.join(SHOTS_DIR, `${name}.png`);
        await page.screenshot({ path: file });
        fs.copyFileSync(file, path.join(SHOTS_DIR, 'screenshot.png'));
        console.log(`ok screenshot ${file}`);
        break;
      }
      case 'console': {
        console.log(consoleBuf.length ? consoleBuf.join('\n') : '(no console output)');
        consoleBuf.length = 0;
        break;
      }
      case 'quit': {
        await browser.close();
        process.exit(0);
      }
      default:
        console.log(`error unknown command: ${cmd}`);
    }
  } catch (err) {
    console.log(`error ${cmd}: ${err.message.split('\n')[0]}`);
  }
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
const queue = [];
let draining = false;

async function drain() {
  if (draining) return;
  draining = true;
  while (queue.length) {
    await runLine(queue.shift());
  }
  draining = false;
}

rl.on('line', (line) => {
  queue.push(line);
  drain();
});
rl.on('close', async () => {
  while (draining || queue.length) await new Promise((r) => setTimeout(r, 20));
  await browser.close();
  process.exit(0);
});
