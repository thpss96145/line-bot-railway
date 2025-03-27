import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `${process.env.GEMINI_URL}?key=${GEMINI_API_KEY}`;

async function analyzeMessage(text) {
  const prompt = `
你是一個智慧型記帳與生活助理 AI，請根據使用者輸入的自然語言句子，判斷他是要「記帳」還是「提問」。

🧾【記帳訊息】
請回傳格式如下：
{
  "is_expense": true,
  "item": "項目",
  "amount": 金額,
  "participants": 人數（預設為1，如有提到「我和4個人」請自動加1成為5）,
  "category": "餐飲｜交通｜住宿｜娛樂｜訂閱｜醫療｜生活｜學習｜其他"
}

💬【提問訊息】
請回傳格式如下：
{
  "is_expense": false,
  "is_question": true,
  "answer": "繁體中文回答..."
}

📌 請遵守以下規則：
- 所有回答請使用繁體中文。
- \`participants\` 預設為 1。
- \`category\` 請根據語意歸類為：餐飲、交通、住宿、娛樂、訂閱、醫療、生活、學習、其他。
- 若語句中出現「我花了」「花費」「每人出」等描述，即推斷為支出。
- 如果語句中有「和4個人」「共5人」「每人出3000」等描述，請合理推斷總金額與參與人數，包含自己。
- 即使語序不固定、語氣口語化也請盡量辨識記帳意圖。

📚 以下是一些自然語句範例：
- 「我跟5個人一起看電影，每人出3000」
- 「今天和朋友們去看緋紅女巫，每人出了3000」
- 「我請3個人吃飯花了1000」
- 「搭高鐵到台中花了1500」
- 「我們三個人一起吃早餐，總共800」
- 「Netflix訂閱 390 2」
- 「午餐 200」

❌ 若無法明確判斷請回傳：
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
    const rawText = data.candidates[0].content.parts[0].text;
    const jsonText = rawText.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(jsonText);
    console.log("✅ Gemini 回傳：", result);
    return result;
  } catch (error) {
    console.error("❌ JSON 解析錯誤:", error);
    console.error("🧾 原始 Gemini 回傳：", JSON.stringify(data, null, 2));
    return { is_expense: false };
  }
}

export { analyzeMessage };
