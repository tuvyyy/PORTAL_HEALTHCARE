import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import * as msg from "../controllers/messageController.js";

const router = express.Router();

// ======================================================
// 💬 MESSAGES ROUTES
// ======================================================

// Danh sách hội thoại
router.get("/messages", requireAuth, msg.threadsPage);

// Mở hội thoại mới (hoặc chuyển đến hội thoại có sẵn)
router.post("/messages/open", requireAuth, msg.openThread);

// Xem hội thoại cụ thể
router.get("/messages/:id", requireAuth, msg.messagesPage);

// Gửi tin nhắn trong hội thoại
router.post("/messages/:id", requireAuth, msg.postMessage);

export default router;
