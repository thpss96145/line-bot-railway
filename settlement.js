// settlement.js
import { getExpensesByGroup } from "./sheets.js";
import { getName, getUserId } from "./aliasManager.js";

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
    const { 使用者ID, 項目, 金額, 參與者 } = row;
    const amount = parseFloat(金額);
    const alias = getName(groupId, 使用者ID);

    if (!使用者ID || !amount || !參與者) continue;

    const names = 參與者.trim().split(/\s+/); // 支援空格分隔
    const participantIds = names
      .map((name) => getUserId(groupId, name))
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
