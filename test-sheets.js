import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

const SHEET_ID = process.env.SHEET_ID;
const SERVICE_ACCOUNT_JSON = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

console.log("✅ 讀取 SHEET_ID:", SHEET_ID);
console.log("✅ 讀取 Service Account:", SERVICE_ACCOUNT_JSON.client_email);

const doc = new GoogleSpreadsheet(SHEET_ID);
const auth = new JWT({
  email: SERVICE_ACCOUNT_JSON.client_email,
  key: SERVICE_ACCOUNT_JSON.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

doc.auth = auth;

async function testLoadInfo() {
  try {
    console.log("🚀 嘗試執行 doc.loadInfo()...");
    await doc.loadInfo();
    console.log("✅ 成功讀取 Google Sheets！");

    console.log("📄 總共有", doc.sheetCount, "個工作表");
  } catch (error) {
    console.error("❌ 讀取 Google Sheets 失敗:", error);
  }
}

testLoadInfo();

export async function writeExpenseToSheet(
  groupId,
  userId,
  item,
  amount,
  participants,
  category
) {
  try {
    console.log("🚀 嘗試連接 Google Sheets...");
    await doc.loadInfo(); // 這一行可能卡住
    console.log("✅ 成功連接 Google Sheets！");

    const sheet = doc.sheetsByIndex[0]; // 取得第一個工作表
    console.log("📄 取得第一個工作表:", sheet.title);

    const date = new Date().toISOString().split("T")[0];

    await sheet.addRow({
      日期: date,
      群組ID: groupId,
      使用者ID: userId,
      項目: item,
      金額: amount,
      分帳人數: participants,
      類別: category,
    });

    console.log("✅ 記帳成功，寫入 Google Sheets");
    return true;
  } catch (error) {
    console.error("❌ Google Sheets 記錄失敗:", error);
    return false;
  }
}
