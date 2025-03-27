import dotenv from "dotenv";

dotenv.config();

console.log("✅ 讀取的 GOOGLE_SERVICE_ACCOUNT:");
console.log(process.env.GOOGLE_SERVICE_ACCOUNT);

try {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  console.log("✅ 解析後的 JSON:", serviceAccount);
} catch (error) {
  console.error("❌ JSON 解析錯誤:", error);
}
