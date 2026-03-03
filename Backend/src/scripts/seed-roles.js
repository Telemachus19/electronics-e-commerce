const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const Role = require("../models/role.model");

const defaultRoles = [
  {
    name: "admin",
    description: "Full access to platform management",
    permissions: ["*"],
    isSystem: true,
  },
  {
    name: "customer",
    description: "Can browse, order, and manage own account",
    permissions: [
      "products:read",
      "orders:create",
      "orders:read:own",
      "profile:update:own",
    ],
    isSystem: true,
  },
  {
    name: "seller",
    description: "Can manage own catalog and orders for own products",
    permissions: [
      "products:create:own",
      "products:update:own",
      "orders:read:seller",
    ],
    isSystem: true,
  },
];

const seedRoles = async () => {
  try {
    await connectDatabase(env.mongoUri, env.dbName);

    await Promise.all(
      defaultRoles.map((role) =>
        Role.updateOne(
          { name: role.name },
          { $setOnInsert: role },
          { upsert: true },
        ),
      ),
    );

    const roles = await Role.find({}, { name: 1, _id: 0 }).sort({ name: 1 });
    console.log(
      "Roles seeded successfully:",
      roles.map((role) => role.name).join(", "),
    );
  } catch (error) {
    console.error("Role seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedRoles();
