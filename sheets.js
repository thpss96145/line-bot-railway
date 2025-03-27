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
