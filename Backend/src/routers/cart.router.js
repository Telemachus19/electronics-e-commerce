const express = require("express");
const {
  getCart,
  addToCart,
  removeFromCart,
  mergeCart,
} = require("../controllers/cart.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const cartRouter = express.Router();

cartRouter.use(authenticate);

cartRouter.get("/", getCart);
cartRouter.post("/", addToCart);
cartRouter.post("/merge", mergeCart);
cartRouter.delete("/:productId", removeFromCart);

module.exports = cartRouter;