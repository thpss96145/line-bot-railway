import { Client } from "@line/bot-sdk";
import { analyzeMessage } from "./gemini.js";
import { writeExpenseToSheet } from "./sheets.js";
import fetch from "node-fetch";
import { generateSettlementMessage } from "./settlement.js"; // 確保這行有加
import { setAlias, getName, getUserId } from "./aliasManager.js";

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET,
};

const client = new Client(config);

// 顏色設置，會根據處理次數輪流變色
const colors = ["\x1b[36m", "\x1b[32m", "\x1b[35m"]; // 青、綠、紫
let logColorIndex = 0;

function logBanner(type) {
  const color = colors[logColorIndex % colors.length];
  let logMessage = "";

  if (type === "start") {
    logMessage = `${color}==================== 🚀 開始處理新訊息 ====================\x1b[0m`;
  } else if (type === "end") {
    logMessage = `${color}==================== ✅ 訊息已處理完成 ====================\x1b[0m`;
    logColorIndex++; // 更新顏色索引
  }

  console.log(logMessage); // 顯示日誌訊息
}

// 判斷是否需要呼叫 Gemini
function shouldCallGemini(text) {
  const lower = text.toLowerCase().trim();
  const aiTriggers = ["/問", "@ai", "@問", "/ai"];
  return (
    aiTriggers.some((t) => lower.startsWith(t)) || /^\S+\s+\d+/.test(lower)
  );
}

// 顯示處理中動畫
function sendLoading(userId, seconds = 5) {
  const url = "https://api.line.me/v2/bot/chat/loading/start";
  const payload = { chatId: userId, loadingSeconds: seconds };
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };

  fetch(url, options)
    .then((res) => res.json())
    .then((data) => console.log("⏳ 顯示讀取動畫成功", data));
}

// 統一回覆訊息
function replyText(event, text) {
  return client.replyMessage(event.replyToken, { type: "text", text });
}

// 主處理邏輯
export async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") return;

  const userMessage = event.message.text.trim();
  const userId = event.source.userId || "未知";
  const groupId = event.source.groupId || "個人";

  logBanner("start"); // 顯示開始處理訊息的標記

  // 顯示來源群組、使用者和訊息內容
  console.log(
    "📦 來源：",
    groupId === "個人" ? "個人聊天室" : `群組 ${groupId}`
  );
  console.log("👤 使用者 ID:", userId);
  console.log("💬 訊息內容:", userMessage);

  try {
    // 這裡是你的邏輯處理部分

    // 示例：AI 分析處理後，回應訊息
    if (userMessage.startsWith("我是")) {
      const alias = userMessage.replace("我是", "").trim();
      if (alias.length > 0) {
        setAlias(groupId, userId, alias);
        return replyText(event, `✅ 已紀錄：你在這個群組的暱稱是「${alias}」`);
      } else {
        return replyText(event, "⚠️ 請輸入暱稱，例如：我是謝欣");
      }
    }

    if (userMessage === "/結帳") {
      const result = await generateSettlementMessage(groupId); // 你已有此函式
      return replyText(event, result);
    }

    // 處理 AI 記帳指令
    if (shouldCallGemini(userMessage)) {
      sendLoading(userId, 5);

      const analysis = await analyzeMessage(userMessage, groupId, userId);
      console.log("🔥 AI 分析結果：", JSON.stringify(analysis, null, 2));

      if (analysis.is_expense) {
        // 確保自己加入參與者名單
        const selfAlias = getName(groupId, userId);
        console.log("取得的暱稱:", selfAlias);
        console.log("👥 現有參與者名稱:", analysis.participantsNames);

        // 檢查自己是否在 participantsNames 裡面
        if (Array.isArray(analysis.participantsNames)) {
          const includesSelf = analysis.participantsNames.includes(selfAlias);
          console.log("🤔 是否包含自己:", includesSelf);

          if (!includesSelf && selfAlias) {
            console.log("➕ 補上使用者自己:", selfAlias);
            analysis.participantsNames.push(selfAlias);
          }

          // 🧠 總是依照參與人名數量來設定 participants
          analysis.participants = analysis.participantsNames.length;
        }

        // 寫入 Google Sheets
        const message = await writeExpenseToSheet(
          groupId,
          userId,
          analysis.item,
          analysis.amount,
          analysis.participants,
          analysis.category,
          analysis.participantsNames // 使用已經包含自己的參與者名單
        );

        return replyText(
          event,
          message || "⚠️ 記帳成功，但寫入 Google Sheets 失敗！請稍後再試。"
        );
      }
    }
  } catch (error) {
    console.error("❌ 處理錯誤:", error);
    return replyText(event, "⚠️ 處理過程發生錯誤，請稍後再試。");
  } finally {
    logBanner("end"); // 顯示處理完成的標記
  }
}
