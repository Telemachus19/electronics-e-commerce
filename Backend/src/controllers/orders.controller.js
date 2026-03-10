const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

const createOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    const userId = req.user._id;

    // 1. Get Cart
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 2. Calculate Total & Prepare Items
    let totalPrice = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product;

      // Check stock
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }

      totalPrice += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
    }

    // 3. Create Order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalPrice,
      shippingAddress,
    });

    // 4. Update Stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // 5. Clear Cart
    cart.items = [];
    await cart.save();

    return res.status(201).json({ data: order });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create order" });
  }
};

const listOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role.name === "admin";
    const isSeller = req.user.role.name === "seller";

    let query = {};
    if (!isAdmin && !isSeller) {
      // Customers see only their own orders
      query = { user: userId };
    }
    // Note: Sellers might need more complex logic to see only orders containing their products
    // For now, we'll treat sellers like admins or restrict them.
    // Let's assume sellers see all orders for simplicity in this iteration,
    // or you can restrict them to query = { user: userId } if they buy things too.

    const orders = await Order.find(query)
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ data: orders });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role.name === "admin";
    const isSeller = req.user.role.name === "seller";

    const order = await Order.findById(id).populate(
      "user",
      "firstName lastName email",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check permissions: Admin/Seller or Own Order
    if (
      !isAdmin &&
      !isSeller &&
      order.user._id.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    return res.status(200).json({ data: order });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch order" });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, shippingAddress } = req.body;
    const user = req.user;
    const isAdmin = user.role.name === "admin";
    const isSeller = user.role.name === "seller";

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update Status (Admin/Seller only)
    if (status) {
      if (!isAdmin && !isSeller) {
        return res
          .status(403)
          .json({ message: "Not authorized to update status" });
      }
      order.status = status;
    }

    // Update Address (Admin/Seller or Owner if pending)
    if (shippingAddress) {
      const isOwner = order.user.toString() === user._id.toString();
      if (isAdmin || isSeller || (isOwner && order.status === "pending")) {
        order.shippingAddress = shippingAddress;
      } else {
        return res
          .status(403)
          .json({ message: "Cannot update address for this order" });
      }
    }

    await order.save();
    return res.status(200).json({ data: order });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update order" });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isAdmin = user.role.name === "admin";
    const isOwner = order.user.toString() === user._id.toString();

    if (!isAdmin) {
      if (!isOwner || order.status !== "pending") {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this order" });
      }
    }

    await Order.findByIdAndDelete(id);

    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete order" });
  }
};

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
