# InvOrder - Containerized Inventory & Order Management System

InvOrder is a production-ready, full-stack inventory and order tracking application designed with high-quality UI/UX aesthetics. The entire stack is containerized and orchestrated using Docker Compose.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), styled with a custom Vanilla CSS glassmorphic theme.
- **Backend API**: Python, powered by FastAPI (asynchronous context lifespans, input data schemas via Pydantic).
- **Database**: PostgreSQL (persisted using Docker volumes, integrity constraints with RESTRICT triggers).
- **Orchestration**: Docker Compose for service builds and startup ordering.

---

## ✨ Features

- **Dashboard Metrics**: Real-time stats showing Total Products, Total Customers, Total Orders, and Low Stock Alerts (items $\le$ 5 units).
- **Product Management**: Full CRUD operations with unique SKU checking and price/stock constraints.
- **Customer Directory**: Add/remove customer accounts with duplicate email validation.
- **Order Placement**: Multi-item shopping cart logic with automatic backend subtotal summation, live client-side stock availability checks, and automatic inventory decrements.
- **Order Cancellation**: Deleting/cancelling a past transaction automatically returns items to inventory stock.
- **Safety Constraints**: Prevent deleting active customers or products currently linked in existing sales orders.
- **Toasts Notification Stack**: Stateful, visual alerts for success verification or detailed error summaries.
- **Ocean Cyan Theme**: Dynamic visual styling with blur effects and active-highlight sidebar.

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.
- Python 3.11+ (if running tests locally outside Docker).

### Configuration
1. Check that a `.env` file exists in the root directory (based on `.env.example`).
   ```env
   # PostgreSQL Configuration
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=inventory_db

   # Backend Configuration
   DATABASE_URL=postgresql://postgres:postgres@db:5432/inventory_db
   ```

### Running the Application
Spin up the database, backend, and frontend containers concurrently:
```bash
docker compose up --build -d
```

Once initialized, the services will be running on:
- **React Frontend**: `http://localhost:3000`
- **FastAPI API Documentation**: `http://localhost:8000/docs`
- **PostgreSQL Database**: `localhost:5432`

To shut down the services:
```bash
docker compose down -v
```

---

## 🧪 Testing

We have built a comprehensive API test suite in `test_api.py` that verifies 10 business logic scenarios (negative prices, duplicate SKUs, duplicate emails, stock reduction, stock restoration on cancellation, restrict deletions, etc.).

Ensure the Docker containers are running, and execute:
```bash
python test_api.py
```

---

## 🌐 Production Deployment

### 1. Backend (Railway or Render)
Both platforms natively support Docker-based deployments.
1. Connect your GitHub repository to **Railway** or **Render**.
2. Add a new service pointing to the `backend` directory.
3. Configure a managed **PostgreSQL Database** addon/service on the platform.
4. Set the following environment variables in the service dashboard:
   - `DATABASE_URL`: Set to the connection string of your managed database.
   - `PORT`: (Render/Railway automatically manages this, and our Dockerfile dynamically binds to it).

### 2. Frontend (Vercel)
Vercel is optimized for building static single-page applications.
1. Connect your GitHub repository to **Vercel** and import the project.
2. Configure the following project options:
   - **Framework Preset**: `Vite` (automatically detected).
   - **Root Directory**: `frontend`.
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.
3. Set the following Environment Variable:
   - `VITE_API_URL`: Set to your live backend URL (e.g. `https://your-backend-api.railway.app`).
4. Vercel automatically reads `frontend/vercel.json` to handle client-side SPA routing rewrites.

