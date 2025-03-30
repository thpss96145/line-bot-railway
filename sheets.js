import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";
import { getName, getUserId } from "./aliasManager.js";

dotenv.config();

const SHEET_ID = process.env.SHEET_ID;
const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!base64) throw new Error("❌ 缺少 GOOGLE_SERVICE_ACCOUNT_JSON");
const decoded = Buffer.from(base64, "base64").toString("utf8");
const SERVICE_ACCOUNT_JSON = JSON.parse(decoded);

console.log("🔐 環境變數是否正確讀到：", base64?.length);

const auth = new JWT({
  email: SERVICE_ACCOUNT_JSON.client_email,
  key: SERVICE_ACCOUNT_JSON.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const doc = new GoogleSpreadsheet(SHEET_ID);

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
  category,
  participantsNames = []
) {
  try {
    doc.auth = auth;
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["LineBot記帳"];
    const date = new Date().toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });

    const selfAlias = getName(groupId, userId);
    const includesSelf = participantsNames.some(
      (name) => getUserId(groupId, name) === userId
    );

    if (selfAlias && !includesSelf) {
      participantsNames.push(selfAlias);
    }

    const finalParticipants = participantsNames.length || 1;
    const perPerson = (amount / participants).toFixed(2);

    const message = `✅ 記帳成功！\n📝 項目：${item}\n💰 金額：$${amount}\n🏷 類別：${category}\n👥 分帳人數：${participants} 人\n🙋‍♀️ 參與者：${participantsNames.join(
      ","
    )}\n💸 每人應付：$${perPerson}\n${
      jokes[Math.floor(Math.random() * jokes.length)]
    }`;

    await sheet.addRow({
      日期: date,
      群組ID: groupId,
      使用者ID: userId,
      項目: item,
      金額: amount,
      分帳人數: finalParticipants,
      類別: category,
      參與者: participantsNames.join(" "),
    });

    return message;
  } catch (error) {
    console.error("❌ Google Sheets 記錄失敗:", error);
    return false;
  }
}

export async function getExpensesByGroup(groupId) {
  doc.auth = auth;
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle["LineBot記帳"];
  const rows = await sheet.getRows();

  const headers = sheet.headerValues;
  const getIndex = (key) => headers.indexOf(key);

  const idxGroupId = getIndex("群組ID");
  const idxUserId = getIndex("使用者ID");
  const idxItem = getIndex("項目");
  const idxAmount = getIndex("金額");
  const idxParticipants = getIndex("分帳人數");
  const idxCategory = getIndex("類別");
  const idxNames = getIndex("參與者");
  const idxDate = getIndex("日期");

  const today = new Date().toLocaleDateString("zh-TW", {
    timeZone: "Asia/Taipei",
  });

  const normalize = (s) => s?.toString().trim();

  const filtered = rows.filter((row, idx) => {
    const rawGroupId = normalize(row._rawData?.[idxGroupId]);
    const expected = normalize(groupId);
    const match = rawGroupId === expected;

    const rowDate = normalize(row._rawData?.[idxDate])?.split(" ")[0];
    const matchDate = rowDate === today;

    if (!match || !matchDate) {
      console.log(`🧪 [第${idx + 1}筆] 不符條件`);
      if (!match) console.log(`👉 群組ID不符: "${rawGroupId}"`);
      if (!matchDate) console.log(`👉 日期不符: "${rowDate}" vs "${today}"`);
    }

    return match && matchDate;
  });

  console.log(`✅ 有 ${filtered.length} 筆資料符合群組 ${groupId}`);

  return filtered.map((row) => {
    const raw = row._rawData;
    return {
      userId: raw[idxUserId],
      item: raw[idxItem],
      amount: Number(raw[idxAmount]),
      participants: Number(raw[idxParticipants]),
      category: raw[idxCategory],
      names: raw[idxNames],
      date: raw[idxDate],
    };
  });
}

export async function saveAliasBinding(groupId, userId, alias) {
  try {
    doc.auth = auth;
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["Alias綁定"];
    await sheet.addRow({
      群組ID: groupId,
      使用者ID: userId,
      暱稱: alias,
    });
    console.log(`✅ 成功寫入 Alias 綁定: ${groupId} ${userId} => ${alias}`);
  } catch (err) {
    console.error("❌ 寫入 alias 綁定失敗：", err);
  }
}

export async function loadAliasBindingsFromSheet() {
  try {
    doc.auth = auth;
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["Alias綁定"];
    const rows = await sheet.getRows();
    const aliasMap = {};

    for (const row of rows) {
      const data = row.toObject(); // ✅ 用這個轉成物件
      const gid = data["群組ID"];
      const uid = data["使用者ID"];
      const alias = data["暱稱"];

      if (!gid || !uid || !alias) continue;

      if (!aliasMap[gid]) aliasMap[gid] = {};
      aliasMap[gid][uid] = alias;
      aliasMap[gid][alias] = uid;
    }

    return aliasMap;
  } catch (err) {
    console.error("❌ 載入 alias 綁定失敗：", err);
    return {};
  }
}
