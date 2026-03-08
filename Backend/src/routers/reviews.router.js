const express = require("express");
const {
  listReviewsByProduct,
  createReview,
  getReviewById,
  updateReview,
  deleteReview,
} = require("../controllers/reviews.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const reviewsRouter = express.Router({ mergeParams: true });

reviewsRouter.get("/", listReviewsByProduct);
reviewsRouter.get("/:id", getReviewById);

reviewsRouter.post("/", authenticate, createReview);
reviewsRouter.put("/:id", authenticate, updateReview);
reviewsRouter.delete("/:id", authenticate, deleteReview);

module.exports = reviewsRouter;
