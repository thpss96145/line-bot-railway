// aliasManager.js

let aliasTable = {}; // 全域儲存暱稱綁定

export function setAliasMap(map) {
  aliasTable = map;
}

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
  return aliasTable?.[groupId]?.[userId] || null;
}

export function getUserId(groupId, alias) {
  const id = aliasTable?.[groupId]?.[alias] || null;
  console.log("🧪 查詢 userId:", groupId, alias, "=>", id);
  return id;
}

export function getAliasMap() {
  return aliasTable;
}

export function hasAlias(groupId, alias) {
  return !!aliasTable?.[groupId]?.[alias];
}
