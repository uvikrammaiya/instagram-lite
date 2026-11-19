const Report = require("../models/Report");
const Post = require("../models/Post");
const logger = require("../utils/logger");

exports.reportPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      const error = new Error("Post not found");
      error.status = 404;
      return next(error);
    }

    if (post.author.equals(req.user.userId)) {
      const error = new Error("You cannot report your own post");
      error.status = 400;
      return next(error);
    }

    // A previously reviewed report goes back into the review queue.
    const reopened = await Report.findOneAndUpdate(
      {
        post: post._id,
        reporter: req.user.userId,
        status: { $ne: "pending" }
      },
      {
        status: "pending",
        $unset: { reviewedBy: 1 }
      }
    );

    if (!reopened) {
      await Report.create({
        post: post._id,
        reporter: req.user.userId
      });
    }

    logger.info(
      reopened ? "Post re-reported, report reopened" : "Post reported",
      { postId: post._id, userId: req.user.userId }
    );

    res.status(201).json({
      message: "Post reported"
    });

  } catch (error) {
    if (error.code === 11000) {
      const conflict = new Error("You have already reported this post");
      conflict.status = 409;
      return next(conflict);
    }

    next(error);
  }
};

exports.getReportedPosts = async (req, res, next) => {
  try {
    const reports = await Report.find({ status: "pending" })
      .populate({
        path: "post",
        populate: {
          path: "author",
          select: "name username profilePicture"
        }
      })
      .populate("reporter", "username")
      .sort({ createdAt: -1 });

    const grouped = new Map();

    for (const report of reports) {
      if (!report.post) {
        continue;
      }

      const key = String(report.post._id);

      if (!grouped.has(key)) {
        grouped.set(key, {
          post: report.post,
          reportCount: 0,
          reporters: [],
          lastReportedAt: report.createdAt
        });
      }

      const entry = grouped.get(key);

      entry.reportCount += 1;
      entry.reporters.push(report.reporter?.username);
    }

    logger.debug("Reported posts fetched", {
      moderatorId: req.user.userId,
      posts: grouped.size
    });

    res.json([...grouped.values()]);

  } catch (error) {
    next(error);
  }
};

exports.markPostSafe = async (req, res, next) => {
  try {
    const result = await Report.updateMany(
      {
        post: req.params.postId,
        status: "pending"
      },
      {
        status: "safe",
        reviewedBy: req.user.userId
      }
    );

    if (result.matchedCount === 0) {
      const error = new Error("No pending reports for this post");
      error.status = 404;
      return next(error);
    }

    logger.info("Post marked as safe", {
      postId: req.params.postId,
      moderatorId: req.user.userId,
      reportsCleared: result.modifiedCount
    });

    res.json({
      message: "Post marked as safe"
    });

  } catch (error) {
    next(error);
  }
};

exports.deleteReportedPost = async (req, res, next) => {
  try {
    const pendingCount = await Report.countDocuments({
      post: req.params.postId,
      status: "pending"
    });

    if (pendingCount === 0) {
      const error = new Error("No pending reports for this post");
      error.status = 404;
      return next(error);
    }

    await Post.findByIdAndDelete(req.params.postId);

    await Report.updateMany(
      {
        post: req.params.postId,
        status: "pending"
      },
      {
        status: "removed",
        reviewedBy: req.user.userId
      }
    );

    logger.info("Reported post deleted by moderator", {
      postId: req.params.postId,
      moderatorId: req.user.userId,
      reportsCleared: pendingCount
    });

    res.json({
      message: "Post deleted"
    });

  } catch (error) {
    next(error);
  }
};
