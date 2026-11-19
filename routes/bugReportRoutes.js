const express = require("express");

const bugReportController = require("../controllers/bugReportController");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadBugScreenshots } = require("../middleware/uploadMiddleware");

const router = express.Router();

// authMiddleware runs first so unauthenticated requests never write files.
router.post(
  "/",
  authMiddleware,
  uploadBugScreenshots,
  bugReportController.createBugReport
);

module.exports = router;
