import { GoogleSpreadsheet } from "google-spreadsheet"; // 👈 引入 google-spreadsheet
import { JWT } from "google-auth-library"; // 👈 引入 google-auth-library
import dotenv from "dotenv"; // 👈 引入 dotenv
import { getName, getUserId, getAliasMap } from "./aliasManager.js"; // ✅ 確保有 export getAliasMap

dotenv.config();

const SHEET_ID = process.env.SHEET_ID;

// ✅ 使用 base64 解碼 Service Account JSON
const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const decoded = Buffer.from(base64, "base64").toString("utf8");
const SERVICE_ACCOUNT_JSON = JSON.parse(decoded);
console.log(
  "🔐 環境變數是否正確讀到：",
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.length
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
  category,
  participantsNames = [] // 👈 新增參與者陣列
) {
  try {
    doc.auth = new JWT({
      email: SERVICE_ACCOUNT_JSON.client_email,
      key: SERVICE_ACCOUNT_JSON.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle["LineBot記帳"];
    const date = new Date().toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
    });

    // 👇 放在 try 裡、寫入表單前的邏輯區段
    const selfAlias = getName(groupId, userId);
    console.log("🔐 全部 aliases:", JSON.stringify(getAliasMap(), null, 2));
    console.log("🔍 使用者ID:", userId);
    console.log("🆔 暱稱 selfAlias:", selfAlias);
    console.log("👥 現有參與者名稱:", participantsNames);

    // 看參與者裡面有沒有人對應到自己的 userId
    const includesSelf = participantsNames.some((name) => {
      const id = getUserId(groupId, name);
      console.log(`🔁 檢查參與者「${name}」對應到 userId: ${id}`);
      return id === userId;
    });

    console.log("🤔 使用者是否已包含在參與者中:", includesSelf);

    if (selfAlias && !includesSelf) {
      console.log("✅ 補上使用者自己:", selfAlias);
      participantsNames.push(selfAlias);
    } else {
      console.log("📌 不需補上使用者，已在名單中");
    }

    // ✅ 強制用實際參與者數
    const finalParticipants = participantsNames.length || 1;
    const perPerson = (amount / participants).toFixed(2);

    const message = `✅ 記帳成功！\n📝 項目：${item}\n💰 金額：$${amount}\n🏷 類別：${category}\n👥 分帳人數：${participants} 人\n🙋‍♀️ 參與者：${participantsNames.join(
      " "
    )}\n💸 每人應付：$${perPerson}\n${
      jokes[Math.floor(Math.random() * jokes.length)]
    }`;

    console.log("📤 將寫入的資料：", {
      日期: date,
      群組ID: groupId,
      使用者ID: userId,
      項目: item,
      金額: amount,
      分帳人數: finalParticipants,

      類別: category,
      參與者: participantsNames.join(" "),
    });

    await sheet.addRow({
      日期: date,
      群組ID: groupId,
      使用者ID: userId,
      項目: item,
      金額: amount,
      分帳人數: participantsNames.length,
      類別: category,
      參與者: participantsNames.join(" "), // ✅ 新欄位
    });

    return message;
  } catch (error) {
    console.error("❌ Google Sheets 記錄失敗:", error);
    return false;
  }
}

/// ✅ 讀取 Google Sheets 的資料
export async function getExpensesByGroup(groupId) {
  const doc = new GoogleSpreadsheet(SHEET_ID);

  doc.auth = new JWT({
    email: SERVICE_ACCOUNT_JSON.client_email,
    key: SERVICE_ACCOUNT_JSON.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[1]; // 你目前記帳資料放在第二個分頁
  const rows = await sheet.getRows();
  console.log("📊 資料筆數：", rows.length);

  // 檢查欄位名稱
  const headers = sheet.headerValues;
  console.log("📝 頁面欄位名稱：", headers);

  const getIndex = (key) => headers.indexOf(key);
  const idxGroupId = getIndex("群組ID");
  const idxUserId = getIndex("使用者ID");
  const idxItem = getIndex("項目");
  const idxAmount = getIndex("金額");
  const idxParticipants = getIndex("分帳人數");
  const idxCategory = getIndex("類別");
  const idxNames = getIndex("參與者");
  const idxDate = getIndex("日期"); // ✅ 抓日期欄位 index
  const today = new Date().toLocaleDateString("zh-TW", {
    timeZone: "Asia/Taipei",
  });

  // 檢查是否找到必要的欄位
  if (
    idxGroupId === -1 ||
    idxUserId === -1 ||
    idxItem === -1 ||
    idxAmount === -1 ||
    idxParticipants === -1 ||
    idxCategory === -1 ||
    idxNames === -1
  ) {
    console.error("❌ 找不到必要的欄位！");
    return [];
  }

  // 列印出每一行的資料，確保每個欄位對應正確
  rows.forEach((row, idx) => {
    console.log(`🧪 [第 ${idx + 1} 筆資料]`);
    console.log("群組ID:", row._rawData[idxGroupId]);
    console.log("使用者ID:", row._rawData[idxUserId]);
    console.log("項目:", row._rawData[idxItem]);
    console.log("金額:", row._rawData[idxAmount]);
    console.log("分帳人數:", row._rawData[idxParticipants]);
    console.log("類別:", row._rawData[idxCategory]);
    console.log("參與者:", row._rawData[idxNames]);
  });

  const normalize = (s) => s?.toString().trim();

  const filtered = rows.filter((row, idx) => {
    const rawGroupId = normalize(row._rawData?.[idxGroupId]);
    const expected = normalize(groupId);
    const match = rawGroupId === expected;

    const rowDate = normalize(row._rawData?.[idxDate])?.split(" ")[0];
    const today = new Date().toLocaleDateString("zh-TW", {
      timeZone: "Asia/Taipei",
    });
    const matchDate = rowDate === today;

    if (!match) {
      console.log(`🧪 [第${idx + 1}筆] 不符合群組ID`);
      console.log(`👉 rawGroupId: "${rawGroupId}"`);
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
      date: raw[idxDate], // <-- 這裡你需要新增「日期」欄位
    };
  });
}
