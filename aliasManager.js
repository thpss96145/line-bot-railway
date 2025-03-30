// aliasManager.js

let aliasTable = {}; // 用來儲存群組的暱稱綁定資料

/**
 * 載入整份 alias 對應表
 * @param {Object} map - groupId → { userId: alias, alias: userId }
 */
export function setAliasMap(map) {
  aliasTable = map;
}

/**
 * 設定單一使用者的暱稱
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
  return aliasTable?.[groupId]?.[userId] || null;
}

/**
 * 根據暱稱取得 userId
 */
export function getUserId(groupId, alias) {
  const id = aliasTable?.[groupId]?.[alias] || null;
  console.log("🧪 查詢 userId:", groupId, alias, "=>", id);
  return id;
}

/**
 * 回傳整個 aliasTable（用於 debug）
 */
export function getAliasMap() {
  return aliasTable;
}
