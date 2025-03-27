import express from "express";
import { Client } from "@line/bot-sdk";
import { analyzeMessage } from "./gemini.js";
import { writeExpenseToSheet } from "./sheets.js";

// ✅ 冷笑話清單
const jokes = [
  "錢不是問題，記帳才是。💸",
  "越記越窮，代表你有在花錢！🧾",
  "記帳前我是人，記完我是神。😇",
  "今天也沒有漏掉一筆錢，感動。🥹",
  "花錢一時爽，記帳火葬場。🔥",
  "謝謝你讓我活在表格裡。📊",
  "帳還沒記，錢就沒了。🤯",
  "記帳：理性戰勝慾望的瞬間。🧠",
  "你記的不是帳，是未來的自己。💡",
  "這筆記下去，你就自由一點。🕊️",
];

const app = express();
app.use(express.json());

// ✅ 設定 LINE Bot
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET,
};
const client = new Client(config);

// ✅ 判斷是否需要叫 Gemini
function shouldCallGemini(text) {
  const lower = text.toLowerCase();
  const triggers = ["/問", "@ai", "@問", "/ai"];
  if (triggers.some((t) => lower.includes(t))) return true;
  const expenseLike = /^\s*\S+\s+\d+/.test(text);
  return expenseLike;
}

app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  for (let event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userMessage = event.message.text.trim();
      const groupId = event.source.groupId || "個人"; // 如果是群組，會有 groupId，否則預設為 '個人'
      const userId = event.source.userId || "未知"; // 確保獲得用戶 ID

      console.log("群組 ID:", groupId);
      console.log("用戶 ID:", userId);

      // 呼叫 AI 解析記帳內容
      const analysis = await analyzeMessage(userMessage);
      console.log("🔥 AI 分析結果：", JSON.stringify(analysis, null, 2));

      if (analysis.is_expense) {
        // 確保將群組ID、用戶ID、項目等資料寫入 Google Sheets
        const message = await writeExpenseToSheet(
          groupId, // 傳遞群組 ID
          userId, // 傳遞用戶 ID
          analysis.item, // 項目名稱
          analysis.amount, // 金額
          analysis.participants, // 分帳人數
          analysis.category // 類別
        );

        if (message) {
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: message,
          });
        } else {
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "⚠️ 記帳成功，但寫入 Google Sheets 失敗！請稍後再試。",
          });
        }
      } else {
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: "這不是記帳內容喔！",
        });
      }
    }
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("🚀 Listening on port 3000"));
