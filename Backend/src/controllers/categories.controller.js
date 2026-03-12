const Category = require("../models/category.model");
const Product = require("../models/product.model");

/**
 * GET /api/categories
 * Returns all active categories with live product counts.
 */
const listCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    if (categories.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Count by both categoryId and legacy category slug for backward compatibility.
    const counts = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            categoryId: "$categoryId",
            category: "$category",
          },
          productCount: { $sum: 1 },
        },
      },
    ]);

    const countByCategoryId = new Map();
    const countByCategorySlug = new Map();

    counts.forEach((entry) => {
      const categoryId = entry._id?.categoryId;
      const categorySlug = String(entry._id?.category || "").toLowerCase();

      if (categoryId) {
        countByCategoryId.set(categoryId.toString(), entry.productCount);
      }

      if (categorySlug) {
        countByCategorySlug.set(
          categorySlug,
          (countByCategorySlug.get(categorySlug) || 0) + entry.productCount,
        );
      }
    });

    const result = categories.map((cat) => ({
      ...cat,
      productCount:
        countByCategoryId.get(cat._id.toString()) ||
        countByCategorySlug.get(cat.slug) ||
        0,
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
};

/**
 * GET /api/categories/:slug
 * Returns a single category plus its product count.
 */
const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({
      slug: req.params.slug,
      isActive: true,
    }).lean();

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const productCount = await Product.countDocuments({
      categoryId: category._id,
      isActive: true,
    });

    return res.status(200).json({ data: { ...category, productCount } });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch category" });
  }
};

/**
 * POST /api/categories  (admin)
 */
const createCategory = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      imageUrl,
      parentCategoryId,
      displayOrder,
    } = req.body;

    const category = await Category.create({
      name,
      slug,
      description,
      imageUrl,
      parentCategoryId,
      displayOrder,
    });

    return res.status(201).json({ data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "A category with this slug already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to create category" });
  }
};

/**
 * PUT /api/categories/:slug  (admin)
 */
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true },
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ data: category });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to update category" });
  }
};

/**
 * DELETE /api/categories/:slug  (admin)
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete category" });
  }
};

module.exports = {
  listCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
