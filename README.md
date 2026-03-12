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

### 0) Install all workspaces (recommended)

From repo root:

```bash
npm install
```

This installs root tooling (like `concurrently`).

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

### Option A: Run both from one terminal (recommended)

From repo root:

```bash
npm run dev
```

This starts:

- Backend: `npm --prefix Backend run dev`
- Frontend: `npm --prefix Frontend start`

If port `4200` is already in use, stop the existing Angular dev server first.

### Option B: Run each app manually

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

- You can now run from repo root using `npm run dev`.
- MongoDB data will be in the DB name set by `DB_NAME`.

## 🆕 New Features

- **Seller/Admin Product Workspace**
  - Added seller/admin dashboard routes: `/panel`, `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`.
  - Sellers can only manage their own products; admins can manage the full catalog.

- **Advanced Product Discovery**
  - Products API now supports `q`, `category`, `minPrice`, `maxPrice`, `minRating`, `inStock`, `sort`, `page`, and `limit`.
  - Frontend product listing includes search, category filtering, price range filtering, and rating filters.

- **Wishlist (Frontend)**
  - Added dedicated `/wishlist` page.
  - Wishlist is persisted in LocalStorage (`electronics_wishlist`) with live header count updates.
  - Product list and product details support save/remove from wishlist.

- **Profile Self-Service**
  - Added authenticated profile endpoints: `GET /api/auth/me` and `PUT /api/auth/me`.
  - Frontend profile screen now supports viewing and editing account details.

- **Verification UX Improvements**
  - Added `POST /api/auth/resend-verification-email` with resend cooldown protection.
  - Added frontend verification flow routes: `/verify-user` and `/verify-user/otp`.

- **Category Enhancements**
  - Public categories endpoint returns active categories with live product counts.
  - Admin category management supports create/update/delete by slug.

## 📚 Feature Documentation

### 🔐 Authentication

- **Strategy**: JWT (JSON Web Tokens) with `bcryptjs` for password hashing.
- **Login**: Supports **Email** OR **Phone** + Password.
- **Frontend Auth Flow**: Added dedicated **Login** and **Register** pages.
- **Email Verification**: Registration triggers a 6-digit OTP email (via Nodemailer). Users must verify (`/api/auth/verify-email`) before logging in.
- **Resend OTP with Cooldown**: Added `POST /api/auth/resend-verification-email` with server-side cooldown handling.
- **Token Handling**: Angular HTTP interceptor now automatically attaches `Authorization: Bearer <token>` to `/api/*` requests.
- **Logout**: Implemented via **Token Blacklisting** (tokens are stored in MongoDB with a TTL index until expiry).
- **Account Status Enforcement**: Login and authenticated requests now block users who are **deleted**, **restricted**, or **pending approval**.
- **Profile APIs**: Added `GET /api/auth/me` and `PUT /api/auth/me` for authenticated profile retrieval and updates.

### 🧭 Routing & Access Guards (Frontend)

- Added `authGuard` to protect private routes.
- Added `adminGuard` to enforce admin-only access to User Management.
- Updated app navigation to show auth actions (`Login`, `Sign Up`, `Logout`) and role-aware links.

### 👤 User Lifecycle Management (Admin)

- Added user lifecycle fields: `isApproved`, `isRestricted`, `isDeleted`, and `deletedAt`.
- User registration now creates accounts as **pending approval** by default.
- Added admin actions for:
  - **Approve user**
  - **Restrict / Unrestrict user**
  - **Update user role**
  - **Soft delete user**
- Users list now supports `includeDeleted=true` for admin retrieval of soft-deleted users.

### 🛒 Shopping Cart & Checkout

- **Cart**: Database-backed and persistent. Uses **Lazy Creation** (cart document is created only when the first item is added).
- **Guest Strategy**: Backend supports `POST /api/cart/merge`. Frontend stores guest items in LocalStorage and merges them into the database upon login.
- **Checkout Flow**:
  1. User fills Cart (`POST /api/cart`).
  2. User requests Checkout (`POST /api/orders`).
  3. Backend validates stock, creates Order, deducts stock, and **empties the Cart** in one operation.

### 📦 Orders

- **Permissions**:
  - **Users**: Can view their own orders. Can **delete (cancel)** an order only if status is `pending`.
  - **Admins/Sellers**: Can view all orders and update statuses (e.g., `shipped`).
- **Payments**: Integrated **Stripe** for card payments.
  - `createOrder` returns a Stripe Checkout URL if `paymentMethod: 'card'`.
  - Added `POST /api/orders/verify-payment` to confirm payment status after redirect.

### ⭐ Reviews

- **Ownership**: Users can only update/delete their own reviews.
- **Constraints**: A user is limited to **one review per product**.
- **Aggregates**: Fetching a product automatically calculates its `ratingAverage` and `ratingCount`.

### 👥 Roles (RBAC)

- **Seeded Roles**: `admin`, `seller`, `customer`, `support`.
- **Permissions**: Granular permissions (e.g., `orders:read:own`) are checked in controllers.
- **User APIs Protection**: User management routes are now protected with `authenticate + authorizeRoles('admin')`.
- **Seller Product Ownership Rules**: Seller users can only list/manage/update/delete products they own, while admins can manage all products.

### 🧪 API Testing

- Postman collection: `E-Commerce.postman_collection.json`.
- Collection includes endpoints for new user-management actions (approve, restriction toggle, include deleted users).
