import express from "express";
import { Client } from "@line/bot-sdk";
import { analyzeMessage } from "./gemini.js";
import { writeExpenseToSheet } from "./sheets.js";

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
      const groupId = event.source.groupId || "個人";
      const userId = event.source.userId || "未知";

      // ✅ 濾掉不該叫 Gemini 的訊息
      if (!shouldCallGemini(userMessage)) {
        console.log("🛑 不觸發 Gemini：", userMessage);
        return;
      }

      // 🔹 呼叫 AI 解析記帳內容
      const analysis = await analyzeMessage(userMessage);
      console.log("🔥 AI 分析結果：", JSON.stringify(analysis, null, 2));

      if (analysis.is_expense) {
        // ✅ 寫入 Google Sheets 的部分
        const success = await writeExpenseToSheet(
          groupId,
          userId,
          analysis.item,
          analysis.amount,
          analysis.participants,
          analysis.category
        );

        if (success) {
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: `✅ 記帳成功！\n📝 項目：${analysis.item}\n💰 金額：$${analysis.amount}\n🏷 類別：${analysis.category}\n👥 分帳人數：${analysis.participants} 人\n📄 已記錄至 Google Sheets`,
          });
        } else {
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "⚠️ 記帳成功，但寫入 Google Sheets 失敗！請稍後再試。",
          });
        }
      } else if (analysis.is_question) {
        // ✅ AI 問答處理邏輯
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: `🤖 ${analysis.answer}`,
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
