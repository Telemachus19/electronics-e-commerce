const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price imageUrl"
    );

    if (!cart) {
      return res.status(200).json({ data: { items: [] } });
    }

    return res.status(200).json({ data: cart });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch cart" });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;
    const qty = parseInt(quantity) || 1;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.stock < qty) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Create new cart
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity: qty }],
      });
    } else {
      // Update existing cart
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += qty;
      } else {
        cart.items.push({ product: productId, quantity: qty });
      }
      await cart.save();
    }

    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name price imageUrl"
    );

    return res.status(200).json({ data: populatedCart });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add to cart" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name price imageUrl"
    );

    return res.status(200).json({ data: populatedCart });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove item" });
  }
};

module.exports = { getCart, addToCart, removeFromCart };