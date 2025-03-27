import { analyzeMessage } from "./gemini.js";

(async () => {
  try {
    const result = await analyzeMessage("機票 35700 3");
    console.log("AI 判斷結果:", result);
  } catch (error) {
    console.error("測試 `analyzeMessage` 發生錯誤:", error);
  }
})();
