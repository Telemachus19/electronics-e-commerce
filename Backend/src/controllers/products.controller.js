const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Review = require("../models/review.model");

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  featured: { createdAt: -1 },
};

const listProducts = async (req, res) => {
  try {
    const {
      category,
      q,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sort = "newest",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { isActive: true };

    if (category) {
      filter.category = String(category).toLowerCase();
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
    }

    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    if (q) {
      const term = String(q).trim();
      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
      ];
    }

    if (minRating !== undefined) {
      const parsedMinRating = Number(minRating);
      if (!Number.isNaN(parsedMinRating)) {
        const safeMinRating = Math.min(5, Math.max(1, parsedMinRating));
        const matchedRatings = await Review.aggregate([
          {
            $group: {
              _id: "$product",
              ratingAverage: { $avg: "$rating" },
            },
          },
          {
            $match: {
              ratingAverage: { $gte: safeMinRating },
            },
          },
          { $project: { _id: 1 } },
        ]);

        const ratedProductIds = matchedRatings.map((doc) => doc._id);
        if (ratedProductIds.length === 0) {
          return res.status(200).json({
            data: [],
            meta: {
              total: 0,
              page: 1,
              limit: Math.min(100, Math.max(1, parseInt(limit) || 20)),
              totalPages: 0,
            },
          });
        }

        filter._id = { $in: ratedProductIds };
      }
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    const sortQuery = SORT_MAP[sort] || SORT_MAP.newest;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortQuery).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    const productIds = products.map((p) => p._id);
    const ratingStats = productIds.length
      ? await Review.aggregate([
          { $match: { product: { $in: productIds } } },
          {
            $group: {
              _id: "$product",
              ratingAverage: { $avg: "$rating" },
              ratingCount: { $sum: 1 },
            },
          },
        ])
      : [];

    const ratingsByProductId = new Map(
      ratingStats.map((stat) => [
        stat._id.toString(),
        {
          ratingAverage: parseFloat(stat.ratingAverage.toFixed(1)),
          ratingCount: stat.ratingCount,
        },
      ]),
    );

    const productsWithRatings = products.map((productDoc) => {
      const product = productDoc.toObject();
      const stats = ratingsByProductId.get(product._id.toString()) || {
        ratingAverage: 0,
        ratingCount: 0,
      };

      return {
        ...product,
        ratingAverage: stats.ratingAverage,
        ratingCount: stats.ratingCount,
      };
    });

    return res.status(200).json({
      data: productsWithRatings,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};

const listCategories = async (req, res) => {
  try {
    const categoriesController = require("./categories.controller");
    return categoriesController.listCategories(req, res);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const normalized = String(id || "")
      .trim()
      .toLowerCase();
    const lookupClauses = [{ slug: normalized }];
    if (mongoose.isValidObjectId(id)) {
      lookupClauses.push({ _id: id });
    }

    const product = await Product.findOne({
      isActive: true,
      $or: lookupClauses,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get reviews and calculate average rating
    const reviews = await Review.find({ product: product._id }).populate(
      "user",
      "firstName lastName",
    );

    const ratingAverage =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
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
    const {
      name,
      slug,
      sku,
      brand,
      description,
      price,
      compareAtPrice,
      stock,
      category,
      categoryId,
      imageUrl,
      images,
      tags,
      attributes,
    } = req.body;

    const product = await Product.create({
      name,
      slug,
      sku,
      brand,
      description,
      price,
      compareAtPrice,
      stock,
      category: category?.toLowerCase(),
      categoryId: categoryId || undefined,
      imageUrl,
      images,
      tags,
      attributes,
    });

    return res.status(201).json({ data: product });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "A product with this slug or SKU already exists" });
    }
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
  listCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
