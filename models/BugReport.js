const mongoose = require("mongoose");

const bugReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    screenshots: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

bugReportSchema.index({
  reporter: 1,
  createdAt: -1
});

module.exports = mongoose.model("BugReport", bugReportSchema);
