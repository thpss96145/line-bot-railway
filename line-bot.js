import { Client } from "@line/bot-sdk";
import { analyzeMessage } from "./gemini.js";
import { writeExpenseToSheet } from "./sheets.js";
import fetch from "node-fetch";

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET,
};

export const client = new Client(config);

// ✅ 判斷是否需要呼叫 Gemini
function shouldCallGemini(text) {
  const lower = text.toLowerCase().trim();
  const aiTriggers = ["/問", "@ai", "@問", "/ai"];
  return (
    aiTriggers.some((t) => lower.startsWith(t)) || /^\S+\s+\d+/.test(lower)
  );
}

// ✅ 顯示處理中動畫（適用 v2 API）
function sendLoading(userId, seconds = 5) {
  const url = "https://api.line.me/v2/bot/chat/loading/start";
  const payload = {
    chatId: userId,
    loadingSeconds: seconds,
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
    .then((res) => res.json())
    .then((data) => console.log("⏳ 顯示讀取動畫成功", data))
    .catch((err) => console.error("❌ 顯示動畫失敗", err));
}

// ✅ 統一回覆訊息
function replyText(event, text) {
  return client.replyMessage(event.replyToken, {
    type: "text",
    text,
  });
}

// ✅ 主處理邏輯
export async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") return;

  const userMessage = event.message.text.trim();
  const userId = event.source.userId || "未知";
  const groupId = event.source.groupId || "個人";

  console.log("群組 ID:", groupId);
  console.log("用戶 ID:", userId);
  console.log("訊息內容:", userMessage);

  if (!shouldCallGemini(userMessage)) {
    console.log("🙈 跳過：非記帳也非 AI 指令");
    return;
  }

  sendLoading(userId, 5);

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

    return replyText(
      event,
      message || "⚠️ 記帳成功，但寫入 Google Sheets 失敗！請稍後再試。"
    );
  } else if (analysis.is_question && analysis.answer) {
    return replyText(event, analysis.answer);
  } else {
    return replyText(event, "這不是記帳內容喔！");
  }
}
