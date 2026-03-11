const express = require("express");
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/products.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");

const productsRouter = express.Router();

productsRouter.get("/", listProducts);
productsRouter.get("/:id", getProductById);
productsRouter.post("/", authenticate, authorizeRoles("admin", "seller"), createProduct);
productsRouter.put("/:id", authenticate, authorizeRoles("admin", "seller"), updateProduct);
productsRouter.delete("/:id", authenticate, authorizeRoles("admin", "seller"), deleteProduct);

module.exports = productsRouter;
