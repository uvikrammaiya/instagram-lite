const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const BUG_REPORT_DIR = path.join(__dirname, "..", "uploads", "bug-reports");

fs.mkdirSync(BUG_REPORT_DIR, { recursive: true });

// The extension comes from the validated mimetype, never from the
// client-supplied filename.
const EXTENSIONS = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BUG_REPORT_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;

    cb(null, uniqueName + EXTENSIONS[file.mimetype]);
  }
});

function imageFileFilter(req, file, cb) {
  if (!EXTENSIONS[file.mimetype]) {
    const error = new Error("Only PNG, JPEG, WebP or GIF images are allowed");
    error.status = 400;
    return cb(error);
  }

  cb(null, true);
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILES = 5;

const uploadBugScreenshots = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_FILES
  }
}).array("screenshots", MAX_FILES);

module.exports = {
  uploadBugScreenshots,
  MAX_FILE_SIZE_MB,
  MAX_FILES
};
