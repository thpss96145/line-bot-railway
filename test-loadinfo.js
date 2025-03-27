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

async function testLoadInfo() {
  try {
    console.log("🚀 嘗試執行 doc.loadInfo()...");
    await doc.useServiceAccountAuth(auth);
    await doc.loadInfo();
    console.log("✅ 成功讀取 Google Sheets");
    console.log(`📄 總共有 ${doc.sheetCount} 個工作表`);
  } catch (error) {
    console.error("❌ 讀取 Google Sheets 失敗:", error);
  }
}

testLoadInfo();
