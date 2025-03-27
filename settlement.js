// settlement.js
const mockData = [
  // 假設 Finny 付 300 給三人分帳
  { userId: "U1", name: "Finny", amount: 300, participants: 3 },
  // Alice 付 450 給三人分帳
  { userId: "U2", name: "Alice", amount: 450, participants: 3 },
  // Bob 付 150 給三人分帳
  { userId: "U3", name: "Bob", amount: 150, participants: 3 },
];

// step 1: 計算每人應付金額
const members = {};

// 初始化每人帳目
mockData.forEach((row) => {
  const perPerson = row.amount / row.participants;

  mockData.forEach((member) => {
    if (!members[member.userId]) {
      members[member.userId] = { name: member.name, paid: 0, shouldPay: 0 };
    }
  });

  Object.values(members).forEach((member) => {
    member.shouldPay += perPerson;
  });

  members[row.userId].paid += row.amount;
});

// step 2: 計算差額
const balances = Object.entries(members).map(([userId, m]) => ({
  userId,
  name: m.name,
  balance: +(m.paid - m.shouldPay).toFixed(2),
}));

// step 3: 找出債務與債權人，做簡化轉帳
const debtors = balances
  .filter((b) => b.balance < 0)
  .sort((a, b) => a.balance - b.balance);
const creditors = balances
  .filter((b) => b.balance > 0)
  .sort((a, b) => b.balance - a.balance);

const settlements = [];

while (debtors.length && creditors.length) {
  const debtor = debtors[0];
  const creditor = creditors[0];
  const settleAmount = Math.min(-debtor.balance, creditor.balance);

  settlements.push({
    from: debtor.name,
    to: creditor.name,
    amount: settleAmount.toFixed(2),
  });

  debtor.balance += settleAmount;
  creditor.balance -= settleAmount;

  if (Math.abs(debtor.balance) < 0.01) debtors.shift();
  if (Math.abs(creditor.balance) < 0.01) creditors.shift();
}

console.log("💰 結帳結果：");
settlements.forEach((s) => {
  console.log(`👉 ${s.from} 應付 $${s.amount} 給 ${s.to}`);
});
