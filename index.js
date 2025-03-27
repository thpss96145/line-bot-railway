import express from "express";
import { Client } from "@line/bot-sdk";
import { analyzeMessage } from "./gemini.js";
import { writeExpenseToSheet } from "./sheets.js";
import { askGeminiWithSearch } from "./gemini-search.js"; // 先確保你有 export 這個函式

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

function shouldCallGemini(text) {
  const lower = text.toLowerCase().trim();
  const aiTriggers = ["/問", "@ai", "@問", "/ai"];

  // 啟動 Gemini 問答的觸發指令
  if (aiTriggers.some((t) => lower.startsWith(t))) return true;

  // 像「午餐 120」這類有金額的記帳句
  const expenseLike = /^\S+\s+\d+/.test(lower);
  if (expenseLike) return true;

  // 其餘內容不處理
  return false;
}

app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  for (let event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userMessage = event.message.text.trim();
      const groupId = event.source.groupId || "個人";
      const userId = event.source.userId || "未知";

      console.log("群組 ID:", groupId);
      console.log("用戶 ID:", userId);
      console.log("使用者訊息:", userMessage);

      // 🟢 檢查是否為「搜尋型 AI 指令」
      if (
        userMessage.startsWith("/問") ||
        userMessage.startsWith("@ai") ||
        userMessage.startsWith("@問") ||
        userMessage.startsWith("/ai")
      ) {
        const reply = await askGeminiWithSearch(userMessage);
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: reply,
        });
        return; // ⛔ 跳過後面流程
      }

      // ✅ 若判斷不是記帳句也不是 AI 指令 ➝ 忽略
      if (!shouldCallGemini(userMessage)) {
        console.log("🙈 跳過：不是記帳句也不是 AI 指令");
        continue;
      }

      // ✅ 進行 AI 分析
      const analysis = await analyzeMessage(userMessage);
      console.log("🔥 AI 分析結果：", JSON.stringify(analysis, null, 2));

      if (analysis.is_expense) {
        const message = await writeExpenseToSheet(
          groupId,
          userId,
          analysis.item,
          analysis.amount,
          analysis.participants,
          analysis.category
        );

        await client.replyMessage(event.replyToken, {
          type: "text",
          text:
            message || "⚠️ 記帳成功，但寫入 Google Sheets 失敗！請稍後再試。",
        });
      } else if (analysis.is_question && analysis.answer) {
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: analysis.answer,
        });
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
