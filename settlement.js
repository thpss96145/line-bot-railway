// settlement.js
import { getExpensesByGroup } from "./sheets.js";
import { getName, getUserId } from "./aliasManager.js";

// 分帳邏輯：計算每人應收/應付
function calculateShares(payments, groupId) {
  console.log("🔄 開始計算每個人的應付金額...");

  const balances = {};

  payments.forEach(({ userId, amount, participants }) => {
    const perPerson = amount / participants.length;
    const payerName = getName(groupId, userId) || userId.slice(-4);

    console.log(
      `💡 項目：${payerName} - 金額：${amount}，每人應付金額：${perPerson}`
    );

    // 所有人先扣應付金額
    participants.forEach((pid) => {
      if (!balances[pid]) balances[pid] = 0;
      const name = getName(groupId, pid) || pid.slice(-4);
      balances[pid] -= perPerson;
      console.log(`💸 使用者 ${name} 應付金額：${balances[pid]}`);
    });

    // 出錢人再加上實際付款金額
    if (!balances[userId]) balances[userId] = 0;
    balances[userId] += amount;
    console.log(
      `💰 使用者 ${payerName} 實際付出：+${amount}，目前餘額：${balances[userId]}`
    );
  });

  console.log("📊 計算完成，最終分帳金額：", balances);
  for (const [uid, amount] of Object.entries(balances)) {
    const name = getName(groupId, uid) || uid.slice(-4);
    const emoji = amount >= 0 ? "👤" : "💸";
    console.log(`${emoji} ${name}：${amount}`);
  }
  return balances;
}

// 最小化轉帳邏輯
function settleBalances(balances, groupId) {
  console.log("🔄 開始最小化轉帳...");

  const debtors = [],
    creditors = [],
    transactions = [];

  for (const user in balances) {
    const amount = balances[user];
    const userName = getName(groupId, user) || user.slice(-4); // 顯示使用者名稱

    if (amount < -1e-6) {
      debtors.push({ user, amount: -amount });
      console.log(`💸 使用者 ${userName} 是債務人，欠款：${amount}`);
    } else if (amount > 1e-6) {
      creditors.push({ user, amount });
      console.log(`💰 使用者 ${userName} 是債權人，應收款：${amount}`);
    }
  }

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amt = Math.min(d.amount, c.amount);

    const fromName = getName(groupId, d.user) || d.user.slice(-4);
    const toName = getName(groupId, c.user) || c.user.slice(-4);

    transactions.push({ from: d.user, to: c.user, amount: amt });

    console.log(`🔁 轉帳：${fromName} ➜ ${toName}：$${amt}`);

    d.amount -= amt;
    c.amount -= amt;

    if (d.amount < 1e-6) i++;
    if (c.amount < 1e-6) j++;
  }

  console.log("📊 完成轉帳計算：", transactions);
  for (const [uid, amount] of Object.entries(balances)) {
    const name = getName(groupId, uid) || uid.slice(-4);
    const emoji = amount >= 0 ? "👤" : "💸";
    console.log(`${emoji} ${name}：${amount}`);
  }
  return transactions;
}

// 生成分帳訊息
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

  const balances = calculateShares(payments, groupId);
  const transactions = settleBalances(balances, groupId);

  if (transactions.length === 0) return "🎉 目前大家都平帳囉！";

  const name = (uid) => getName(groupId, uid) || uid.slice(-4);

  const result = transactions
    .map(({ from, to, amount }) => {
      const fromName = getName(groupId, from) || from.slice(-4);
      const toName = getName(groupId, to) || to.slice(-4);
      return `👉 ${fromName} ➜ 給 ${toName}：$${amount.toFixed(2)}`;
    })
    .join("\n");

  return `💰 分帳結果：\n${result}`;
}
