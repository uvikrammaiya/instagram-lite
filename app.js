const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const followRoutes = require("./routes/followRoutes");
const feedRoutes = require("./routes/feedRoutes.js");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const bugReportRoutes = require("./routes/bugReportRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/feed",feedRoutes);
app.use("/api/posts", commentRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/bug-reports", bugReportRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Instagram Lite API is running"
  });
});

app.use(errorHandler);

module.exports = app;