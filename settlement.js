// settlement.js
import { getName } from "./aliasManager.js";

const groupId = "Cc0c3f0be56c135ac12cfca231f8a84e5"; // 假設的群組ID
const userId = "Ue1c97b308ff72770da7c81dac5368f13"; // 假設的使用者ID
const alias = getName(groupId, userId);
console.log(`使用者 ${userId} 的暱稱是：${alias}`); // 應該會顯示 "謝"

// ✅ 假資料
const payments = [
  {
    userId: "Ue1c97b308ff72770da7c81dac5368f13", // "謝"
    amount: 300,
    participants: [
      "Ue1c97b308ff72770da7c81dac5368f13", // "謝"
      "U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8", // "楊"
      "U5e4c8f7c3b7a49d8a9d5b6f1236e845a", // 何
    ],
  },
  {
    userId: "U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8", // "楊"
    amount: 500,
    participants: [
      "U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8", // "楊"
      "U5e4c8f7c3b7a49d8a9d5b6f1236e845a", // 何
    ],
  },
  {
    userId: "U5e4c8f7c3b7a49d8a9d5b6f1236e845a", // "何"
    amount: 990,
    participants: [
      "Ue1c97b308ff72770da7c81dac5368f13", // "謝"
      "U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8", // "楊"
      "U5e4c8f7c3b7a49d8a9d5b6f1236e845a", // 何
    ],
  },
];

function calculateShares(payments) {
  console.log("🔄 開始計算每個人的應付金額...\n");

  const balances = {};

  payments.forEach(({ userId, amount, participants }) => {
    const perPerson = amount / participants.length;
    const payerName = getName(groupId, userId) || userId.slice(-4);
    console.log(
      `📌 項目：${payerName} - 金額：${amount}，每人應付金額：${perPerson}`
    );

    participants.forEach((pid) => {
      const name = getName(groupId, pid) || pid.slice(-4);
      if (!balances[pid]) balances[pid] = 0;

      if (pid === userId) {
        balances[pid] += amount - perPerson;
        console.log(`💰 使用者 ${name} 應收金額：${balances[pid]}`);
      } else {
        balances[pid] -= perPerson;
        console.log(`💸 使用者 ${name} 應付金額：${balances[pid]}`);
      }
    });
  });

  console.log("\n📊 計算完成，最終分帳金額：");
  for (const [uid, bal] of Object.entries(balances)) {
    const name = getName(groupId, uid) || uid.slice(-4);
    console.log(`👤 ${name}：${bal}`);
  }

  return balances;
}

function settleBalances(balances) {
  console.log("\n🔄 開始最小化轉帳...\n");

  const debtors = [],
    creditors = [],
    transactions = [];

  for (const user in balances) {
    const amount = balances[user];
    const name = getName(groupId, user) || user.slice(-4);
    if (amount < -1e-6) {
      debtors.push({ user, amount: -amount });
      console.log(`💸 使用者 ${name} 是債務人，欠款：${-amount}`);
    } else if (amount > 1e-6) {
      creditors.push({ user, amount });
      console.log(`💰 使用者 ${name} 是債權人，應收款：${amount}`);
    }
  }

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amt = Math.min(d.amount, c.amount);

    transactions.push({ from: d.user, to: c.user, amount: amt });

    const fromName = getName(groupId, d.user) || d.user.slice(-4);
    const toName = getName(groupId, c.user) || c.user.slice(-4);
    console.log(`🔁 轉帳：${fromName} ➜ ${toName}：$${amt}`);

    d.amount -= amt;
    c.amount -= amt;

    if (d.amount < 1e-6) i++;
    if (c.amount < 1e-6) j++;
  }

  console.log(
    "📊 完成轉帳計算：",
    transactions.map(({ from, to, amount }) => ({
      from: getName(groupId, from) || from.slice(-4),
      to: getName(groupId, to) || to.slice(-4),
      amount,
    }))
  );
  return transactions;
}

// ✅ 假資料用來產生訊息
export async function generateSettlementMessage(groupId) {
  console.log("⚙️ 使用假資料計算分帳...");

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

  return `💰 分帳結果（假資料）：\n${result}`;
}
