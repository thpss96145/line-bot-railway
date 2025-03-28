// settlement.js
import { getExpensesByGroup } from "./sheets.js";
import { getName, getUserId, setAlias } from "./aliasManager.js";

const groupId = "Cc0c3f0be56c135ac12cfca231f8a84e5"; // 假設的群組ID
// 假設一個使用者訊息
const userId = "Ue1c97b308ff72770da7c81dac5368f13"; // 假設的使用者ID
const alias = getName(groupId, userId);
console.log(`使用者 ${userId} 的暱稱是：${alias}`); // 應該會顯示 "謝"

// 假資料：分帳項目
const payments = [
  {
    userId: "Ue1c97b308ff72770da7c81dac5368f13", // 使用者 "謝"
    amount: 300,
    participants: [
      "Ue1c97b308ff72770da7c81dac5368f13",
      "U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8",
    ], // "謝" 和 "楊"
  },
  {
    userId: "U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8", // 使用者 "楊"
    amount: 300,
    participants: [
      "U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8",
      "U3c8a9d4d5a3b43aebea3e4e8b0c63429",
    ], // "楊" 和 "王"
  },
];

const balances = calculateShares(payments);
const transactions = settleBalances(balances);
console.log("分帳交易：", transactions);
// 📦 步驟 1：計算每人淨收支金額
function calculateShares(payments) {
  const balances = {};

  payments.forEach(({ userId, amount, participants }) => {
    const perPerson = amount / participants.length;

    participants.forEach((pid) => {
      if (!balances[pid]) balances[pid] = 0;
      if (pid === userId) {
        balances[pid] += amount - perPerson;
      } else {
        balances[pid] -= perPerson;
      }
    });
  });

  return balances;
}

// 💸 步驟 2：根據 balances 最小化轉帳
function settleBalances(balances) {
  const debtors = [],
    creditors = [],
    transactions = [];

  for (const user in balances) {
    const amount = balances[user];
    if (amount < -1e-6) debtors.push({ user, amount: -amount });
    else if (amount > 1e-6) creditors.push({ user, amount });
  }

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amt = Math.min(d.amount, c.amount);

    transactions.push({ from: d.user, to: c.user, amount: amt });

    d.amount -= amt;
    c.amount -= amt;

    if (d.amount < 1e-6) i++;
    if (c.amount < 1e-6) j++;
  }

  return transactions;
}

// 🔁 整合主邏輯
export async function generateSettlementMessage(groupId) {
  const rows = await getExpensesByGroup(groupId);
  if (!rows || rows.length === 0) return "⚠️ 找不到記帳資料。";

  const payments = [];

  for (const row of rows) {
    const 使用者ID = row.userId;
    const 金額 = row.amount;
    const 參與者 = row.names;
    const 項目 = row.item;
    const amount = parseFloat(金額);
    const alias = getName(groupId, 使用者ID);

    if (!使用者ID || !amount || !參與者) continue;

    const names = 參與者.trim().split(/\s+/); // 支援空格分隔

    const participantIds = names
      .map((name) => {
        const id = getUserId(groupId, name);
        if (!id) {
          console.log(`❗ 無法找到暱稱「${name}」對應的 userId`);
        }
        return id;
      })
      .filter((id) => !!id);

    if (!participantIds.includes(使用者ID)) participantIds.push(使用者ID);

    payments.push({
      userId: 使用者ID,
      name: alias || "某人",
      amount,
      participants: participantIds,
    });
  }

  if (payments.length === 0) return "⚠️ 無有效記帳資料。";

  const balances = calculateShares(payments);
  const transactions = settleBalances(balances);

  if (transactions.length === 0) return "🎉 目前大家都平帳囉！";

  const name = (uid) => getName(groupId, uid) || uid.slice(-4);

  const result = transactions
    .map(
      ({ from, to, amount }) =>
        `👉 ${name(from)} ➜ 給 ${name(to)}：$${amount.toFixed(2)}`
    )
    .join("\n");

  return `💰 分帳結果：\n${result}`;
}
