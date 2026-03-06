const express = require("express");
const { listProducts, getProductById, createProduct } = require("../controllers/products.controller");

const productsRouter = express.Router();

productsRouter.get("/", listProducts);
productsRouter.get("/:id", getProductById);
productsRouter.post("/", createProduct);

module.exports = productsRouter;
