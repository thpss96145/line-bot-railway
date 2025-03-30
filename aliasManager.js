// aliasManager.js

const aliasTable = {
  Cc0c3f0be56c135ac12cfca231f8a84e5: {
    Ue1c97b308ff72770da7c81dac5368f13: "謝",
    謝: "Ue1c97b308ff72770da7c81dac5368f13",

    U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8: "楊",
    楊: "U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8",

    U5e4c8f7c3b7a49d8a9d5b6f1236e845a: "何",
    何: "U5e4c8f7c3b7a49d8a9d5b6f1236e845a",
  },
};

// 這個 aliasTable 是用來存放群組 ID 和使用者 ID 的對應關係
export function getAliasMap() {
  return aliasTable;
}
// 用來設定別名
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

// 根據 userId 取得 alias
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

// 根據 alias 取得 userId
export function getUserId(groupId, alias) {
  return aliasTable[groupId]?.[alias];
}
