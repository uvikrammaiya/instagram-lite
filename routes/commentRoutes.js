const express = require("express");

const commentController = require("../controllers/commentController");
const authMiddleware =  require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/:id/comments",
  authMiddleware,
  commentController.createComment
);

router.get(
  "/:id/comments",
  commentController.getComments
);

router.get(
  "/:id/comments/analysis",
  authMiddleware,
  commentController.analyzeComments
);

router.delete(
  "/:id",
  authMiddleware,
  commentController.deleteComment
);

module.exports = router;
