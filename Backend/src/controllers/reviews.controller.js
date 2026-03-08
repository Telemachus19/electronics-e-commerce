const Review = require("../models/review.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");

const listReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviews = await Review.find({ product: productId })
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: reviews });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Create review
    const review = await Review.create({
      product: productId,
      user: userId,
      rating,
      comment,
    });

    const populatedReview = await Review.findById(review._id).populate(
      "user",
      "firstName lastName"
    );

    return res.status(201).json({ data: populatedReview });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "You have already reviewed this product" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to create review" });
  }
};

const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id).populate(
      "user",
      "firstName lastName"
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    return res.status(200).json({ data: review });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch review" });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user = req.user;

    const existingReview = await Review.findById(id);
    if (!existingReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership or admin status
    if (existingReview.user.toString() !== user._id.toString() && user.role.name !== 'admin') {
      return res.status(403).json({ message: "Not authorized to update this review" });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { rating, comment },
      { new: true, runValidators: true }
    ).populate("user", "firstName lastName");

    return res.status(200).json({ data: review });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to update review" });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership or admin status
    if (review.user.toString() !== user._id.toString() && user.role.name !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await Review.findByIdAndDelete(id);

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete review" });
  }
};

module.exports = {
  listReviewsByProduct,
  createReview,
  getReviewById,
  updateReview,
  deleteReview,
};
