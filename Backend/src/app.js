const express = require("express");
const cors = require("cors");
const rolesRouter = require("./routers/roles.router");
const usersRouter = require("./routers/users.router");

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:4200")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin ?? '')) {
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
app.use("/api/roles", rolesRouter);
app.use("/api/users", usersRouter);

module.exports = app;
