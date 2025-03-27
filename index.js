// index.js
import express from "express";
import { handleEvent } from "./line-bot.js";

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const events = req.body.events || [];
  for (const event of events) {
    try {
      await handleEvent(event);
    } catch (err) {
      console.error("❌ 處理事件時發生錯誤：", err);
    }
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 記帳機器人正在監聽 ${PORT} 埠口...`);
});
