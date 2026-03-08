const Product = require("../models/product.model");
const Review = require("../models/review.model");

const listProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json({ data: products });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get reviews and calculate average rating
    const reviews = await Review.find({ product: id }).populate(
      "user",
      "firstName lastName"
    );

    const ratingAverage =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return res.status(200).json({
      data: {
        ...product.toObject(),
        reviews,
        ratingAverage: parseFloat(ratingAverage),
        ratingCount: reviews.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch product" });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, imageUrl } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      category,
      imageUrl,
    });

    return res.status(201).json({ data: product });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to create product" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ data: product });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to update product" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product" });
  }
};

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
