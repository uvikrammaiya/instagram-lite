const Comment = require("../models/Comment");
const analyzeCommentTexts = require("../services/AIservice");
const logger = require("../utils/logger");

const MAX_COMMENTS_TO_ANALYZE = 50;

exports.analyzeComments = async (req, res, next) => {
  try {
    const postId = req.params.id;

    const [totalComments, comments] = await Promise.all([
      Comment.countDocuments({ post: postId }),
      Comment.find({ post: postId })
        .populate("author", "username")
        .sort({ createdAt: -1 })
        .limit(MAX_COMMENTS_TO_ANALYZE)
    ]);

    const counts = { positive: 0, negative: 0, neutral: 0, abusive: 0 };

    if (comments.length === 0) {
      return res.json({
        postId,
        totalComments: 0,
        analyzedComments: 0,
        counts,
        overall: null,
        hasAbusive: false,
        summary: "",
        flagged: []
      });
    }

    const { summary, labels } = await analyzeCommentTexts(
      comments.map((comment) => comment.text)
    );

    const flagged = [];

    labels.forEach((label, index) => {
      counts[label] += 1;

      if (label === "abusive") {
        flagged.push({
          id: comments[index]._id,
          text: comments[index].text,
          author: comments[index].author?.username
        });
      }
    });

    const topCount = Math.max(...Object.values(counts));
    const leaders = Object.keys(counts).filter((label) => counts[label] === topCount);

    logger.info("Comments analyzed", {
      postId,
      userId: req.user.userId,
      analyzed: comments.length,
      counts
    });

    res.json({
      postId,
      totalComments,
      analyzedComments: comments.length,
      counts,
      overall: leaders.length === 1 ? leaders[0] : "mixed",
      hasAbusive: counts.abusive > 0,
      summary,
      flagged
    });

  } catch (error) {
    if (error.cause) {
      logger.error("Gemini request failed", {
        postId: req.params.id,
        error: error.cause.message,
        upstreamStatus: error.cause.status
      });
    }

    next(error);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const comment =
      await Comment.create({
        post: req.params.id,
        author: req.user.userId,
        text: req.body.text
      });

    logger.info("Comment created", { commentId: comment._id, postId: req.params.id, userId: req.user.userId });

    res.status(201).json(comment);

  } catch (error) {
    next(error);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const comments =
      await Comment.find({
        post: req.params.id
      })
      .populate(
        "author",
        "name username profilePicture"
      )
      .sort({
        createdAt: -1
      });

    logger.debug("Comments fetched", { postId: req.params.id, count: comments.length });

    res.json(comments);

  } catch (error) {
    next(error);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment =
      await Comment.findById(
        req.params.id
      );

    if (!comment) {
      const error = new Error("Comment not found");
      error.status = 404;
      return next(error);
    }

    if (
      !comment.author.equals(
        req.user.userId
      )
    ) {
      const error = new Error("You can only delete your own comment");
      error.status = 403;
      return next(error);
    }

    await comment.deleteOne();

    logger.info("Comment deleted", { commentId: comment._id, userId: req.user.userId });

    res.json({
      message: "Comment deleted"
    });

  } catch (error) {
    next(error);
  }
};
