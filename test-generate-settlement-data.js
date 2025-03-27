// test-generate-settlement-data.js
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const SHEET_ID = process.env.SHEET_ID;
const SERVICE_ACCOUNT_JSON = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);
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

const mockData = [
  {
    userId: "U1",
    groupId: "G1",
    item: "午餐",
    amount: 300,
    participants: 3,
    category: "餐飲",
  },
  {
    userId: "U2",
    groupId: "G1",
    item: "咖啡",
    amount: 450,
    participants: 3,
    category: "飲料",
  },
  {
    userId: "U3",
    groupId: "G1",
    item: "車票",
    amount: 150,
    participants: 3,
    category: "交通",
  },
];

async function insertMockData() {
  try {
    doc.auth = auth;
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["LineBot記帳"];

    for (const entry of mockData) {
      const date = new Date().toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei",
      });
      await sheet.addRow({
        日期: date,
        群組ID: entry.groupId,
        使用者ID: entry.userId,
        項目: entry.item,
        金額: entry.amount,
        分帳人數: entry.participants,
        類別: entry.category,
      });
      console.log(`✅ 寫入成功：${entry.item} - $${entry.amount}`);
    }

    console.log("🎉 所有測試資料寫入完畢！");
  } catch (err) {
    console.error("❌ 寫入失敗：", err);
  }
}

insertMockData();
