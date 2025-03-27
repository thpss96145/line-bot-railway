import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const SHEET_ID = process.env.SHEET_ID;

// ✅ 改成從檔案載入 JSON（更安全更乾淨）
const SERVICE_ACCOUNT_JSON = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

// 🔧 修正 private_key 換行
SERVICE_ACCOUNT_JSON.private_key = SERVICE_ACCOUNT_JSON.private_key.replace(
  /\\n/g,
  "\n"
);

const doc = new GoogleSpreadsheet(SHEET_ID);
const auth = new JWT({
  email: SERVICE_ACCOUNT_JSON.client_email,
  key: SERVICE_ACCOUNT_JSON.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
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
    const sheet = doc.sheetsByIndex[0]; // 選擇第一個工作表
    const date = new Date().toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
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

    console.log("✅ 記帳成功，已寫入 Google Sheets");
    return true;
  } catch (error) {
    console.error("❌ Google Sheets 記錄失敗:", error);
    return false;
  }
}
