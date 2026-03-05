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
