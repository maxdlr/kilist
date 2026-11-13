#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app.json");
const config = JSON.parse(fs.readFileSync(file, "utf8"));
const current = config.expo.version;
const wanted = process.argv[2];

const next = wanted || current.replace(/(\d+)$/, (n) => String(Number(n) + 1));

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(next) || next === current) {
  console.error(`✘ Cannot bump ${current} to ${next}`);
  process.exit(1);
}

config.expo.version = next;
config.expo.android.versionCode = (config.expo.android.versionCode || 0) + 1;

fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
console.log(`✔ ${current} → ${next} (versionCode ${config.expo.android.versionCode})`);
