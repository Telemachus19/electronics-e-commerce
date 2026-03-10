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

## 📚 Feature Documentation

### 🔐 Authentication

- **Strategy**: JWT (JSON Web Tokens) with `bcryptjs` for password hashing.
- **Login**: Supports **Email** OR **Phone** + Password.
- **Frontend Auth Flow**: Added dedicated **Login** and **Register** pages.
- **Token Handling**: Angular HTTP interceptor now automatically attaches `Authorization: Bearer <token>` to `/api/*` requests.
- **Logout**: Implemented via **Token Blacklisting** (tokens are stored in MongoDB with a TTL index until expiry).
- **Account Status Enforcement**: Login and authenticated requests now block users who are **deleted**, **restricted**, or **pending approval**.

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
- **User APIs Protection**: User management routes are now protected with `authenticate + authorizeRoles('admin')`.

### 🧪 API Testing

- Postman collection: `electronics-e-commerce-api.postman_collection.json`.
- Collection includes endpoints for new user-management actions (approve, restriction toggle, include deleted users).
