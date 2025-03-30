// aliasManager.js

const aliasTable = {
  Cc0c3f0be56c135ac12cfca231f8a84e5: {
    Ue1c97b308ff72770da7c81dac5368f13: "謝", // 你本人
    U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8: "楊", // 虛擬使用者 1
    U3c8a9d4d5a3b43aebea3e4e8b0c63429: "王", // 虛擬使用者 2
    U4d9a8f9b3c7e43c8b7d9f3c7f2a5121: "胡", // 虛擬使用者 3
    U5e4c8f7c3b7a49d8a9d5b6f1236e845a: "何", // 虛擬使用者 4
  },
};

// 假資料的 getName 和 getUserId 函式
export function setAlias(groupId, userId, alias) {
  if (!aliasTable[groupId]) aliasTable[groupId] = {};

  const current = aliasTable[groupId][userId];
  if (current && current !== alias) {
    console.log(`⚠️ 已設定過別名為 ${current}，忽略新的 ${alias}`);
    return;
  }

  aliasTable[groupId][userId] = alias;
  aliasTable[groupId][alias] = userId;

  console.log(`✅ 綁定暱稱：${alias} (${userId}) in ${groupId}`);
}

export function getName(groupId, userId) {
  const groupAliases = aliasTable[groupId];
  if (!groupAliases) {
    console.error(`Group ID ${groupId} not found.`);
    return null;
  }
  const alias = groupAliases[userId];
  if (!alias) {
    console.error(`User ID ${userId} not found in group ${groupId}.`);
  }
  return alias;
}

export function getUserId(groupId, alias) {
  return aliasTable[groupId]?.[alias];
}
