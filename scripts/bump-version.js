#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const read = (name) => JSON.parse(fs.readFileSync(path.join(process.cwd(), name), "utf8"));
const write = (name, data) =>
  fs.writeFileSync(path.join(process.cwd(), name), JSON.stringify(data, null, 2) + "\n");

const config = read("app.json");
const current = config.expo.version;
const wanted = process.argv[2];

const next = wanted || current.replace(/(\d+)$/, (n) => String(Number(n) + 1));

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(next) || next === current) {
  console.error(`✘ Cannot bump ${current} to ${next}`);
  process.exit(1);
}

config.expo.version = next;
config.expo.android.versionCode = (config.expo.android.versionCode || 0) + 1;
write("app.json", config);

const pkg = read("package.json");
pkg.version = next;
write("package.json", pkg);

if (fs.existsSync(path.join(process.cwd(), "package-lock.json"))) {
  const lock = read("package-lock.json");
  lock.version = next;
  if (lock.packages && lock.packages[""]) lock.packages[""].version = next;
  write("package-lock.json", lock);
}

console.log(`✔ ${current} → ${next} (versionCode ${config.expo.android.versionCode})`);
