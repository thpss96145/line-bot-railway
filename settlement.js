// settlement.js（優化後版本）
import { getExpensesByGroup } from "./sheets.js";
import { getName, getUserId } from "./aliasManager.js";

// 🔧 工具函式：取得顯示名稱
const showName = (groupId, uid) => getName(groupId, uid) || uid.slice(-4);

// 🔧 工具函式：解析單一記帳資料列
function parseSheetRow(row, groupId) {
  const { userId, amount, names } = row;
  if (!userId || !amount || !names) return null;

  const alias = getName(groupId, userId);
  const nameList = names.trim().split(/\s+/);

  const participantIds = nameList
    .map((name) => getUserId(groupId, name))
    .filter((id) => !!id);

  if (!participantIds.includes(userId)) participantIds.push(userId);

  return {
    userId,
    name: alias || "某人",
    amount: parseFloat(amount),
    participants: participantIds,
  };
}

// 🔍 分帳邏輯：計算每人應收/應付
function calculateShares(payments, groupId) {
  const balances = {};

  payments.forEach(({ userId, amount, participants }) => {
    const perPerson = amount / participants.length;

    participants.forEach((pid) => {
      balances[pid] = (balances[pid] || 0) - perPerson;
    });

    balances[userId] = (balances[userId] || 0) + amount;
  });

  return balances;
}

// 🤝 債務最小化演算法
function settleBalances(balances, groupId) {
  const debtors = [],
    creditors = [],
    transactions = [];

  for (const user in balances) {
    const amt = balances[user];
    if (amt < -1e-6) debtors.push({ user, amount: -amt });
    if (amt > 1e-6) creditors.push({ user, amount: amt });
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

// 🧾 主邏輯：產生結帳訊息
export async function generateSettlementMessage(groupId) {
  const rows = await getExpensesByGroup(groupId);
  if (!rows?.length) return "⚠️ 找不到記帳資料。";

  const payments = rows
    .map((row) => parseSheetRow(row, groupId))
    .filter((p) => !!p);

  if (payments.length === 0) return "⚠️ 無有效記帳資料。";

  const balances = calculateShares(payments, groupId);
  const transactions = settleBalances(balances, groupId);

  if (transactions.length === 0) return "🎉 目前大家都平帳囉！";

  return (
    "💰 分帳結果：\n" +
    transactions
      .map(
        ({ from, to, amount }) =>
          `👉 ${showName(groupId, from)} ➜ 給 ${showName(
            groupId,
            to
          )}：$${amount.toFixed(2)}`
      )
      .join("\n")
  );
}
