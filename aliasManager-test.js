import { setAlias, getName, getUserId } from "./aliasManager.js";

// 假設群組 ID
const groupId = "Cc0c3f0be56c135ac12cfca231f8a84e5";

// 設置別名
setAlias(groupId, "Ue1c97b308ff72770da7c81dac5368f13", "謝");
setAlias(groupId, "U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8", "楊");
setAlias(groupId, "U5e4c8f7c3b7a49d8a9d5b6f1236e845a", "何");

// 測試取得名稱
console.log(getName(groupId, "Ue1c97b308ff72770da7c81dac5368f13")); // 應該顯示 "謝"
console.log(getName(groupId, "U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8")); // 應該顯示 "楊"
console.log(getName(groupId, "U5e4c8f7c3b7a49d8a9d5b6f1236e845a")); // 應該顯示 "何"

// 測試取得 userId
console.log(getUserId(groupId, "謝")); // 應該顯示 "Ue1c97b308ff72770da7c81dac5368f13"
console.log(getUserId(groupId, "楊")); // 應該顯示 "U2b7a8f6c3d7b41cdd7c7e236d7fa1cf8"
console.log(getUserId(groupId, "何")); // 應該顯示 "U5e4c8f7c3b7a49d8a9d5b6f1236e845a"
