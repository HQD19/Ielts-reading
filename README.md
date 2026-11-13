# Reading Room — IELTS Reading

Ứng dụng luyện IELTS Reading chạy trong một file HTML, dùng JavaScript thuần. Mở `index.html` bằng Chrome hoặc Edge để sử dụng; không cần cài thư viện hay chạy máy chủ.

## Tính năng

- Thư viện Cambridge 7–21: 180 bài Academic, 60 bộ đề, 2.399 câu hỏi có trong các PDF đầu vào.
- Chọn sách, test và passage. Đã loại các bài General Training khỏi dữ liệu ứng dụng.
- Màn hình hai cột, đồng hồ tùy chọn 10–60 phút (mặc định 20 phút; chọn trước khi bắt đầu), highlight, ghi chú, cờ xem lại và chấm bài.
- Mỗi passage có 22–25 mục từ/cụm từ, tổng cộng 4.310 mục; có IPA, nghĩa Việt, câu ví dụ nguyên văn và từ gần nghĩa. Dạng từ thực tế trong bài được ghi riêng.
- Cấu trúc câu có công thức và dấu hiệu trong câu. Các tab học gồm Từ vựng, Cấu trúc, Flashcards và Đáp án.
- Chế độ tối có nút bật/tắt, lưu lựa chọn trong trình duyệt.
- Flashcard SRS, xuất/khôi phục JSON và đối chiếu nghĩa flashcard đã lưu với bản sửa.
- 375 ảnh trang câu hỏi Academic gốc, hỗ trợ phóng to để xem bảng và sơ đồ.

Tiến độ học được lưu trong trình duyệt, không gửi lên GitHub. Chức năng chính chạy ngoại tuyến; tra từ chưa có trong bộ từ cục bộ có thể dùng Free Dictionary API và cần mạng.

## Build

Yêu cầu Python 3.10 trở lên. Lệnh build chỉ dùng thư viện chuẩn:

```sh
python build.py
```

Kết quả ghi vào `index.html`, bao gồm toàn bộ CSS, JavaScript, dữ liệu và ảnh. Có thể dùng máy chủ tĩnh nếu muốn:

```sh
python -m http.server 8080
```

## Cấu trúc dự án

```text
index.html                 # Bản ứng dụng có thể mở trực tiếp
build.py                   # Build độc lập, không cần cài dependency
src/index.template.html    # Mã nguồn giao diện và JavaScript
data/books.json            # Danh mục sách
data/books/*.json          # Bài đọc, câu hỏi, đáp án và nội dung học tập
data/phrasal-verbs.json    # Ngân hàng biên tập cũ, không nhúng vào ứng dụng
data/*.tsv                 # Ngân hàng cụm từ để biên tập
assets/figures/             # Ảnh nguồn dùng trong ứng dụng
docs/                      # Ghi nhận kiểm tra và cải thiện dữ liệu
tools/                     # Công cụ trích xuất và biên tập lịch sử
```

Để thay đổi nội dung, sửa JSON trong `data/`, sửa giao diện trong `src/`, rồi chạy lại lệnh build. Giữ nguyên `id` của các passage và khóa lưu trữ hiện có để không làm mất liên kết với tiến độ đã lưu.

Các công cụ trong `tools/` là công cụ của quá trình nhập dữ liệu ban đầu, vẫn tham chiếu cấu trúc thư mục làm việc và môi trường Windows của lần nhập đó. Chúng không cần thiết để chạy hoặc build ứng dụng; nếu tái nhập PDF mới, cần cấu hình lại đường dẫn và môi trường OCR tương ứng.

## Nguồn và giới hạn dữ liệu

Nội dung Reading được chuyển đổi từ các PDF Cambridge do người dùng cung cấp. PDF đầy đủ, cache nhận dạng chữ, môi trường Python và bản sao lưu tiến độ cá nhân không thuộc bản repo này. Bản HTML vẫn chứa dữ liệu học và các trang câu hỏi cần để sử dụng ứng dụng.

Đáp án lấy từ bảng khóa trong PDF khi có; các đáp án phân tích bổ sung được ghi riêng. Giải thích, nghĩa Việt và tài liệu học tập không phải tài liệu giải thích chính thức của Cambridge. Dữ liệu OCR có thể còn lỗi; tab đáp án và ảnh nguồn giúp đối chiếu.

Bản `14.pdf` đầu vào thiếu nội dung câu 22 ở Test 4: ứng dụng giữ 39 câu thực có của test đó và ghi chú chỗ thiếu. Vì vậy tổng số câu của thư viện Academic là 2.399.

Build chỉ chọn dữ liệu có `track: academic`. Để kiểm tra số mục từ, trích dẫn nguyên văn, tính duy nhất và dữ liệu ảnh trước khi build, chạy `python tools/validate_library.py`. Báo cáo đợt cập nhật nằm trong `docs/academic-library-update.json`.

Việc chuẩn hóa từ vựng và cấu trúc có kiểm tra nguyên văn, nhưng không thay thế việc duyệt ngữ nghĩa thủ công toàn bộ bộ dữ liệu. Nội dung sách nguồn vẫn thuộc quyền của chủ sở hữu tương ứng; chưa cấp giấy phép phân phối công khai cho bộ dữ liệu này.


## IELTS Listening

Mở `listening.html` hoặc chọn Listening trên thanh đầu trang Reading. Thư viện có 60 test Cambridge 7–21, 240 phần và 2.400 ô trả lời; Cambridge 12 giữ số Test 5–8 của PDF.

Đề hiển thị thành văn bản HTML từ dữ liệu OCR đã làm sạch, tự xuống dòng theo khung. Bảng được trình bày bằng HTML; sơ đồ gốc nằm trong mục tham khảo có thể mở khi cần. Watermark và các đường link quảng bá đã được lọc. Nguồn OCR vẫn có thể còn lỗi ký tự.

Đã gỡ trình phát, nút chọn file, tốc độ và dữ liệu ghép audio khỏi trang Cambridge. Audio sẽ được bổ sung lại trong lần cập nhật sau. Đồng hồ 10–60 phút (mặc định 30), cờ xem lại, chấm bài và tiến độ Listening vẫn hoạt động độc lập với Reading.

56 test có 2.240 đáp án được đối chiếu với khóa PDF. File 20.pdf đầu vào thiếu khóa Listening; 4 test đó chưa chấm tự động và luôn có thông báo trong giao diện.

`build.py` build cả Reading và Listening, chỉ cần thư viện chuẩn Python. Dữ liệu đề ở `data/listening/tests.json`; bố cục đã làm sạch ở `data/listening/layouts.json`; giao diện ở `src/listening.template.html`. `build_listening.py` xuất một file HTML chứa toàn bộ chữ và nét vẽ, không cần tải ảnh đề hay audio. Công cụ `tools/prepare_listening_layout.py --library PATH --supplement PATH` dùng các bản OCR và scan của quá trình nhập PDF để tái tạo bố cục; cần OpenCV, NumPy và Pillow.

Chấm tự động hỗ trợ biến thể tùy chọn và nhóm trả lời theo thứ tự bất kỳ, không tính trùng đáp án. Phiếu trả lời vẫn dùng ô nhập cho tất cả dạng câu, đối chiếu với đề bên trái.

### Bài luyện YouTube đã có

Trang `listening-youtube.html` giữ nguyên bộ 40 câu, 4 phần và các mốc YouTube đã được thêm trên GitHub trong commit a38f7dc, cùng khóa lưu tiến độ cũ. Trang này được giữ ở đường dẫn riêng để tra cứu khi cần. Trang này dùng dữ liệu bài luyện riêng, không gán nhầm vào các test Cambridge.


### Highlight và tra từ trong Listening

Chọn chữ OCR bên trái để mở thanh Tô sáng / Tra từ / Bỏ highlight. Nhấn vào một vùng đã tô để bỏ highlight. Highlight lưu riêng theo test và trang, giữ qua tải lại, xuất/khôi phục JSON và làm lại test. Nút Tra từ trên thanh đề cũng cho nhập từ/cụm từ trực tiếp.

Tra từ dùng bộ nghĩa tiếng Việt cục bộ chung với dữ liệu Reading, có IPA/từ loại khi sẵn có. Các từ chưa có được tra qua Free Dictionary API (định nghĩa tiếng Anh, cần mạng); luôn có liên kết tới Cambridge Dictionary. Vùng highlight áp dụng cho chữ OCR; nhãn chỉ tồn tại dưới dạng nét vẽ trong bản đồ không thể chọn như chữ.

### Template giao diện chung

Reading và Listening cùng dùng `src/ui.css` (font, màu, thanh điều hướng, đồng hồ, nút, tab và chế độ tối) và `src/ui.header.html` (nhận diện và chuyển kỹ năng). `ui_template.py` nhúng trực tiếp các thành phần chung khi build; mỗi trang xuất ra vẫn là một file HTML độc lập, dùng được ngoại tuyến.

Chữ đề Listening dùng Georgia như nội dung Reading và tự xuống dòng; bảng HTML co giãn theo khung, sơ đồ OCR có mục tham khảo riêng. Hai vùng đề/phiếu trả lời chia 50/50 trên desktop. Phần bố cục theo dạng đề và JavaScript nghiệp vụ vẫn ở template từng kỹ năng. Sửa giao diện chung trong `src/ui.css`, chạy `python build.py` để cập nhật cả hai trang.

Kiểm tra hồi quy: `node tests/listening-study.mjs` và `node tests/shared-ui.mjs` (cần Playwright/Chromium). CI build cả hai màn hình, kiểm tra các chức năng học, kích thước desktop/mobile và lưu ảnh giao diện sáng/tối.

### Đề Listening dạng văn bản

Đề Listening hiển thị dưới dạng HTML tự xuống dòng, không còn phóng to cả trang PDF. Nút A− / A+ đổi cỡ chữ 14–28px (mặc định 18px), nhớ lựa chọn qua tải lại và đổi test. Bảng nội dung dùng bảng HTML; trên màn hình nhỏ, các ô xếp thành từng mục có nhãn. Sơ đồ được giữ trong mục “Xem sơ đồ tham khảo” khi cần đối chiếu.

Chọn một từ, một phần từ hoặc nhiều dòng trong đề để Tô sáng / Tra từ / Bỏ highlight. Highlight cũ theo tọa độ chữ vẫn được ánh xạ sang văn bản mới nhờ giữ nguyên chỉ số trang và từ OCR; không xóa câu trả lời hoặc dữ liệu Reading. Đây vẫn là nguồn OCR hiện có, nên có thể còn lỗi nhận dạng ký tự.

### Đối chiếu nội dung Listening với nguồn

Các bản sửa có dấu vết trong `data/listening/corrections.json`; `listening_corrections.py` áp dụng khi build và kiểm tra từ OCR trước khi sửa. Đã đối chiếu trực quan Cambridge 10 Test 1 Part 1 (hai trang) và Cambridge 13 Test 1 Part 1: sửa ký tự, ký hiệu tiền, vị trí chỗ trống và thứ tự ô bảng. Bổ sung 13 từ/nhãn bị bỏ sót sau khi xem ảnh nguồn ở các trang được ghi trong file sửa.

Không tự thêm chỗ trống chỉ vì thấy số 1–40 nữa. Ngoài các trang đã duyệt, vị trí chỗ trống được khôi phục từ đường chấm trong dữ liệu hình học nguồn. Đây vẫn là khôi phục tự động; toàn bộ 240 phần chưa được duyệt thủ công từng câu. Việc giữ đủ số từ và ô trả lời không đồng nghĩa mọi câu OCR đều chính xác.

### Theo dõi duyệt thủ công

`docs/listening-manual-review.json` liệt kê 402 trang đề cho 240 phần Listening. Chỉ các trang đã xem và đối chiếu ảnh nguồn mới mang trạng thái `reviewed`; hiện có 5 trang, các trang còn lại là `pending`. Cambridge 20 Test 1 Part 3 (trang PDF 8–9) đã đối chiếu; bổ sung A–E, nhãn E và sửa dấu câu nhãn D. Dòng dẫn câu hỏi được ghép khi xuống dòng, hiển thị đậm và lớn hơn nội dung 20%, vẫn chỉnh theo A−/A+.
