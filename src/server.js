import express from "express";
import session from "express-session";
import path from "path";
import morgan from "morgan";
import dotenv from "dotenv";
import expressLayouts from "express-ejs-layouts"; // 🟢 Thêm thư viện layout
import { fileURLToPath } from "url";
import routes from "./routes/index.js";
import { injectUser } from "./middlewares/auth.js";
import "./config/db.js";
import apiRouter from '../routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// -------------------------------
// ⚙️ Cấu hình EJS + Layout
// -------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(expressLayouts); // 🟢 Kích hoạt layout engine
app.set("layout", "layout"); // 🟢 layout mặc định (file: views/layouts/patient.ejs)

// -------------------------------
// 🧱 Middleware cơ bản
// -------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true },
  })
);
app.use(injectUser);

// -------------------------------
// 📂 Static files
// -------------------------------
app.use(express.static(path.join(__dirname, "../public")));

// -------------------------------
// 🚦 Routes
// -------------------------------
app.use("/", routes);

app.use("/api", apiRouter);

// -------------------------------
// 🚀 Server
// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
