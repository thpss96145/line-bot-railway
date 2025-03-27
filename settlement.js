// settlement.js
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";
import fs from "fs";

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
doc.auth = new JWT({
  email: SERVICE_ACCOUNT_JSON.client_email,
  key: SERVICE_ACCOUNT_JSON.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function calculateSettlement(groupId) {
  try {
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    // 過濾出該群組的記帳紀錄，且有分帳人員資訊
    const groupRows = rows.filter(
      (row) =>
        row["群組ID"] === groupId &&
        row["分帳人數"] &&
        row["分帳人數"].includes("U")
    );

    if (groupRows.length === 0) {
      return "⚠️ 查無有效記帳紀錄，請確認是否有填寫分帳人數與使用者 ID。";
    }

    const balances = {};

    for (const row of groupRows) {
      const payer = row["使用者ID"];
      const amount = parseFloat(row["金額"]);
      const participants = row["分帳人數"].split(",").map((id) => id.trim());
      const perPerson = amount / participants.length;

      // 付款人先墊錢
      balances[payer] = (balances[payer] || 0) + amount;

      // 每位分帳人該付的
      for (const user of participants) {
        balances[user] = (balances[user] || 0) - perPerson;
      }
    }

    // 匯總出轉帳對象
    const result = resolveSettlement(balances);
    return result;
  } catch (err) {
    console.error("❌ 結算錯誤：", err);
    return "❌ 發生錯誤，請稍後再試";
  }
}

function resolveSettlement(balances) {
  const creditors = [];
  const debtors = [];

  for (const [user, balance] of Object.entries(balances)) {
    if (balance > 0.01) creditors.push([user, balance]);
    else if (balance < -0.01) debtors.push([user, -balance]);
  }

  const transfers = [];

  while (creditors.length && debtors.length) {
    const [cUser, cAmt] = creditors[0];
    const [dUser, dAmt] = debtors[0];
    const transfer = Math.min(cAmt, dAmt);

    transfers.push(`🧍 ${dUser} 應付 ${cUser} $${transfer.toFixed(0)}`);

    creditors[0][1] -= transfer;
    debtors[0][1] -= transfer;

    if (creditors[0][1] < 0.01) creditors.shift();
    if (debtors[0][1] < 0.01) debtors.shift();
  }

  if (transfers.length === 0) return "✅ 所有人都很公平，沒有需要結算！";
  return "🔄 分帳結算結果：\n\n" + transfers.join("\n");
}
