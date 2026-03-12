const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const Category = require("../models/category.model");
const Product = require("../models/product.model");

const toSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

const CATEGORIES = [
  {
    name: "Smartphones",
    slug: "smartphones",
    description: "Latest flagship phones from top brands.",
    imageUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop",
    displayOrder: 1,
  },
  {
    name: "Laptops",
    slug: "laptops",
    description: "Ultrabooks, workstations, and gaming laptops.",
    imageUrl:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop",
    displayOrder: 2,
  },
  {
    name: "Audio",
    slug: "audio",
    description: "Headphones, speakers, earbuds, and accessories.",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop",
    displayOrder: 3,
  },
  {
    name: "Gaming",
    slug: "gaming",
    description: "Consoles, controllers, and gaming gear.",
    imageUrl:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop",
    displayOrder: 4,
  },
];

const PRODUCTS = [
  {
    name: "Sony WH-1000XM6",
    sku: "SNY-WH1000XM6",
    brand: "Sony",
    category: "audio",
    description: "Premium ANC wireless headphones with 30-hour battery life.",
    price: 399,
    compareAtPrice: 449,
    stock: 55,
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=640&auto=format&fit=crop",
    tags: ["sony", "wireless", "anc"],
    attributes: {
      type: "Over-ear",
      battery: "30 hours",
      connectivity: "Bluetooth 5.3",
    },
  },
  {
    name: "Apple iPhone 16 Pro",
    sku: "APL-IP16P-256",
    brand: "Apple",
    category: "smartphones",
    description: "A18 Pro performance and advanced pro camera system.",
    price: 999,
    compareAtPrice: 1099,
    stock: 42,
    imageUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=640&auto=format&fit=crop",
    tags: ["apple", "5g", "camera"],
    attributes: { storage: "256 GB", color: "Black Titanium" },
  },
  {
    name: "Apple MacBook Pro 14 M4",
    sku: "APL-MBP14-M4-16",
    brand: "Apple",
    category: "laptops",
    description: "High-performance 14-inch laptop for creators and developers.",
    price: 1999,
    stock: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=640&auto=format&fit=crop",
    tags: ["apple", "laptop", "m4"],
    attributes: { ram: "16 GB", storage: "512 GB SSD" },
  },
  {
    name: "PlayStation 5 Pro",
    sku: "SNY-PS5P",
    brand: "Sony",
    category: "gaming",
    description: "Next-gen gaming console with ray tracing and 4K output.",
    price: 699,
    stock: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=640&auto=format&fit=crop",
    tags: ["sony", "console", "gaming"],
    attributes: { storage: "2 TB SSD", resolution: "4K" },
  },
];

async function seedCatalog() {
  try {
    await connectDatabase(env.mongoUri, env.dbName);

    for (const category of CATEGORIES) {
      await Category.findOneAndUpdate({ slug: category.slug }, category, {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      });
    }

    const savedCategories = await Category.find({}, { slug: 1 });
    const categorySlugToId = Object.fromEntries(
      savedCategories.map((c) => [c.slug, c._id]),
    );

    for (const product of PRODUCTS) {
      const categoryId = categorySlugToId[product.category];
      const slug = `${toSlug(product.name)}-${product.sku.toLowerCase()}`;

      await Product.findOneAndUpdate(
        { sku: product.sku },
        {
          ...product,
          slug,
          categoryId: categoryId || undefined,
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    console.log("Catalog seed complete");
    process.exit(0);
  } catch (error) {
    console.error("Catalog seed failed:", error.message);
    process.exit(1);
  }
}

seedCatalog();
