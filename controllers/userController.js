const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");
const logger = require("../utils/logger");

// =====================================================
// GET /api/users/search?q=rahul
// Search users
// =====================================================

exports.searchUsers = async (req, res, next) => {
  try {
    const searchText =
      req.query.q?.trim();

    if (!searchText) {
      const error = new Error("Search query is required");
      error.status = 400;
      return next(error);
    }

    const users =
      await User.find({
        $or: [
          {
            username: {
              $regex: searchText,
              $options: "i"
            }
          },
          {
            name: {
              $regex: searchText,
              $options: "i"
            }
          }
        ]
      })
      .select(
        "name username profilePicture"
      )
      .limit(20);

    logger.debug("User search", {
      userId: req.user.userId,
      query: searchText,
      results: users.length
    });

    res.json({
      count: users.length,
      users
    });

  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET /api/users/:id
// Get user profile
// =====================================================

exports.getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Find user
    const user = await User.findById(userId)
      .select(
        "name username bio profilePicture createdAt"
      );

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      return next(error);
    }

    // Get user's posts
    const posts = await Post.find({
      author: userId
    })
      .sort({
        createdAt: -1
      });

    // Count followers
    const followersCount =
      await Follow.countDocuments({
        following: userId
      });

    // Count following
    const followingCount =
      await Follow.countDocuments({
        follower: userId
      });

    // Count posts
    const postsCount =
      await Post.countDocuments({
        author: userId
      });

    // Check whether logged-in user follows
    // this profile
    const isFollowing =
      await Follow.exists({
        follower: req.user.userId,
        following: userId
      });

    logger.debug("Profile fetched", { requestedUserId: userId, userId: req.user.userId });

    res.json({
      user,
      posts,
      postsCount,
      followersCount,
      followingCount,
      isFollowing: !!isFollowing
    });

  } catch (error) {
    next(error);
  }
};

// =====================================================
// PUT /api/users/:id
// Update own profile
// =====================================================

exports.updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Authorization
    if (userId !== req.user.userId) {
      const error = new Error("You can only update your own profile");
      error.status = 403;
      return next(error);
    }

    const {
      name,
      bio,
      profilePicture
    } = req.body;

    const user =
      await User.findByIdAndUpdate(
        userId,
        {
          name,
          bio,
          profilePicture
        },
        {
          new: true,
          runValidators: true
        }
      ).select(
        "name username email bio profilePicture"
      );

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      return next(error);
    }

    logger.info("Profile updated", { userId });

    res.json({
      message: "Profile updated successfully",
      user
    });

  } catch (error) {
    next(error);
  }
};
