const Follow = require("../models/Follow");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");

async function notifyUser(req, type, recipientId) {
  const notification = await Notification.create({
    recipient: recipientId,
    sender: req.user.userId,
    type
  });

  await notification.populate(
    "sender",
    "name username profilePicture"
  );

  req.app
    .get("io")
    .to(String(recipientId))
    .emit("notification", notification);

  logger.debug("Notification emitted", {
    notificationId: notification._id,
    type,
    recipientId: String(recipientId),
    senderId: req.user.userId
  });
}

exports.followUser = async (req, res, next) => {
  try {
    const followerId = req.user.userId;
    const followingId = req.params.id;

    if (followerId === followingId) {
      const error = new Error("You cannot follow yourself");
      error.status = 400;
      return next(error);
    }

    const follow =
      await Follow.create({
        follower: followerId,
        following: followingId
      });

    await notifyUser(req, "follow", followingId);

    logger.info("User followed", { followerId, followingId });

    res.status(201).json({
      message: "User followed",
      follow
    });

  } catch (error) {
    if (error.code === 11000) {
      const conflict = new Error("You are already following this user");
      conflict.status = 409;
      return next(conflict);
    }

    next(error);
  }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    const result =
      await Follow.findOneAndDelete({
        follower: req.user.userId,
        following: req.params.id
      });

    if (!result) {
      const error = new Error("Follow relationship not found");
      error.status = 404;
      return next(error);
    }

    await notifyUser(req, "unfollow", req.params.id);

    logger.info("User unfollowed", { followerId: req.user.userId, followingId: req.params.id });

    res.json({
      message: "User unfollowed"
    });

  } catch (error) {
    next(error);
  }
};
