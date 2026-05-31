#!/usr/bin/env node
/**
 * 檢查 .env 必要環境變數是否完整
 * 使用方式：node tools/check_env.js
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

const REQUIRED = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_TBA_KEY",
];

if (!existsSync(envPath)) {
  console.error("❌ .env 檔案不存在！請參考 .env.example 建立。");
  process.exit(1);
}

const content = readFileSync(envPath, "utf-8");
const defined = new Set(
  content
    .split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => l.split("=")[0].trim())
);

let ok = true;
for (const key of REQUIRED) {
  if (defined.has(key)) {
    console.log(`✅ ${key}`);
  } else {
    console.error(`❌ ${key} 缺少！`);
    ok = false;
  }
}

if (!ok) {
  console.error("\n請補齊上述環境變數後重試。");
  process.exit(1);
} else {
  console.log("\n✅ 所有必要環境變數已設定。");
}
