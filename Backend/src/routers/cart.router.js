const express = require("express");
const {
  getCart,
  addToCart,
  removeFromCart,
} = require("../controllers/cart.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const cartRouter = express.Router();

cartRouter.get("/", authenticate, getCart);
cartRouter.post("/", authenticate, addToCart);
cartRouter.delete("/:productId", authenticate, removeFromCart);

module.exports = cartRouter;