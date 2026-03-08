# 🛍️ Electronics E-Commerce (MEAN)

Simple monorepo for an electronics e-commerce course project.

## 🗂️ Repo Structure

```text
electronics-e-commerce/
├─ Frontend/
└─ Backend/
```

```text
Backend/
├─ src/
│  ├─ config/
│  ├─ controllers/
│  ├─ models/
│  ├─ routers/
│  ├─ scripts/
│  └─ shared/
└─ .env
```

```text
Frontend/
├─ src/
│  └─ app/
│     ├─ core/
│     ├─ layouts/
│     ├─ features/
│     └─ shared/
├─ public/
└─ dist/
```

## ⚙️ Setup

### 1) Backend

```bash
cd Backend
npm install
```

### 2) Frontend

```bash
cd Frontend
npm install
```

## ▶️ Run

Start backend:

```bash
cd Backend
npm start
```

Start frontend in another terminal:

```bash
cd Frontend
npm start
```

Open:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:5000`

## 🧪 Build Frontend

```bash
cd Frontend
npm run build
```

## 🛠️ Notes

- Run commands inside `Frontend/` or `Backend/` (not repo root).
- MongoDB data will be in the DB name set by `DB_NAME`.

## 📚 Feature Documentation

### 🔐 Authentication
- **Strategy**: JWT (JSON Web Tokens) with `bcryptjs` for password hashing.
- **Login**: Supports **Email** OR **Phone** + Password.
- **Logout**: Implemented via **Token Blacklisting** (tokens are stored in MongoDB with a TTL index until expiry).

### 🛒 Shopping Cart & Checkout
- **Cart**: Database-backed and persistent. Uses **Lazy Creation** (cart document is created only when the first item is added).
- **Checkout Flow**:
  1. User fills Cart (`POST /api/cart`).
  2. User requests Checkout (`POST /api/orders`).
  3. Backend validates stock, creates Order, deducts stock, and **empties the Cart** in one operation.

### 📦 Orders
- **Permissions**:
  - **Users**: Can view their own orders. Can **delete (cancel)** an order only if status is `pending`.
  - **Admins/Sellers**: Can view all orders and update statuses (e.g., `shipped`).

### ⭐ Reviews
- **Ownership**: Users can only update/delete their own reviews.
- **Constraints**: A user is limited to **one review per product**.
- **Aggregates**: Fetching a product automatically calculates its `ratingAverage` and `ratingCount`.

### 👥 Roles (RBAC)
- **Seeded Roles**: `admin`, `seller`, `customer`, `support`.
- **Permissions**: Granular permissions (e.g., `orders:read:own`) are checked in controllers.
