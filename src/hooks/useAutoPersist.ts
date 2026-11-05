import { useEffect } from "react";
import { saveJSON } from "../storage/storage";

// HOOK CHUNG: mỗi khi `value` đổi (và đã nạp xong dữ liệu cũ) → tự ghi vào AsyncStorage.
// Dùng cho cart, wishlist… — không phải viết lại effect ở từng nơi.
export function useAutoPersist<T>(key: string, value: T, ready: boolean) {
  // BT8.7b: chỉ ghi khi ready = true.
  // Nếu bỏ cờ ready, lần render đầu giỏ còn rỗng sẽ ghi đè dữ liệu cũ trước khi kịp đọc.
  useEffect(() => {
    if (ready) saveJSON(key, value);
  }, [key, value, ready]);
}