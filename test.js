const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const fs = require("fs");

// 讀取 Google Sheets ID
const SHEET_ID = "18zy-u5frCYj7fFAighi7oESms61nqU_Ftt_LEdFk6dI";
const SERVICE_ACCOUNT_JSON = JSON.parse(fs.readFileSync("./service-account.json"));

// 設定 JWT 驗證
const auth = new JWT({
    email: SERVICE_ACCOUNT_JSON.client_email,
    key: SERVICE_ACCOUNT_JSON.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function testGoogleSheets() {
    const doc = new GoogleSpreadsheet(SHEET_ID, auth);
    await doc.loadInfo(); // 加載 Google Sheets 資訊
    console.log(`📌 成功連接 Google Sheets: ${doc.title}`);
}

testGoogleSheets();
