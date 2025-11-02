import { pool, sql } from "../config/db.js";

// ======================================================
// 💬 MESSAGES CONTROLLER (chuẩn cho MessageThreads: PatientId, DoctorId, LastMsgAt)
// ======================================================

// 📜 Trang danh sách hội thoại
export async function threadsPage(req, res) {
  try {
    const user = req.session.user;
    if (!user) return res.redirect("/login");

    const userId = user.UserId;
    const role = user.Role;

    console.log("🧩 threadsPage | userId:", userId, "| role:", role);

    // ✅ CHUẨN HÓA QUERY
    const query =
      role === "doctor"
        ? `
          SELECT 
            T.ThreadId,
            T.LastMsgAt,
            U.FullName AS PartnerName,
            U.Email AS PartnerEmail
          FROM MessageThreads T
          JOIN Patients P ON P.PatientId = T.PatientId
          JOIN Users U ON U.UserId = P.UserId
          WHERE T.DoctorId = @UserId
          ORDER BY T.LastMsgAt DESC
        `
        : `
          SELECT 
            T.ThreadId,
            T.LastMsgAt,
            D.FullName AS PartnerName,
            D.Email AS PartnerEmail
          FROM MessageThreads T
          JOIN Users D ON D.UserId = T.DoctorId
          WHERE T.PatientId = (
            SELECT PatientId FROM Patients WHERE UserId = @UserId
          )
          ORDER BY T.LastMsgAt DESC
        `;

    const result = await pool.request()
      .input("UserId", sql.Int, userId)
      .query(query);

    const layout = role === "doctor" ? "doctor/layout" : "layout";

    res.render("messages/threads", {
      layout,
      title: "Danh sách hội thoại",
      threads: result.recordset,
      currentUser: user,
      role,
      active: "messages",
    });
  } catch (err) {
    console.error("❌ Lỗi threadsPage:", err);
    res.status(500).send("Không tải được danh sách hội thoại");
  }
}

// 📨 Mở hoặc tạo mới hội thoại
export async function openThread(req, res) {
  try {
    const { partnerId } = req.body;
    const user = req.session.user;
    const userId = user.UserId;
    const role = user.Role;

    let doctorId, patientId;

    if (role === "doctor") {
      doctorId = userId;
      patientId = partnerId;
    } else {
      doctorId = partnerId;
      patientId = userId;
    }

    // Kiểm tra xem đã có hội thoại giữa 2 người chưa
    const check = await pool.request()
      .input("DoctorId", sql.Int, doctorId)
      .input("PatientId", sql.Int, patientId)
      .query(`
        SELECT ThreadId FROM MessageThreads 
        WHERE DoctorId = @DoctorId AND PatientId = @PatientId
      `);

    let threadId;
    if (check.recordset.length > 0) {
      threadId = check.recordset[0].ThreadId;
    } else {
      const insert = await pool.request()
        .input("DoctorId", sql.Int, doctorId)
        .input("PatientId", sql.Int, patientId)
        .query(`
          INSERT INTO MessageThreads (DoctorId, PatientId, LastMsgAt)
          OUTPUT INSERTED.ThreadId
          VALUES (@DoctorId, @PatientId, GETDATE())
        `);
      threadId = insert.recordset[0].ThreadId;
    }

    res.redirect(`/messages/${threadId}`);
  } catch (err) {
    console.error("❌ Lỗi openThread:", err);
    res.status(500).send("Không mở được hội thoại");
  }
}

// 📬 Trang xem chi tiết hội thoại
export async function messagesPage(req, res) {
  try {
    const threadId = parseInt(req.params.id, 10);
    const user = req.session.user;
    if (!user) return res.redirect("/login");

    const userId = user.UserId;

    const result = await pool.request()
      .input("ThreadId", sql.Int, threadId)
      .input("UserId", sql.Int, userId)
      .query(`
        SELECT 
          M.MessageId,
          M.ThreadId,
          M.FromUserId,
          M.ToUserId,
          M.Content,
          M.SentAt,
          U.FullName AS SenderName,
          CASE 
            WHEN M.FromUserId = @UserId THEN 'outgoing'
            ELSE 'incoming'
          END AS Direction
        FROM Messages M
        JOIN Users U ON M.FromUserId = U.UserId
        WHERE M.ThreadId = @ThreadId
        ORDER BY M.SentAt ASC;
      `);

    const layout = user.Role === "doctor" ? "doctor/layout" : "layout";

    res.render("messages/detail", {
      layout,
      title: "Hội thoại",
      messages: result.recordset,
      userId,
      currentUser: user,
      active: "messages",
    });
  } catch (err) {
    console.error("❌ Lỗi messagesPage:", err);
    res.status(500).send("Không tải được hội thoại");
  }
}

// 📨 Gửi tin nhắn
export async function postMessage(req, res) {
  try {
    const threadId = parseInt(req.params.id, 10);
    const user = req.session.user;
    const { content } = req.body;
    if (!user) return res.redirect("/login");

    const userId = user.UserId;

    const thread = await pool.request()
      .input("ThreadId", sql.Int, threadId)
      .query(`SELECT DoctorId, PatientId FROM MessageThreads WHERE ThreadId = @ThreadId`);

    if (thread.recordset.length === 0)
      return res.status(404).send("Không tìm thấy hội thoại");

    const t = thread.recordset[0];
    const toUserId = t.DoctorId === userId ? t.PatientId : t.DoctorId;

    await pool.request()
      .input("ThreadId", sql.Int, threadId)
      .input("FromUserId", sql.Int, userId)
      .input("ToUserId", sql.Int, toUserId)
      .input("Content", sql.NVarChar, content)
      .query(`
        INSERT INTO Messages (ThreadId, FromUserId, ToUserId, Content, SentAt)
        VALUES (@ThreadId, @FromUserId, @ToUserId, @Content, GETDATE())
      `);

    await pool.request()
      .input("ThreadId", sql.Int, threadId)
      .query(`UPDATE MessageThreads SET LastMsgAt = GETDATE() WHERE ThreadId = @ThreadId`);

    res.redirect(`/messages/${threadId}`);
  } catch (err) {
    console.error("❌ Lỗi postMessage:", err);
    res.status(500).send("Không gửi được tin nhắn");
  }
}
