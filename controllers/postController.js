const Post = require("../models/Post");
const Like = require("../models/Like");
const logger = require("../utils/logger");

exports.createPost = async (req, res, next) => {
  try {
    const {
      image,
      caption
    } = req.body;

    const post = await Post.create({
      author: req.user.userId,
      image,
      caption
    });

    logger.info("Post created", { postId: post._id, userId: req.user.userId });

    res.status(201).json(post);

  } catch (error) {
    next(error);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(
      req.params.id
    ).populate(
      "author",
      "name username profilePicture"
    );

    if (!post) {
      const error = new Error("Post not found");
      error.status = 404;
      return next(error);
    }

    const [likesCount, likedByUser] = await Promise.all([
      Like.countDocuments({ post: post._id }),
      Like.exists({ post: post._id, user: req.user.userId })
    ]);

    logger.debug("Post fetched", { postId: post._id, userId: req.user.userId });

    res.json({
      ...post.toObject(),
      likesCount,
      isLiked: !!likedByUser
    });

  } catch (error) {
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(
      req.params.id
    );

    if (!post) {
      const error = new Error("Post not found");
      error.status = 404;
      return next(error);
    }

    if (
      !post.author.equals(req.user.userId)
    ) {
      const error = new Error("You can only edit your own posts");
      error.status = 403;
      return next(error);
    }

    post.caption = req.body.caption;

    await post.save();

    logger.info("Post updated", { postId: post._id, userId: req.user.userId });

    res.json(post);

  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(
      req.params.id
    );

    if (!post) {
      const error = new Error("Post not found");
      error.status = 404;
      return next(error);
    }

    if (
      !post.author.equals(req.user.userId)
    ) {
      const error = new Error("You can only delete your own posts");
      error.status = 403;
      return next(error);
    }

    await post.deleteOne();

    logger.info("Post deleted", { postId: post._id, userId: req.user.userId });

    res.json({
      message: "Post deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};

exports.likePost = async (req, res, next) => {
  try {
    const like = await Like.create({
      user: req.user.userId,
      post: req.params.id
    });

    const likesCount = await Like.countDocuments({
      post: req.params.id
    });

    logger.info("Post liked", { postId: req.params.id, userId: req.user.userId, likesCount });

    res.status(201).json({
      message: "Post liked",
      like,
      likesCount
    });

  } catch (error) {
    if (error.code === 11000) {
      const conflict = new Error("Post already liked");
      conflict.status = 409;
      return next(conflict);
    }

    next(error);
  }
};

exports.unlikePost = async (req, res, next) => {
  try {
    const result =
      await Like.findOneAndDelete({
        user: req.user.userId,
        post: req.params.id
      });

    if (!result) {
      const error = new Error("Like not found");
      error.status = 404;
      return next(error);
    }

    const likesCount = await Like.countDocuments({
      post: req.params.id
    });

    logger.info("Post unliked", { postId: req.params.id, userId: req.user.userId, likesCount });

    res.json({
      message: "Post unliked",
      likesCount
    });

  } catch (error) {
    next(error);
  }
};
