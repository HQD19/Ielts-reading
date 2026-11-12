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

Mở `listening.html`, hoặc chọn Listening trên thanh đầu trang Reading. Có 60 test Cambridge 7–21, 240 phần, 2.400 ô trả lời; Cambridge 12 giữ số Test 5–8 theo PDF. Đề gốc được nhúng dưới dạng ảnh để giữ nguyên bảng, sơ đồ và bản đồ; văn bản OCR có thể mở để tìm kiếm, đối chiếu. Có phóng to, bộ chọn thời gian 10–60 phút (mặc định 30), đánh dấu xem lại, chấm điểm và sao lưu tiến độ riêng với Reading.

56 test có đủ 2.240 đáp án được đối chiếu với khóa trong PDF. File 20.pdf đầu vào không có bảng khóa Listening; 4 test này giữ đầy đủ đề và phiếu trả lời nhưng chưa chấm tự động. Màn hình luôn ghi rõ giới hạn nguồn này. Không tự suy đoán đáp án để điền đủ số lượng.

132 track đã được ghép cho 36 test thuộc Cambridge 10–13, 15, 16, 19–21. Cambridge 21 dùng audio toàn test; các sách còn lại dùng từng part. Những test chưa có audio hỗ trợ chọn file từ máy. File nghe không nhúng vào HTML và không lưu trong lịch sử Git: được phân phối qua Release `listening-audio-v1`. Khi chạy web, chỉ track đang chọn được tải; khi mở file HTML trực tiếp, ứng dụng tìm trong `assets/audio/` hoặc nhận file do người học chọn.

`build.py` build cả Reading và Listening. `build_listening.py` chỉ build Listening và dùng thư viện chuẩn Python. Dữ liệu ở `data/listening/tests.json`, giao diện ở `src/listening.template.html`, ảnh nguồn ở `assets/listening/`. Reading vẫn là file HTML độc lập. Listening bản web tải ảnh từ `assets/listening/` theo phần đang mở; giữ nguyên thư mục này khi chạy ngoại tuyến. Để xuất một file Listening nhúng cả đề, gọi `build_listening.build(embed=True, output="listening-offline.html")`. Audio là tài nguyên riêng.

Chấm tự động hỗ trợ chữ hoa/thường, dạng tùy chọn trong ngoặc, biến thể có dấu / và các nhóm trả lời theo thứ tự bất kỳ; không tính trùng đáp án trong nhóm. Hiện phiếu trả lời dùng ô nhập văn bản cho tất cả dạng câu hỏi, đối chiếu đề gốc bên trái; chưa chuyển toàn bộ sơ đồ/matching thành kéo-thả. Kết quả không tự quy đổi sang IELTS band.


### Bài luyện YouTube đã có

Trang `listening-youtube.html` giữ nguyên bộ 40 câu, 4 phần và các mốc YouTube đã được thêm trên GitHub trong commit a38f7dc, cùng khóa lưu tiến độ cũ. Có thể mở từ mục YouTube practice trên trang Listening Cambridge. Trang này dùng dữ liệu bài luyện riêng, không gán nhầm vào các test Cambridge.
