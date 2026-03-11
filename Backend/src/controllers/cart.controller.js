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

const mergeCart = async (req, res) => {
  try {
    const { items } = req.body; // Expecting array: [{ productId: "...", quantity: 1 }]
    const userId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items to merge" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // If user has no DB cart, create one with the guest items
      const cartItems = items.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
      }));

      cart = await Cart.create({
        user: userId,
        items: cartItems,
      });
    } else {
      // If user already has a DB cart, merge items
      for (const guestItem of items) {
        const existingItem = cart.items.find(
          (dbItem) => dbItem.product.toString() === guestItem.productId
        );

        if (existingItem) {
          // Product exists? Add quantities
          existingItem.quantity += guestItem.quantity;
        } else {
          // Product new? Push to array
          cart.items.push({
            product: guestItem.productId,
            quantity: guestItem.quantity,
          });
        }
      }
      await cart.save();
    }

    // Return the updated, fully populated cart
    await cart.populate("items.product");
    return res.status(200).json({ data: cart });
  } catch (error) {
    console.error("Merge cart error:", error);
    return res.status(500).json({ message: "Failed to merge cart" });
  }
};

module.exports = { getCart, addToCart, removeFromCart, mergeCart };