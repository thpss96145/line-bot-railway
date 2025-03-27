# 記帳 + Gemini AI LINE Bot

這是一個使用 Node.js + LINE Messaging API 製作的智慧型記帳 LINE Bot，整合 Google Sheets 紀錄與 Gemini AI 理解輸入文字，讓你用自然語言記帳或提問。

## ✅ 已實作功能

- ✅ 支援 LINE Bot 的 webhook 事件處理
- ✅ 自然語言記帳，支援多種說法（如「午餐 150」、「機票 30000 2人」）
- ✅ Google Sheets 自動寫入記帳紀錄
- ✅ Gemini AI 分析訊息語意並自動分類
- ✅ 支援 AI 問答（輸入 `/問 xxx` 或 `@ai xxx` 可獲得繁體中文回答）
- ✅ 判斷非記帳訊息不浪費 API 資源

---

## 📦 安裝方式

1. 安裝套件：

```bash
npm install
建立 .env 檔案，填入以下內容：

ini
複製
編輯
LINE_ACCESS_TOKEN=你的LINE Access Token
LINE_SECRET=你的LINE Channel Secret
GEMINI_API_KEY=你的Gemini API金鑰
GEMINI_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
SHEET_ID=你的 Google Sheets ID
放入 service-account.json（Google Sheets 憑證）

🚀 執行方式
bash
複製
編輯
nodemon index.js
使用 ngrok 建立本地 webhook 測試：

bash
複製
編輯
ngrok http 3000
將 https://xxxxx.ngrok-free.app/webhook 設為 LINE Webhook URL。

✏️ 使用方式
🧾 記帳輸入格式：
早餐 100

機票 30000 2人

Uber 250 三個人

交通 400 4人

AI 會自動解析項目、金額、類別與人數，並寫入 Google Sheets。

💬 問問題：
/問 GPT 是什麼？

@ai 台灣GDP

@問 iPhone 18 什麼時候出？

回覆將由 Gemini AI 產生，並使用繁體中文回答。

🔮 開發中規劃（之後會加）
 /結帳：分帳邏輯（計算誰該給誰多少錢）

 /紀錄：查詢今天/這週的記帳內容

 /分類：切換偏好分類、自訂分類

 /設定：指定預設人數、自動分類等

📁 檔案結構
bash
複製
編輯
├── index.js               # 主伺服器邏輯
├── gemini.js              # 處理 Gemini API
├── sheets.js              # Google Sheets 寫入
├── service-account.json   # Google 憑證
├── .env                   # 環境變數
🙌 作者
✨ 開發者：你自己！

🌟 使用技術：Node.js, Express, LINE Messaging API, Gemini API, Google Sheets API