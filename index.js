// index.js
import express from "express";
import { handleEvent } from "./line-bot.js";
import { loadAliasBindingsFromSheet } from "./sheets.js";
import { setAliasMap, getUserId } from "./aliasManager.js";

const aliasMap = await loadAliasBindingsFromSheet();
console.log("🧾 載入 aliasMap 檢查：", JSON.stringify(aliasMap, null, 2));
setAliasMap(aliasMap); // ✅ 載入後寫入 aliasManager

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const events = req.body.events || [];
  for (const event of events) {
    try {
      await handleEvent(event);
    } catch (err) {
      console.error("❌ 處理事件時發生錯誤：", err);
    }
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 記帳機器人正在監聽 ${PORT} 埠口...`);
});

const testGroup = "Cc0c3f0be56c135ac12cfca231f8a84e5";
console.log("🔍 測試 getUserId(謝):", getUserId(testGroup, "謝"));
console.log("🔍 測試 getUserId(楊):", getUserId(testGroup, "楊"));
