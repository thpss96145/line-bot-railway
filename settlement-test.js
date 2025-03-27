const payments = [
  {
    userId: "U1",
    name: "Finny",
    amount: 500,
    participants: ["U1", "U2", "U3", "U4", "U5"],
  },
  {
    userId: "U2",
    name: "Alice",
    amount: 600,
    participants: ["U1", "U2", "U3", "U4"],
  },
  { userId: "U3", name: "Bob", amount: 400, participants: ["U1", "U2", "U3"] },
  { userId: "U4", name: "Charlie", amount: 200, participants: ["U4", "U5"] },
  { userId: "U1", name: "Finny", amount: 100, participants: ["U1", "U2"] },
  { userId: "U5", name: "Eve", amount: 100, participants: ["U5", "U4"] },
];

// 計算每個人的應付金額
const calculateShares = (payments) => {
  let balances = {}; // 用來記錄每個人應付或應收的金額

  payments.forEach((payment) => {
    const perPerson = (payment.amount / payment.participants.length).toFixed(2); // 保留兩位小數
    payment.participants.forEach((participant) => {
      if (!balances[participant]) {
        balances[participant] = 0;
      }
      if (payment.userId === participant) {
        balances[participant] += payment.amount - parseFloat(perPerson); // 自己支付超過了分擔的金額
      } else {
        balances[participant] -= parseFloat(perPerson); // 分攤金額
      }
    });
  });

  return balances;
};

// 最小化債務轉帳
const settleBalances = (balances) => {
  let debtors = [];
  let creditors = [];

  // 將債務人和債權人分開
  for (let user in balances) {
    if (balances[user] < 0) {
      debtors.push({ user, amount: -balances[user] }); // 債務人
    } else if (balances[user] > 0) {
      creditors.push({ user, amount: balances[user] }); // 債權人
    }
  }

  // 債務最小化轉帳
  let debtorIndex = 0;
  let creditorIndex = 0;
  let transactions = [];

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    let debtor = debtors[debtorIndex];
    let creditor = creditors[creditorIndex];

    let amountToTransfer = Math.min(debtor.amount, creditor.amount);
    transactions.push({
      from: debtor.user,
      to: creditor.user,
      amount: amountToTransfer.toFixed(2),
    }); // 保留兩位小數

    // 更新債務與債權
    debtors[debtorIndex].amount -= amountToTransfer;
    creditors[creditorIndex].amount -= amountToTransfer;

    if (debtors[debtorIndex].amount === 0) debtorIndex++;
    if (creditors[creditorIndex].amount === 0) creditorIndex++;
  }

  return transactions;
};

// 執行計算與分帳
const balances = calculateShares(payments);
const transactions = settleBalances(
  Object.entries(balances).reduce((obj, [user, balance]) => {
    obj[user] = balance;
    return obj;
  }, {})
);

console.log("分帳結果：", transactions);
