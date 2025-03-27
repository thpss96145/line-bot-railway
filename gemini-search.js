// gemini-search.js

import { checkSearchQuota } from "./limit.js";
import { searchGoogle } from "./search.js"; // 等下會寫這支
import { analyzeMessage } from "./gemini.js"; // 你原本的 AI 接口
import fetch from "node-fetch";

export async function askGeminiWithSearch(userQuestion) {
  if (!checkSearchQuota()) {
    return "🔌 今天已達搜尋上限，請明天再試！";
  }

  const webResult = await searchGoogle(userQuestion);

  const prompt = `根據以下資料，回答使用者的問題：「${userQuestion}」\n\n搜尋結果：\n${webResult}`;

  const response = await analyzeMessage(prompt); // 這會回傳 { is_expense, is_question, answer }

  return response.answer || "⚠️ 無法取得完整回答。";
}
