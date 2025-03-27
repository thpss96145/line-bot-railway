import express from "express";
import { Client } from "@line/bot-sdk";
import { analyzeMessage } from "./gemini.js";
import { writeExpenseToSheet } from "./sheets.js";
import fetch from "node-fetch"; // 引入 node-fetch

const app = express();
app.use(express.json());

// 設定 LINE Bot
const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET,
};
const client = new Client(config);

// 判斷是否需要調用 Gemini
function shouldCallGemini(text) {
  const lower = text.toLowerCase().trim();
  return (
    ["/問", "@ai", "@問", "/ai"].some((t) => lower.startsWith(t)) || // 問答指令
    /^\S+\s+\d+/.test(lower) // 記帳句
  );
}

// 發送讀取動畫
function sendLoading(userId, seconds = 5) {
  const url = "https://api.line.me/v2/bot/chat/loading/start"; // 發送讀取動畫的API
  const payload = {
    chatId: userId, // 設定聊天對象ID
    loadingSeconds: seconds, // 設定讀取動畫的持續時間
  };

  const options = {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.LINE_ACCESS_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };

  fetch(url, options)
    .then((response) => response.json())
    .then((data) => console.log("Loading animation started:", data))
    .catch((error) => console.error("Error sending loading animation:", error));
}

// 回應錯誤訊息
function replyError(event, message) {
  return client.replyMessage(event.replyToken, {
    type: "text",
    text: message,
  });
}

// 設定 Webhook 路由
app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  for (let event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userMessage = event.message.text.trim();
      const userId = event.source.userId || "未知";
      const groupId = event.source.groupId || "個人";

      console.log("群組 ID:", groupId);
      console.log("用戶 ID:", userId);
      console.log("使用者訊息:", userMessage);

      // 檢查是否為「搜尋型 AI 指令」
      if (
        userMessage.startsWith("/問") ||
        userMessage.startsWith("@ai") ||
        userMessage.startsWith("@問") ||
        userMessage.startsWith("/ai")
      ) {
        sendLoading(userId, 5); // 顯示 5 秒的「處理中」動畫

        try {
          // 執行 Gemini 查詢處理
          const analysis = await analyzeMessage(userMessage);
          if (analysis.is_question && analysis.answer) {
            await client.replyMessage(event.replyToken, {
              type: "text",
              text: analysis.answer,
            });
          } else {
            await replyError(event, "⚠️ 無法處理您的問題，請稍後再試。");
          }
        } catch (error) {
          console.error("Gemini API 錯誤：", error);
          await replyError(event, "⚠️ 目前無法處理您的問題，請稍後再試。");
        }
        return; // 跳過後面流程
      }

      // 若判斷不是記帳句也不是 AI 指令 ➝ 忽略
      if (!shouldCallGemini(userMessage)) {
        console.log("🙈 跳過：不是記帳句也不是 AI 指令");
        continue;
      }

      // 進行 AI 分析
      const analysis = await analyzeMessage(userMessage);
      console.log("🔥 AI 分析結果：", JSON.stringify(analysis, null, 2));

      // 記帳處理
      if (analysis.is_expense) {
        sendLoading(userId, 5); // 顯示 5 秒的「處理中」動畫

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
