import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

const SHEET_ID = process.env.SHEET_ID;
const SERVICE_ACCOUNT_JSON = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

// 🚀 修正 `private_key` 換行問題
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
    await doc.useServiceAccountAuth(auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // 選擇第一個工作表
    const date = new Date().toISOString().split("T")[0]; // 取得 YYYY-MM-DD 格式日期

    // 新增一列
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
