// limit.js
import fs from "fs";

const LIMIT = 100;
const path = "./data/search-quota.json";

// ✅ 取得台灣今天日期 YYYY-MM-DD
function getTaiwanDateString() {
  return new Date()
    .toLocaleDateString("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-"); // 轉為 2025-03-27 格式
}

export function checkSearchQuota() {
  const today = getTaiwanDateString();
  let data = { date: today, count: 0 };

  // 如果有檔案 ➝ 嘗試讀取
  if (fs.existsSync(path)) {
    try {
      data = JSON.parse(fs.readFileSync(path, "utf8"));

      // 若不是今天 ➝ 重設
      if (data.date !== today) {
        data = { date: today, count: 0 };
      }
    } catch (err) {
      console.warn("⚠️ 無法讀取 search-quota.json，將自動重建");
    }
  }

  // 超過上限 ➝ 不准再用
  if (data.count >= LIMIT) return false;

  // 遞增計數 + 儲存
  data.count++;
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  return true;
}
