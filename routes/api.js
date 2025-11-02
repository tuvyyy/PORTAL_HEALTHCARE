import express from "express";
const router = express.Router();

// 🔔 API giả lập dữ liệu thông báo
router.get("/tasks", (req, res) => {
  const notifications = [
    {
      id: 1,
      title: "🩺 Lịch khám hôm nay",
      content: "Bạn có lịch khám với bác sĩ Nguyễn Văn A lúc 08:30 sáng.",
    },
    {
      id: 2,
      title: "💊 Đơn thuốc mới",
      content: "Đơn thuốc của bạn đã sẵn sàng tại quầy Dược số 2.",
    },
    {
      id: 3,
      title: "📅 Nhắc nhở tái khám",
      content: "Đến ngày 05/11 bạn cần tái khám tại phòng Nội tổng hợp.",
    },
    {
      id: 4,
      title: "📢 Thông báo hệ thống",
      content: "Hệ thống sẽ bảo trì từ 22:00 – 23:30 tối nay.",
    },
    {
      id: 5,
      title: "❤️ Lời khuyên sức khỏe",
      content: "Uống đủ 2 lít nước mỗi ngày để duy trì cơ thể khỏe mạnh!",
    },
    {
      id: 6,
      title: "❤️ Lời khuyên sức khỏe",
      content: "Uống đủ 2 lít nước mỗi ngày để duy trì cơ thể khỏe mạnh!",
    },
    {
      id: 7,
      title: "❤️ Lời khuyên sức khỏe",
      content: "Uống đủ 2 lít nước mỗi ngày để duy trì cơ thể khỏe mạnh!",
    },
    {
      id: 8,
      title: "❤️ Lời khuyên sức khỏe",
      content: "Uống đủ 2 lít nước mỗi ngày để duy trì cơ thể khỏe mạnh!",
    },
    {
      id: 9,
      title: "❤️ Lời khuyên sức khỏe",
      content: "Uống đủ 2 lít nước mỗi ngày để duy trì cơ thể khỏe mạnh!",
    },
  ];

  res.json(notifications);
});

// ⚙️ Xuất default đúng chuẩn ESM
export default router;
