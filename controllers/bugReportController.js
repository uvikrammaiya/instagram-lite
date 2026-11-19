const fs = require("fs");
const path = require("path");

const BugReport = require("../models/BugReport");
const logger = require("../utils/logger");

function removeFiles(files) {
  files.forEach((file) => {
    fs.unlink(file.path, (err) => {
      if (err) {
        logger.warn("Failed to remove uploaded file", { file: file.path, error: err.message });
      }
    });
  });
}

exports.createBugReport = async (req, res, next) => {
  const files = req.files || [];

  try {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();

    if (!title || !description) {
      removeFiles(files);

      const error = new Error("Title and description are required");
      error.status = 400;
      return next(error);
    }

    const bugReport = await BugReport.create({
      reporter: req.user.userId,
      title,
      description,
      screenshots: files.map((file) =>
        path.posix.join("uploads", "bug-reports", file.filename)
      )
    });

    logger.info("Bug report submitted", {
      bugReportId: bugReport._id,
      userId: req.user.userId,
      screenshots: files.length
    });

    res.status(201).json({
      message: "Bug report submitted",
      bugReport
    });

  } catch (error) {
    removeFiles(files);
    next(error);
  }
};
