// Nội dung của bản đồ "Design Trip": các trạm trên hành trình của một task design và các tính năng mẫu.
// Dữ liệu task là ví dụ minh hoạ (concept của junkiodesign), không phải số liệu thật.

// Quy trình chuẩn (mặc định) có 9 bước; ở chế độ "Thực tế" các bước skipInReal bị bỏ qua.
// anchor = điểm gần đường (x, z); anchorD = [trạm tham chiếu, khoảng cách dọc đường tính từ trạm đó]
export const STATIONS = [
  { key: 'task', n: '01', name: 'Bến nhận task', short: 'Nhận task', anchor: [-48.5, 4],
    desc: 'Phòng Product: PM giao brief, thẻ file được cẩu lên nóc siêu xe. Mỗi thẻ là file thiết kế của một tính năng. Bot AI giúp viết brief.',
    std: 'Brief có mục tiêu, người dùng và tiêu chí nghiệm thu.', real: 'Brief một dòng qua chat, deadline có trước yêu cầu.',
    pains: ['Brief mơ hồ, chưa rõ mục tiêu', 'Deadline có trước cả yêu cầu'],
    tip: 'Hỏi lại ba câu: cho ai, để làm gì, đo thành công bằng gì.' },
  { key: 'research', n: '02', name: 'Thư viện Research', short: 'Research', anchor: [-37, -15],
    desc: 'Đỗ ở bãi research, vào phòng đọc đối thủ, gom reference, phỏng vấn người dùng; bot AI gom ref thành insight.',
    std: 'Research vừa đủ theo quy mô; task bị dev trả về thì không research lại.', real: 'Task nào cũng research từ đầu, kể cả task làm lại.',
    pains: ['Mở 37 tab Pinterest rồi quên mục đích', 'Không có thời gian phỏng vấn user'],
    tip: 'Đặt giờ cho research, ghi lại 3 insight chính rồi mới mở Figma.' },
  { key: 'define', n: '03', name: 'Phòng Define', short: 'Define', anchorD: ['research', 20], skipInReal: true,
    desc: 'Chốt vấn đề, mục tiêu và tiêu chí nghiệm thu trước khi vẽ (10 giây cuối trong bãi research).',
    std: 'Có tiêu chí rõ nên lúc duyệt ít bất ngờ.', real: 'Bỏ qua: research xong vào vẽ luôn.',
    pains: ['Mỗi người hiểu vấn đề một kiểu', 'Không có tiêu chí nên duyệt theo cảm giác'],
    tip: 'Viết 1 câu vấn đề + 3 tiêu chí nghiệm thu, cho PM xác nhận.' },
  { key: 'design', n: '04', name: 'Xưởng Design', short: 'Design', anchor: [0, -26],
    desc: 'Wireframe → UI → prototype. 12 bệ làm việc F01–F12, mỗi bệ có một Agent AI riêng: vẽ UI phủ dần lên wireframe khi designer làm task, quét soát khi chờ duyệt, ăn mừng khi live, báo động khi user gặp lỗi.',
    std: 'Wireframe trước, UI sau, dùng component từ design system.', real: 'Vẽ UI luôn, v1 → v7 vẫn chưa ưng.',
    pains: ['v1 → v7 vẫn chưa ưng', 'Thiếu design system nên mỗi màn một kiểu'],
    tip: 'Chốt luồng ở wireframe trước khi lên màu.' },
  { key: 'techreview', n: '05', name: 'Bàn Review sớm', short: 'Review sớm', anchorD: ['design', 23.3], skipInReal: true,
    desc: 'PM và dev cùng xem thiết kế trước khi test: góp ý sớm khi sửa còn rẻ, dev kiểm tra code được không.',
    std: 'Phát hiện “không code được” ngay từ đây.', real: 'Bỏ qua: dev chỉ thấy thiết kế khi đã bàn giao.',
    pains: ['Dev bận nên không ai mời', 'Ngại cho xem bản chưa đẹp'],
    tip: 'Mời dev xem 15 phút khi còn là wireframe.' },
  { key: 'test', n: '06', name: 'Lab User Test', short: 'Test', anchorD: ['design', 47.3],
    desc: 'Xe chạy chậm qua cổng quét; trong lab người dùng thật bấm thử prototype sau gương một chiều.',
    std: 'Chỉ test lại khi đổi luồng hoặc tương tác.', real: 'Sửa gì cũng phải test lại từ đầu.',
    pains: ['User không bấm vào nút mình nghĩ', 'Test xong lại phải sửa tiếp'],
    tip: 'Khoảng 5 người dùng đã đủ để thấy phần lớn vấn đề lớn.' },
  { key: 'review', n: '07', name: 'Phòng Sếp duyệt', short: 'Duyệt', anchorD: ['design', 73.3],
    desc: 'Duyệt bản cuối (sếp, PM hoặc design lead). Barie chỉ nâng khi được duyệt; bị trả về thì xe lùi về xưởng.',
    std: 'Duyệt theo tiêu chí đã chốt; góp ý nhỏ sửa xong gửi lại, không cần test lại.', real: '“Chưa ổn em ơi” nhưng không nói chưa ổn chỗ nào.',
    pains: ['Feedback chung chung', 'Feedback đổi theo tâm trạng'],
    tip: 'Trình bày theo mục tiêu và tiêu chí của task, xin feedback cụ thể.' },
  { key: 'handoff', n: '08', name: 'Cảng bàn giao', short: 'Bàn giao', anchorD: ['design', 109.3],
    desc: 'Phòng bàn giao chuẩn bị spec và asset; cẩu bờ nhấc thẻ file sang tàu DEV TEAM. Đủ file thì tàu ra đảo Dev.',
    std: 'Kèm spec, các trạng thái (hover, lỗi, rỗng), prototype và asset đã xuất.', real: 'Gửi mỗi link Figma.',
    pains: ['Thiếu trạng thái hover/lỗi/rỗng', 'Asset chưa xuất, tên layer lộn xộn'],
    tip: 'Dùng checklist bàn giao cho mọi task.' },
  { key: 'dev', n: '09', name: 'Đảo Dev', short: 'Dev', anchor: null,
    desc: 'Dev build → designer soát bản build (Design QA) → qua cầu sang đảo QC.',
    std: 'Có Design QA trước khi chuyển QC.', real: 'Code xong đẩy thẳng sang QC; hay nghe “cái này không code được”.',
    pains: ['Bản build lệch thiết kế', 'Dev không đọc spec'],
    tip: 'Designer soát bản build trước khi chuyển QC.' },
  { key: 'qc', n: '10', name: 'Đảo QC · Hải đăng', short: 'QC · Release', anchor: null,
    desc: 'Team QC chạy test case trên bản build. Pass thì hải đăng bật đèn release và bắn pháo hoa; có lỗi thì trả về đảo Dev sửa.',
    std: 'Test case viết từ tiêu chí nghiệm thu; pass mới release, sau đó đo lường.', real: 'Test dồn cuối sprint, nhiều lỗi, release xong không ai xem số liệu.',
    pains: ['Bug chỉ ghi “không chạy được”', 'Test dồn vào ngày cuối sprint'],
    tip: 'Viết test case từ tiêu chí nghiệm thu ngay ở bước Define.' },
  { key: 'user', n: '11', name: 'Đảo User · Thành phố', short: 'User', anchor: null,
    desc: 'Nơi người dùng thật dùng sản phẩm sau release: toà nhà cao tầng, văn phòng công ty. Cứ khoảng 5 giây lại có user gặp lỗi: đảo bắn pháo sáng cầu cứu, số cảnh báo nhảy lên và lỗi mới thành task hotfix quay về bến nhận task.',
    std: 'Có QC và Design QA chặn trước nên user ít gặp lỗi; lỗi được ghi lại và sửa theo task hotfix.', real: 'Lỗi lọt ra production nhiều hơn; user phản hồi qua mạng xã hội trước khi team biết.',
    pains: ['User báo lỗi chung chung “app bị lỗi”', 'Không có số liệu để tái hiện lỗi'],
    tip: 'Gắn công cụ báo lỗi và đo lường ngay trong app trước khi release.' },
];

export const FEATURES = [
  ['F01', 'Đăng nhập'], ['F02', 'Dashboard'], ['F03', 'Storefront'], ['F04', 'Giỏ & checkout'],
  ['F05', 'Sản phẩm'], ['F06', 'Thông báo'], ['F07', 'Blog'], ['F08', 'Landing'],
  ['F09', 'SEO'], ['F10', 'Đơn hàng'], ['F11', 'Liên hệ'], ['F12', 'Ngôn ngữ'],
];

// trạng thái tính năng → nhãn + màu chấm (giống bảng tham khảo: đỏ / vàng / xanh)
export const FSTATUS = {
  todo: ['chưa làm', 'gray'], doing: ['đang làm', 'red'], review: ['chờ duyệt', 'yellow'],
  dev: ['dev đang build', 'yellow'], qa: ['design QA', 'yellow'], qc: ['QC đang test', 'yellow'], bug: ['user báo lỗi', 'red'], done: ['đã release', 'green'], redo: ['không code được', 'red'], improve: ['cải tiến sau đo lường', 'gray'],
};
