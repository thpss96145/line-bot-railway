import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

const SHEET_ID = process.env.SHEET_ID;

// ✅ 使用 base64 解碼 Service Account JSON
const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const decoded = Buffer.from(base64, "base64").toString("utf8");
const SERVICE_ACCOUNT_JSON = JSON.parse(decoded);
console.log(
  "🔐 環境變數是否正確讀到：",
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.length
);

const doc = new GoogleSpreadsheet(SHEET_ID);

const auth = new JWT({
  email: SERVICE_ACCOUNT_JSON.client_email,
  key: SERVICE_ACCOUNT_JSON.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// 定義冷笑話陣列
const jokes = [
  "錢不是問題，記帳才是。💸",
  "越記越窮，代表你有在花錢！🧾",
  "記帳前我是人，記完我是神。😇",
  "今天也沒有漏掉一筆錢，感動。🥹",
  "花錢一時爽，記帳火葬場。🔥",
  "謝謝你讓我活在表格裡。📊",
  "帳還沒記，錢就沒了。🤯",
  "記帳：理性戰勝慾望的瞬間。🧠",
  "你記的不是帳，是未來的自己。💡",
  "這筆記下去，你就自由一點。🕊️",
];

export async function writeExpenseToSheet(
  groupId,
  userId,
  item,
  amount,
  participants,
  category
) {
  try {
    doc.auth = new JWT({
      email: SERVICE_ACCOUNT_JSON.client_email,
      key: SERVICE_ACCOUNT_JSON.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["LineBot記帳"];
    const date = new Date().toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });

    const perPerson = (amount / participants).toFixed(2);

    const message = `✅ 記帳成功！\n📝 項目：${item}\n💰 金額：$${amount}\n🏷 類別：${category}\n👥 分帳人數：${participants} 人\n💸 每人應付：$${perPerson}\n${
      jokes[Math.floor(Math.random() * jokes.length)]
    }`;

    console.log("📤 將寫入的資料：", {
      日期: date,
      群組ID: groupId,
      使用者ID: userId,
      項目: item,
      金額: amount,
      分帳人數: participants,
      類別: category,
    });

    await sheet.addRow({
      日期: date,
      群組ID: groupId,
      使用者ID: userId,
      項目: item,
      金額: amount,
      分帳人數: participants,
      類別: category,
    });

    return message;
  } catch (error) {
    console.error("❌ Google Sheets 記錄失敗:", error);
    return false;
  }
}
