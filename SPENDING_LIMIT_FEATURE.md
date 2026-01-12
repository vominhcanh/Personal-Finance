# 🎯 Spending Limit Feature Guide

Tài liệu này hướng dẫn tích hợp tính năng **Quản Lý Hạn Mức Chi Tiêu (Monthly Spending Limit)**. Tính năng này cho phép người dùng tự đặt ra giới hạn chi tiêu hàng tháng, từ đó hệ thống sẽ cảnh báo khi sắp vượt mức.

---

## 1. Backend API

### Update Limit (Cập nhật hạn mức)

- **URL**: `PATCH /v1/users/monthly-limit`
- **Auth**: Required (Bearer Token)
- **Body**:
  ```json
  {
    "monthlyLimit": 20000000
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Cập nhật hạn mức thành công",
    "data": {
      "message": "Cập nhật hạn mức thành công",
      "monthlyLimit": 20000000
    }
  }
  ```

---

## 2. Frontend UI/UX Flow

### A. Vị trí hiển thị (Entry Point)

Tại widget **Spending Warning** (Biểu đồ cảnh báo chi tiêu):

1.  Hiển thị một nút (Button) hoặc biểu tượng Edit (✏️) bên cạnh số tiền "Hạn Mức" (Monthly Limit).
2.  Hoặc hiển thị nút **"Thiết lập hạn mức"** nếu `monthlyLimit == 0`.

### B. Giao diện thay đổi (Modal/Drawer)

Khi bấm vào nút "Thiết lập hạn mức", mở một Modal nhỏ:

- **Title**: "Thiết lập Hạn Mức Chi Tiêu"
- **Input**:
  - Nhập số tiền (VD: 20,000,000).
  - _Yêu cầu_: Auto-format tiền tệ (có dấu phẩy/chấm) khi nhập.
- **Helper Text**: "Hạn mức này sẽ áp dụng cho tất cả các tháng. Hệ thống sẽ cảnh báo khi bạn chi tiêu vượt quá 85% hạn mức."
- **Actions**:
  - `Cancel`: Đóng modal.
  - `Save`: Gọi API `PATCH /v1/users/monthly-limit`.

### C. Logic sau khi Update

1.  Hiển thị thông báo thành công (Toast).
2.  **Quan trọng**: Gọi lại ngay API `GET /v1/analytics/spending-warning` để làm mới biểu đồ và các chỉ số cảnh báo. Giao diện phải phản ánh ngay lập tức (Ví dụ: Thanh cảnh báo chuyển từ màu Xám sang Xanh/Vàng/Đỏ tùy theo hạn mức mới).

---

## 3. Quy tắc hiển thị Cảnh Báo (Frontend Logic)

Dựa vào `alertLevel` trả về từ API `spending-warning` (đã có từ trước), hiển thị màu sắc tương ứng cho thanh tiến độ (Progress Bar) hoặc Doughnut Chart:

| Alert Level   | Color     | Ý nghĩa          |
| :------------ | :-------- | :--------------- |
| **SAFE**      | 🟢 Green  | Dưới 70%         |
| **WARNING**   | 🟡 Yellow | 70% - 85%        |
| **URGENT**    | 🟠 Orange | 85% - 99%        |
| **OVERSPENT** | 🔴 Red    | >= 100%          |
| **NO_LIMIT**  | 🔘 Grey   | Chưa set hạn mức |

> **Lưu ý**: Logic chia mức cảnh báo đã được xử lý ở Backend. Frontend chỉ cần render màu dựa trên `alertLevel`.

---

## 4. Cơ Chế Hàng Tháng (Monthly Cycle)

Hệ thống hoạt động theo cơ chế **Tự Động Gia Hạn (Auto-Renew)**:

1.  **Ngày cuối tháng (23:59:59)**: Chốt số liệu chi tiêu của tháng cũ.
2.  **Ngày đầu tháng (00:00:00)**:
    - Số tiền đã chi tiêu (`currentSpending`) tự động **Reset về 0**.
    - Hạn mức (`monthlyLimit`) được **giữ nguyên** (Ví dụ: 20tr).
    - Thanh cảnh báo (Progress Bar) quay về **0% (Màu Xanh)**.

👉 **Người dùng KHÔNG cần phải thao tác "Xóa" hay "Cấp lại" hạn mức mỗi tháng.** Hạn mức đã cài đặt sẽ được áp dụng mãi mãi cho đến khi người dùng chủ động thay đổi.
