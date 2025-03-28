// aliasManager.js

const aliasTable = {}; // e.g., { groupId: { userId: "謝", "謝": userId } }

/**
 * 設定使用者的暱稱（暱稱 ↔ userId 雙向對應）
 */
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

/**
 * 根據 userId 取得暱稱
 */
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

/**
 * 根據暱稱取得 userId
 */
export function getUserId(groupId, alias) {
  return aliasTable[groupId]?.[alias];
}

/**
 * 取得所有已知使用者
 */
export function getAllUsers(groupId) {
  const table = aliasTable[groupId] || {};
  return Object.entries(table)
    .filter(([key]) => key.startsWith("U"))
    .map(([userId, alias]) => ({ userId, alias }));
}

/**
 * 回傳整個 alias 資料表（用於 debug）
 */
export function getAliasMap() {
  return aliasTable;
}
