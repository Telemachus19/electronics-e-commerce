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
    const { userId, rating, comment } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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

module.exports = {
  listReviewsByProduct,
  createReview,
};
