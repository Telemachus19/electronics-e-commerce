const express = require("express");
const {
  createOrder,
  listOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  verifyStripePayment,
} = require("../controllers/orders.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const ordersRouter = express.Router();

ordersRouter.use(authenticate);

ordersRouter.post("/", createOrder);
ordersRouter.get("/", listOrders);
ordersRouter.get("/:id", getOrderById);
ordersRouter.put("/:id", updateOrder);
ordersRouter.delete("/:id", deleteOrder);
ordersRouter.post("/verify-payment", verifyStripePayment);

module.exports = ordersRouter;