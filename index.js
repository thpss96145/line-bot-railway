import express from "express";
import { Client } from "@line/bot-sdk";
import { analyzeMessage } from "./gemini.js";
import { writeExpenseToSheet } from "./sheets.js"; // ✅ 新增 Google Sheets 記錄功能

const app = express();
app.use(express.json());

// ✅ 設定 LINE Bot
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET,
};
const client = new Client(config);

app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  for (let event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userMessage = event.message.text.trim();
      const groupId = event.source.groupId || "個人";
      const userId = event.source.userId || "未知";

      // 🔹 **呼叫 AI 解析記帳內容**
      const analysis = await analyzeMessage(userMessage);
      console.log("🔥 AI 分析結果：", JSON.stringify(analysis, null, 2));

      if (analysis.is_expense) {
        // ✅ **寫入 Google Sheets**
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
