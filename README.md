# Reading Room — IELTS Reading

Ứng dụng luyện IELTS Reading chạy trong một file HTML, dùng JavaScript thuần. Mở `index.html` bằng Chrome hoặc Edge để sử dụng; không cần cài thư viện hay chạy máy chủ.

## Tính năng

- Thư viện Cambridge 7–21: 198 bài/section, 66 bộ đề, 2.639 câu hỏi có trong các PDF đầu vào.
- Chọn sách, test, Academic hoặc General Training khi sách có cả hai.
- Màn hình hai cột, đồng hồ 20 phút, highlight, ghi chú, cờ xem lại và chấm bài.
- Từ vựng và cụm từ có IPA, nghĩa Việt, nguyên văn ví dụ và ghi chú cách dùng.
- Cấu trúc câu có công thức và dấu hiệu trong câu; tab Phrasal Verbs có 42 mục từ thông dụng.
- Flashcard SRS, xuất/khôi phục JSON và đối chiếu nghĩa flashcard đã lưu với bản sửa.
- 411 ảnh trang câu hỏi gốc, hỗ trợ phóng to để xem bảng và sơ đồ.

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
data/phrasal-verbs.json    # Thư viện cụm động từ
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

Bản `14.pdf` đầu vào thiếu nội dung câu 22 ở Test 4: ứng dụng giữ 39 câu thực có của test đó và ghi chú chỗ thiếu. Vì vậy tổng số câu của thư viện là 2.639.

Ví dụ trong thư viện Phrasal Verbs được tự soạn và được phân biệt với trích đoạn bài đọc. Các prepositional verbs, cụm ba thành phần và cụm cố định có nhãn loại riêng.

Việc chuẩn hóa từ vựng và cấu trúc có kiểm tra nguyên văn, nhưng không thay thế việc duyệt ngữ nghĩa thủ công toàn bộ bộ dữ liệu. Nội dung sách nguồn vẫn thuộc quyền của chủ sở hữu tương ứng; chưa cấp giấy phép phân phối công khai cho bộ dữ liệu này.
