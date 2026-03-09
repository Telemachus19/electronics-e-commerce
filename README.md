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
