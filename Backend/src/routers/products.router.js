const express = require("express");
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/products.controller");

const productsRouter = express.Router();

productsRouter.get("/", listProducts);
productsRouter.get("/:id", getProductById);
productsRouter.post("/", createProduct);
productsRouter.put("/:id", updateProduct);
productsRouter.delete("/:id", deleteProduct);

module.exports = productsRouter;
