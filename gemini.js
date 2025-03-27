import fetch from "node-fetch";
import dotenv from "dotenv";

// ✅ 載入 `.env` 變數
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `${process.env.GEMINI_URL}?key=${GEMINI_API_KEY}`;

async function analyzeMessage(text) {
  const prompt = `
你是一個智慧型記帳與生活助理 AI，請根據使用者輸入的內容，判斷他是要「記帳」還是「提問」。

🧾 【記帳訊息】
若使用者輸入的是一筆支出紀錄（例如：「午餐 150」、「買咖啡 2人 100元」、「我們 4 個人去六福村玩花了 28000」），請回傳以下 JSON 格式：
{
  "is_expense": true,
  "item": "午餐",
  "amount": 150,
  "participants": 1,
  "category": "餐飲"
}

💬 【提問訊息】
若使用者是在詢問事情（例如：「/問 iPhone18 什麼時候出」、「@ai GPT 是什麼」），請回傳：
{
  "is_expense": false,
  "is_question": true,
  "answer": "繁體中文回答..."
}

📌 請遵守以下規則：
- 「participants」 預設為 1，若語句中提到多個人，請正確辨識分帳人數。
- 「category」 可根據語意歸類為：餐飲、交通、住宿、娛樂、訂閱、醫療、生活、學習、其他。
- 所有回答請使用繁體中文。
- 若無法判斷是什麼用途，請回傳：
{
  "is_expense": false
}

---

使用者輸入如下：
"""${text}"""
請用 JSON 格式回覆。
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

    // ✅ 去掉 ```json 這類格式
    const jsonText = rawText.replace(/```json\n|\n```/g, "").trim();

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("JSON 解析錯誤:", error);
    return { is_expense: false };
  }
}

export { analyzeMessage };
