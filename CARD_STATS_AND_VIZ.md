# 📊 Hướng Dẫn Hiển Thị & Thống Kê Thẻ (Card Analytics)

Tài liệu này hướng dẫn sử dụng API thống kê và gợi ý hiển thị (Visualize) đơn giản, hiệu quả cho Mobile App.

---

## 1. API: Tổng Hợp Tất Cả Thẻ (All Cards Summary)

**Endpoint:** `GET /v1/transactions/stats/cards/summary`

### Dữ Liệu Trả Về

```json
[
  {
    "_id": "65ae...", // Wallet ID
    "walletName": "VCB Debit",
    "walletType": "DEBIT_CARD",
    "totalTransactions": 125,
    "totalIncome": 15000000,
    "totalExpense": 8500000
  },
  {
    "_id": "65af...",
    "walletName": "TPBank EVO",
    "walletType": "CREDIT_CARD",
    "totalTransactions": 50,
    "totalIncome": 0,
    "totalExpense": 5000000
  }
]
```

### 🎨 Gợi Ý Hiển Thị: Biểu Đồ Cột (Column Chart)

Dùng để so sánh tổng chi tiêu giữa các thẻ.

- **Trục ngang (X):** Tên các thẻ (VCB, TPBank...).
- **Trục dọc (Y):** Số tiền chi tiêu.
- **Tương tác (Hover):**
  - Khi người dùng chạm/giữ vào cột của một thẻ:
  - Hiển thị **Tooltip** nhỏ gọn: "Số lần GD: 125 - Chi: 8.5tr".
  - **Không cần** hiển thị danh sách chi tiết bên dưới.

---

## 2. API: Phân Tích Chi Tiêu Theo Danh Mục (Category Spending)

**Endpoint:** `GET /v1/transactions/stats/wallet/:id/categories`

### Dữ Liệu Trả Về

```json
[
    {
        "categoryName": "Ăn uống",
        "totalAmount": 5000000
    },
    ...
]
```

### 🎨 Gợi Ý Hiển Thị: Biểu Đồ Tròn (Donut Chart)

Dùng để xem cơ cấu chi tiêu của **một thẻ cụ thể**.

- **Vẽ:** Biểu đồ vòng cung (Donut).
- **Tương tác (Hover):**
  - Khi chạm vào một lát cắt màu (Ví dụ: Ăn uống):
  - Hiển thị **Tooltip** ngay tại đó hoặc ở giữa vòng tròn: "Ăn uống: 5tr (Chiếm 60%)".
  - Đơn giản hóa trải nghiệm, không cần liệt kê bảng số liệu dài dòng.

---

## 3. Tổng Kết Trải Nghiệm Người Dùng (UX)

1.  **Màn Hình Tổng Quan Thẻ:**
    - Vào mục "Thẻ" -> Thấy ngay **Biểu Đồ Cột** so sánh các thẻ của mình.
    - Vuốt vào cột nào -> Thấy số dư và tổng chi của thẻ đó.
2.  **Màn Hình Chi Tiết 1 Thẻ:**
    - Bấm vào thẻ cụ thể -> Thấy **Biểu Đồ Tròn** phân loại chi tiêu.
    - Chạm vào từng màu -> Biết tốn tiền vào việc gì nhất (Ăn uống hay Shopee...).
