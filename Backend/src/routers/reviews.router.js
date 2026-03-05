const express = require("express");
const { listReviewsByProduct, createReview } = require("../controllers/reviews.controller");

const reviewsRouter = express.Router({ mergeParams: true });

reviewsRouter.get("/", listReviewsByProduct);
reviewsRouter.post("/", createReview);

module.exports = reviewsRouter;
