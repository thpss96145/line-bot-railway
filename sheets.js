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
    const sheet = doc.sheetsByTitle["LineBot記帳"]; // 根據工作表名稱取得工作表
    const date = new Date().toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });

    // 假設 users 是從群組中獲取的，包含用戶名稱和 ID
    const users = [
      { name: "Finny", id: "Ue1c97b308ff72770da7c81dac5368f13" },
      { name: "Alice", id: "U1234567890abcdef" },
      { name: "Bob", id: "U9876543210abcdef" },
      // 更多用戶...
    ];

    // 計算每人應付的金額
    const perPerson = (amount / participants).toFixed(2);

    // 計算每個人應付的金額
    const participantsInfo = users
      .map((user) => {
        return `${user.name} 應付 $${perPerson}`;
      })
      .join("\n");

    // 隨機選取冷笑話
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

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

    const message = `✅ 記帳成功！\n📝 項目：${item}\n💰 金額：$${amount}\n🏷 類別：${category}\n👥 分帳人數：${participants} 人\n💸 每人應付：$${perPerson}\n${randomJoke}`;
    console.log(message); // 顯示結果

    return message;
  } catch (error) {
    console.error("❌ Google Sheets 記錄失敗:", error);
    return false;
  }
}
