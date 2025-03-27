import fetch from "node-fetch";
import dotenv from "dotenv";

// ✅ 載入 `.env` 變數
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `${process.env.GEMINI_URL}?key=${GEMINI_API_KEY}`;

async function analyzeMessage(text) {
  const prompt = `
    你是一個記帳助手，請判斷這段文字是否是記帳資訊：
    1. **如果是記帳**，請回傳**純 JSON**，格式如下（不要有 Markdown 標記）：
       {
         "is_expense": true,
         "item": "記帳項目",
         "amount": 金額（整數）,
         "participants": 人數（整數，預設為1）,
         "category": "消費類別"
       }
    2. **如果這段訊息不是記帳內容**，請回傳：
       {
         "is_expense": false
       }
       
    📌 **請務必只回傳 JSON，不要有 Markdown 格式！**

    ✅ **範例**
    - "午餐 150"  → { "is_expense": true, "item": "午餐", "amount": 150, "participants": 1, "category": "餐飲" }
    - "機票 35700 3"  → { "is_expense": true, "item": "機票", "amount": 35700, "participants": 3, "category": "交通" }
    - "買車 200 4"  → { "is_expense": true, "item": "買車", "amount": 200, "participants": 4, "category": "購物" }

    訊息內容："${text}"
    `;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  try {
    console.log("AI API 回應:", JSON.stringify(data, null, 2)); // 🛠️ 印出完整的 AI 回應
    const rawText = data.candidates[0].content.parts[0].text;

    // ✅ **去掉 Markdown 格式 (` ```json ... ``` `)**
    const jsonText = rawText.replace(/```json\n|\n```/g, "").trim();

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("JSON 解析錯誤:", error);
    return { is_expense: false };
  }
}

// ✅ 確保 `export` 正確
export { analyzeMessage };
