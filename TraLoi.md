# TraLoi.md — Buổi 8: BookStore (Đăng nhập, Giỏ hàng, Yêu thích)

Họ tên: ……………………………  MSSV: ……………………………

---

## Câu 1. Cờ `ready`

Nếu bỏ điều kiện `ready` trong `useAutoPersist`, hook sẽ ghi dữ liệu ngay ở lần render đầu tiên. Lúc đó giỏ hàng trong store vẫn còn là mảng rỗng `[]`, vì `usePersistence` chưa kịp đọc AsyncStorage xong (việc đọc là bất đồng bộ).

Thứ tự diễn ra như sau:

1. **Render lần 1:** store có `items = []`, `ready = false`. Effect ghi chạy và `saveJSON(CART_KEY, [])` ghi mảng rỗng đè lên giỏ hàng đã lưu từ lần trước.
2. Sau đó hàm đọc mới trả về, nhưng dữ liệu cũ trong máy đã bị ghi đè nên chỉ đọc được `[]`.
3. **Kết quả:** mở lại app thì giỏ hàng luôn rỗng.

Cờ `ready` chỉ bật sau khi đọc xong và đã `dispatch(hydrateCart(...))`, nên effect ghi không chạy sớm và không đè mất dữ liệu cũ.

---

## Câu 2. Token giả

**Hai điểm không an toàn:**

1. Mật khẩu nằm sẵn trong `db.json` ở dạng chữ thường (không băm) và được app tải về rồi tự so sánh ở phía client. Ai mở được API (hoặc `db.json`) đều đọc được mật khẩu của mọi người.
2. Token do app tự tạo (dạng `token-<id>-<thời gian>`) nên không có chữ ký và không có hạn dùng. Ai cũng có thể tự làm giả một token như vậy.

**Hệ thống thật:** chính **server** kiểm tra mật khẩu (so với mật khẩu đã băm, ví dụ bcrypt) rồi cấp một token có chữ ký và có thời hạn (ví dụ JWT). App chỉ gửi email và mật khẩu lên server và nhận token về.

**Nơi lưu token:** nên lưu bằng **SecureStore** của Expo (dùng Keychain trên iOS, Keystore trên Android) vì dữ liệu được mã hóa. Không nên để token dạng thô trong AsyncStorage, vì AsyncStorage không mã hóa.

---

## Câu 3. Hai effect trong `CartItemRow`

Effect đồng bộ `setQty(item.quantity)` giúp state cục bộ `qty` luôn theo kịp giá trị trong store. Nếu xóa effect này thì `qty` chỉ nhận `item.quantity` một lần ở lần render đầu (giá trị khởi tạo của `useState`), sau đó không đổi theo store nữa.

Số trên nút sẽ bị lệch so với store khi store đổi từ nơi khác, ví dụ:

- Mở lại app: giỏ hàng được nạp từ AsyncStorage (`hydrateCart`) sau khi dòng đã render với số lượng cũ.
- Một nơi khác đổi số lượng, hoặc xóa rồi thêm lại cùng một sản phẩm (store giới hạn lại số lượng theo tồn kho).

Khi đó số hiển thị trên nút khác với số thật trong store, và tổng tiền sẽ không khớp với số bạn nhìn thấy.

---

## Câu 4. Một nguồn state

Nếu `HeartButton` giữ trạng thái bằng `useState` riêng ở mỗi nơi thì mỗi nút tim là một bản độc lập. Ví dụ bấm ♡ ở lưới sách thì tim đó đỏ, nhưng mở trang chi tiết của cuốn ấy vẫn thấy ♡ trắng, vì đó là một component khác với state riêng. Tim ở màn Yêu thích cũng không biết gì về những cuốn đã thả tim, và tải lại trang thì mất hết.

Với store (Redux), danh sách `ids` yêu thích chỉ có **một nơi duy nhất**. Mọi `HeartButton` đều đọc cùng giá trị bằng `isFavorite(bookId)` và cùng ghi bằng `toggle(bookId)`. Khi store đổi, tất cả component đang đọc nó đều render lại, nên tim ở lưới, ở trang chi tiết và màn Yêu thích luôn khớp nhau.

---

## Câu 5. Code bổ sung: nút 👁 hiện/ẩn mật khẩu

Sửa file `src/screens/LoginScreen.tsx`.

**1) Thêm state** (cạnh các state khác):

```tsx
const [showPassword, setShowPassword] = useState(false);
```

**2) Thay `FormField` mật khẩu** bằng đoạn sau:

```tsx
<View>
  <FormField
    label="Mật khẩu"
    value={password}
    onChangeText={setPassword}
    error={errors.password}
    secureTextEntry={!showPassword}
    style={{ paddingRight: 44 }}
  />
  <Pressable
    style={styles.eye}
    onPress={() => setShowPassword((v) => !v)}
    accessibilityLabel={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
  >
    <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁"}</Text>
  </Pressable>
</View>
```

**3) Thêm hai style** vào `StyleSheet.create`:

```tsx
eye: { position: "absolute", right: 12, top: 30 },
eyeText: { fontSize: 20 },
```

**Cách hoạt động:** state `showPassword` điều khiển `secureTextEntry`. Mặc định là `false` nên mật khẩu bị ẩn. Bấm 👁 thì đổi thành `true` và mật khẩu hiện ra, bấm lần nữa thì ẩn lại. Nút được đặt `position: "absolute"` ở góc phải ô nhập, còn `paddingRight: 44` giúp chữ không chạy xuống dưới biểu tượng.

**Ảnh chụp màn hình kết quả:**

<!-- Chèn ảnh chụp màn Đăng nhập khi mật khẩu đang ẩn và khi đang hiện, ví dụ: ![Ẩn mật khẩu](anh1.png) ![Hiện mật khẩu](anh2.png) -->
