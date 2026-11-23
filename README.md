# LapFit

Công cụ chọn laptop cho sinh viên công nghệ thông tin. Trả lời 6 nhóm câu hỏi (ngôn ngữ, nghề, ngân sách, giải trí, phần cứng, màn hình), nhận 5 mẫu đang bán tại Việt Nam chấm theo nhu cầu, so sánh hai laptop, so sánh CPU/GPU bằng biểu đồ, rồi gửi lựa chọn kèm mã QR chứa JSON (hoặc tạo file JSON / .md).

## Chạy trên máy

```
node serve.mjs
```

Mở http://localhost:5173.

## Dữ liệu

- `research/market-vn.json`: mẫu, giá, thông số (mỗi giá có link nơi bán, kiểm tra 23/11/2026).
- `research/benchmarks.json`: điểm Cinebench 2024, Geekbench 6, 3DMark Steel Nomad và Time Spy, mỗi số có link nguồn.
- `data.js` được tạo từ hai file trên: `node build-data.mjs`. Ô `null` hiện "chưa có" trên web, không ước tính.

## Thu kết quả

Trang tĩnh (GitHub Pages) không lưu kết quả online. Người dùng bấm **Tạo mã QR và gửi kết quả**, rồi đưa mã QR cho người thu quét, hoặc tạo file JSON / .md và gửi file đó. Mã QR chứa JSON ở dạng ASCII (chữ tiếng Việt viết `\uXXXX`), `JSON.parse` trả lại đúng dấu.

Bản trên claude.ai (`node build-artifact.mjs`, đăng bằng Artifact) có thêm lưu online.
