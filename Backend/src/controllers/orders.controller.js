const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    const userId = req.user._id;
    const method = paymentMethod === "card" ? "card" : "cod";

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

    // 3. Handle Stripe Session (if Card)
    let stripeSessionId = null;
    let stripeUrl = null;

    if (method === "card") {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: cart.items.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.product.name,
              images: item.product.imageUrl ? [item.product.imageUrl] : [],
            },
            unit_amount: Math.round(item.product.price * 100), // Stripe expects cents
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
        customer_email: req.user.email,
      });

      stripeSessionId = session.id;
      stripeUrl = session.url;
    }

    // 4. Create Order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalPrice,
      shippingAddress,
      paymentMethod: method,
      paymentStatus: method === "card" ? "pending" : "pending", // COD is also pending until delivered/paid
      stripeSessionId,
    });

    // 5. Update Stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // 6. Clear Cart
    cart.items = [];
    await cart.save();

    return res.status(201).json({ data: order, stripeUrl });
  } catch (error) {
    console.error("Create order error:", error);
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

const verifyStripePayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const order = await Order.findOneAndUpdate(
        { stripeSessionId: sessionId },
        { paymentStatus: "paid", status: "processing" },
        { new: true }
      );
      return res.status(200).json({ message: "Payment verified", data: order });
    }

    return res.status(400).json({ message: "Payment not completed" });
  } catch (error) {
    return res.status(500).json({ message: "Verification failed" });
  }
};

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  verifyStripePayment,
};
