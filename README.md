# 🛍️ Electronics E-Commerce (MEAN Stack)

A full-stack electronics e-commerce application built with MongoDB, Express, Angular, and Node.js.

## 🧰 Tech Stack

| Layer       | Technology                      |
| ----------- | ------------------------------- |
| 🖥️ Frontend | Angular 21, TypeScript          |
| ⚙️ Backend  | Node.js, Express.js             |
| 🗄️ Database | MongoDB (Mongoose)              |
| 🔐 Auth     | JWT, bcryptjs, Nodemailer (OTP) |
| 💳 Payments | Stripe                          |

## 🗂️ Project Structure

```
electronics-e-commerce/
├── Backend/   # Express REST API
└── Frontend/  # Angular SPA
```

## ⚙️ Setup

Install all dependencies from the repo root:

```bash
npm install          # installs root tooling (concurrently)
npm --prefix Backend install
npm --prefix Frontend install
```

Copy `Backend/.env.example` to `Backend/.env` and fill in your values (`MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, etc.).

## ▶️ Running

**Both apps (recommended):**

```bash
npm run dev
```

**Individually:**

```bash
# Terminal 1
cd Backend && npm start

# Terminal 2
cd Frontend && npm start
```

| Service     | URL                   |
| ----------- | --------------------- |
| 🌐 Frontend | http://localhost:4200 |
| 🔗 Backend  | http://localhost:5000 |

## 🏗️ Build

```bash
cd Frontend && npm run build
```

## ✨ Features

- 🔐 JWT authentication with email/phone login, OTP verification, and token blacklisting
- 👥 Role-based access control (`admin`, `seller`, `customer`, `support`)
- 🛠️ Admin user lifecycle management (approve, restrict, soft delete, change role)
- 🔍 Product catalog with search, filters, and pagination
- 🛒 Persistent cart with guest-to-authenticated merge
- 📦 Order management with Stripe payments
- ⭐ Product reviews (one per user) with computed rating aggregates
- ❤️ Client-side wishlist persisted in LocalStorage

## 📬 API

Postman collection: `E-Commerce.postman_collection.json`
