const express = require("express");
const {
  listCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categories.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const categoriesRouter = express.Router();

categoriesRouter.get("/", listCategories);
categoriesRouter.get("/:slug", getCategoryBySlug);

categoriesRouter.post("/", authenticate, createCategory);
categoriesRouter.put("/:slug", authenticate, updateCategory);
categoriesRouter.delete("/:slug", authenticate, deleteCategory);

module.exports = categoriesRouter;
