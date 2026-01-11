# 📖 Hướng Dẫn Sử Dụng Module Người Dùng (Users)

Tài liệu này mô tả các tính năng liên quan đến trang cá nhân (Profile) và quản lý tài khoản người dùng, đặc biệt phục vụ việc xây dựng UI (Frontend).

## 1. Tóm Tắt API

| Tính năng             | Method  | Endpoint                    | Mô tả                               |
| :-------------------- | :------ | :-------------------------- | :---------------------------------- |
| **Lấy thông tin tôi** | `GET`   | `/v1/users/me`              | Lấy toàn bộ thông tin profile.      |
| **Cập nhật Profile**  | `PATCH` | `/v1/users/me`              | Cập nhật tên, ngày sinh, giới tính. |
| **Đổi Mật Khẩu**      | `POST`  | `/v1/users/change-password` | Đổi password đăng nhập.             |

---

## 2. Đặc Tả Form Cập Nhật Profile (Frontend)

Khi làm UI cho form **"Chỉnh Sửa Thông Tin Cá Nhân"**, bạn cần map các trường dữ liệu như sau:

| Tên Trường (API Key) | Nhãn (Label) | Kiểu Input (Type)  | Bắt Buộc? | Định Dạng / Validate                                                              |
| :------------------- | :----------- | :----------------- | :-------- | :-------------------------------------------------------------------------------- |
| `fullName`           | Họ và tên    | `text`             | Không     | Chuỗi ký tự bình thường.                                                          |
| `dateOfBirth`        | Ngày sinh    | `date` (picker)    | Không     | Dạng chuỗi ISO 8601 hoặc `YYYY-MM-DD`.<br>Ví dụ: `"1995-10-25"`                   |
| `gender`             | Giới tính    | `select` / `radio` | Không     | Chỉ chấp nhận 3 giá trị:<br>- `MALE` (Nam)<br>- `FEMALE` (Nữ)<br>- `OTHER` (Khác) |

### 📌 Payload Mẫu (JSON gửi lên)

```json
{
  "fullName": "Nguyen Van A",
  "dateOfBirth": "1995-10-25",
  "gender": "MALE"
}
```

---

## 3. Đặc Tả Form Đổi Mật Khẩu (Frontend)

Khi làm UI cho form **"Đổi Mật Khẩu"**:

| Tên Trường (API Key) | Nhãn (Label)            | Kiểu Input | Bắt Buộc? | Validate                                                                  |
| :------------------- | :---------------------- | :--------- | :-------- | :------------------------------------------------------------------------ |
| `oldPassword`        | Mật khẩu hiện tại       | `password` | **Có**    | Không yêu cầu độ dài, chỉ cần đúng.                                       |
| `newPassword`        | Mật khẩu mới            | `password` | **Có**    | Tối thiểu **6 ký tự**.                                                    |
| _(Client Only)_      | _Nhập lại mật khẩu mới_ | `password` | _N/A_     | _Chỉ dùng để check khớp với `newPassword` ở frontend, không gửi lên API._ |

### 📌 Payload Mẫu (JSON gửi lên)

```json
{
  "oldPassword": "matkhaucu123",
  "newPassword": "matkhaumoi456"
}
```

---

## 4. Dữ Liệu Trả Về (Response Data)

Khi gọi `GET /v1/users/me` hoặc sau khi `PATCH` thành công, server sẽ trả về object User đầy đủ:

```json
{
  "_id": "65ae01...",
  "email": "email@example.com",
  "fullName": "Nguyen Van A",
  "dateOfBirth": "1995-10-25T00:00:00.000Z", // Chú ý convert lại về Date object khi hiển thị
  "gender": "MALE",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Lưu ý:** Trường `dateOfBirth` trả về có thể là chuỗi full ISO (`...T00:00:00.000Z`), Frontend cần format lại (ví dụ dùng `dayjs` hoặc `moment`) để hiển thị đẹp (DD/MM/YYYY).
