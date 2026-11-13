# Reading Room — IELTS Reading & Listening

Ứng dụng JavaScript thuần, dùng được ngoại tuyến. Mỗi trang được build thành một file HTML độc lập, không cần thư viện giao diện bên ngoài.

- [Reading](https://hqd19.github.io/Ielts-reading/index.html): 180 passage Academic Cambridge 7–21, 2.399 câu hỏi, 4.310 mục từ vựng và 375 ảnh câu hỏi.
- [Listening](https://hqd19.github.io/Ielts-reading/listening.html): 60 test, 240 phần, 2.400 ô trả lời. Đề HTML tự xuống dòng; bảng co giãn và có sơ đồ tham khảo.
- Hai kỹ năng dùng chung template, dark mode và đồng hồ tùy chọn 10–60 phút.
- Reading có highlight, ghi chú, học từ vựng và flashcard. Listening có highlight, tra từ và cỡ chữ 14–28px.
- Câu trả lời, đánh dấu và dữ liệu học lưu trong trình duyệt; có xuất/khôi phục JSON. Dữ liệu Reading và Listening lưu riêng.

## Chạy và build

Mở trực tiếp `index.html` hoặc `listening.html` trong Chrome/Edge. Tra từ chưa có trong bộ cục bộ cần Internet; nội dung học có sẵn ngoại tuyến.

Build yêu cầu Python 3.10+, chỉ dùng thư viện chuẩn:

```sh
python build.py
```

Lệnh này cập nhật cả hai file HTML. Chỉ build Listening: `python build_listening.py`.

## Cấu trúc

| Đường dẫn | Nội dung |
| --- | --- |
| `index.html`, `listening.html` | Hai bản ứng dụng độc lập để chạy và triển khai |
| `src/` | Template, CSS chung và JavaScript |
| `data/books.json`, `data/books/` | Reading Academic, câu hỏi, đáp án và tài liệu học |
| `data/listening/` | Listening, bố cục OCR, từ điển bổ sung và bản sửa đã đối chiếu |
| `assets/figures/` | 375 ảnh Reading được build vào ứng dụng |
| `build.py`, `build_listening.py` | Build hai trang |
| `ui_template.py`, `listening_corrections.py` | Nhúng template chung và áp dụng bản sửa Listening |
| `tests/`, `.github/workflows/` | Kiểm thử trình duyệt và CI |
| `docs/` | Báo cáo kiểm tra, trạng thái duyệt thủ công |
| `tools/` | Kiểm tra thư viện và công cụ tái tạo OCR tùy chọn |

Trang `listening-youtube.html` giữ bài luyện YouTube cũ ở đường dẫn riêng. Không ghép dữ liệu bài này vào các test Cambridge. Audio Cambridge chưa được tích hợp.

Để sửa giao diện chung: chỉnh `src/ui.css` và `src/ui.header.html`, rồi build lại. Để sửa nội dung: chỉnh JSON, giữ nguyên ID và khóa lưu trữ để bảo toàn liên kết tiến độ. File PDF, scan và cache OCR đầu vào được giữ bên ngoài repo.

## Kiểm tra

```sh
python tools/validate_library.py
```

Kiểm thử giao diện cần Node.js và Playwright 1.56.1/Chromium:

```sh
node tests/listening-study.mjs
node tests/shared-ui.mjs
node tests/listening-flow.mjs
```

CI tự build và chạy các kiểm tra này. Ảnh kiểm thử là artifact của CI, không đưa vào Git. Công cụ `tools/prepare_listening_layout.py` chỉ cần khi tái nhập OCR; cần dữ liệu nguồn và OpenCV/NumPy/Pillow, không cần để chạy hoặc build web.

## Nguồn và mức độ đối chiếu

Nội dung được chuyển từ PDF người dùng cung cấp. OCR có thể còn lỗi; giải thích và nghĩa Việt là nội dung bổ sung, không phải lời giải chính thức của Cambridge.

- Reading chỉ chứa Academic. PDF Cambridge 14 Test 4 thiếu câu 22, nên toàn thư viện có 2.399 câu thực có.
- Listening có khóa PDF cho 56 test (2.240 câu). Cambridge 20 thiếu khóa đầu vào nên không chấm tự động. Cambridge 12 giữ số Test 5–8 của nguồn.
- `data/listening/corrections.json` lưu bản sửa có kiểm tra từ trước khi áp dụng. Khoảng trống được lấy từ hình học nguồn hoặc vị trí đã duyệt, thay cho việc tự chèn sau số.
- `docs/listening-manual-review.json` ghi rõ **5/402 trang đã duyệt thủ công**, còn 397 trang chờ duyệt. Kiểm tra tự động đủ từ và câu trả lời không đồng nghĩa nội dung đã chính xác hoàn toàn.

Ảnh Listening không còn được web sử dụng, 36 ảnh ngoài bộ Academic, ngân hàng phrasal verb cũ và công cụ nhập dữ liệu lỗi thời đã được bỏ khỏi bản hiện tại. Các bản cũ vẫn tra cứu được trong lịch sử Git.

Nội dung sách thuộc chủ sở hữu tương ứng; repo không cấp giấy phép phân phối lại bộ dữ liệu sách.
