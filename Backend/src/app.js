const express = require("express");
const cors = require("cors");
const rolesRouter = require("./routers/roles.router");
const usersRouter = require("./routers/users.router");
const productsRouter = require("./routers/products.router");
const categoriesRouter = require("./routers/categories.router");
const reviewsRouter = require("./routers/reviews.router");
const authRouter = require("./routers/auth.router");
const cartRouter = require("./routers/cart.router");
const ordersRouter = require("./routers/orders.router");

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:4200")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is running" });
});
app.use("/api/auth", authRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products/:productId/reviews", reviewsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);

module.exports = app;
