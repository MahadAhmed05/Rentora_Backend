# Rentora — Backend API

> **Part of a MERN stack application.** This repository contains only the backend (REST API). The frontend lives in a separate repository — see [Connection to the Other Repo](#-connection-to-the-other-repo).

Rentora is a peer-to-peer rental marketplace where users can list items for rent (as **owners**) or browse and request items from other users (as **renters**). The backend exposes a RESTful JSON API that handles authentication, product listings, rental requests, booking management, and automated email notifications.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [Scripts](#-scripts)
- [Deployment](#-deployment)
- [Connection to the Other Repo](#-connection-to-the-other-repo)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (v18+) |
| Framework | Express.js v4 |
| Database | MongoDB Atlas (via Mongoose v8) |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Password Hashing | `bcryptjs` |
| Input Validation | Joi v17 |
| Email | Nodemailer (Gmail SMTP) |
| Environment Config | `dotenv` |
| CORS | `cors` |
| Dev Server | `nodemon` |

---

## 📁 Project Structure

```
Backend/
├── server.js              # App entry point — Express setup, middleware, routes
├── .env                   # Environment variables (never commit this)
├── config/
│   └── db.js              # MongoDB connection logic
├── controllers/
│   ├── authController.js  # Register & login handlers
│   ├── productController.js # CRUD for product listings
│   ├── requestController.js # Rental request lifecycle (create, accept, reject)
│   ├── bookingController.js # Booking queries
│   └── userController.js  # User profile retrieval
├── middleware/
│   ├── authMiddleware.js  # JWT verification — attaches req.user
│   └── roleMiddleware.js  # Role-based access control (owner / renter)
├── models/
│   ├── User.js            # User schema (name, email, phone, password, role)
│   ├── Product.js         # Product schema (name, category, price, status, owner)
│   ├── Request.js         # Rental request schema (pending → accepted / rejected)
│   └── Booking.js         # Confirmed booking records
├── routes/
│   ├── authRoutes.js      # /api/auth
│   ├── productRoutes.js   # /api/products
│   ├── requestRoutes.js   # /api/requests
│   ├── bookingRoutes.js   # /api/bookings
│   └── userRoutes.js      # /api/user
├── utils/
│   └── sendEmail.js       # Nodemailer helper for transactional emails
└── validators/
    └── schemas.js         # Joi schemas + validate() middleware factory
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB Atlas** cluster (free tier works)
- A **Gmail account** with an App Password enabled (for email notifications)

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Backend

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env   # or manually create .env — see Environment Variables below
```

### Running in Development

```bash
npm run dev
```

The server starts on `http://localhost:5000` with hot-reloading via `nodemon`.

### Running in Production

```bash
npm start
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root. All variables below are required.

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the Express server listens on | `5000` |
| `MONGO_URI` | Full MongoDB connection string (Atlas or local) | `mongodb+srv://user:pass@cluster.mongodb.net/rentora` |
| `JWT_SECRET` | Secret key used to sign and verify JWTs. Use a long, random string in production. | `some_long_random_secret` |
| `JWT_EXPIRES_IN` | Token expiry duration (Vercel/JWT format) | `7d` |
| `EMAIL_USER` | Gmail address used as the sender for transactional emails | `yourapp@gmail.com` |
| `EMAIL_PASS` | Gmail App Password (not your account password — [generate one here](https://myaccount.google.com/apppasswords)) | `xxxx xxxx xxxx xxxx` |

**`.env` template:**

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
EMAIL_USER=yourapp@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> ⚠️ **Never commit `.env` to version control.** Add it to `.gitignore`.

---

## 📡 API Overview

All endpoints return JSON. Protected routes require an `Authorization: Bearer <token>` header.  
Role restrictions: `[owner]` = owners only, `[renter]` = renters only, `[auth]` = any authenticated user.

### Auth — `/api/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create a new user account (`owner` or `renter`) |
| `POST` | `/api/auth/login` | Public | Authenticate and receive a JWT |

### Products — `/api/products`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | Get all product listings (supports filtering) |
| `GET` | `/api/products/:id` | Public | Get a single product by ID |
| `GET` | `/api/products/my` | `[owner]` | Get all products listed by the authenticated owner |
| `POST` | `/api/products` | `[owner]` | Create a new product listing |
| `PUT` | `/api/products/:id/status` | `[owner]` | Update a product's status (e.g. back to `available`) |
| `DELETE` | `/api/products/:id` | `[owner]` | Delete a product (blocked if active bookings exist) |

### Rental Requests — `/api/requests`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/api/requests` | `[renter]` | Submit a rental request for a product |
| `GET` | `/api/requests/my` | `[renter]` | Get all requests submitted by the authenticated renter |
| `GET` | `/api/requests/incoming` | `[owner]` | Get all pending requests for the owner's products |
| `PUT` | `/api/requests/:id/accept` | `[owner]` | Accept a request → creates a booking + notifies renter via email |
| `PUT` | `/api/requests/:id/reject` | `[owner]` | Reject a request → notifies renter via email |

### Bookings — `/api/bookings`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/bookings/product/:productId` | Public | Get all bookings for a specific product (used for availability checks) |

### Users — `/api/user`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/user/:id` | `[auth]` | Get a user's profile by ID |

### Health Check

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Returns API status and version |

---

## 📦 Scripts

Defined in `package.json`:

| Script | Command | Description |
|---|---|---|
| `npm start` | `node server.js` | Start the server in production mode |
| `npm run dev` | `nodemon server.js` | Start the server in development mode with auto-restart on file changes |

---

## ☁️ Deployment

This backend can be deployed to any Node.js-compatible hosting platform:

- **[Render](https://render.com)** — Recommended. Add a new Web Service, set the build command to `npm install`, the start command to `npm start`, and configure environment variables in the dashboard.
- **[Railway](https://railway.app)** — Connect the GitHub repo, Railway auto-detects Node.js and uses `npm start`.
- **[Cyclic](https://cyclic.sh)** / **[Fly.io](https://fly.io)** — Also compatible with no additional config.
- **AWS EC2 / DigitalOcean Droplet** — Clone the repo, install dependencies, and use a process manager like `pm2` to keep the server running.

> There are no platform-specific config files (e.g. `Procfile`, `railway.json`) in this repo — deployment config is handled through environment variables and the `start` script.

---

## 🔗 Connection to the Other Repo

This repository is the **backend half** of the Rentora MERN stack application.

The **frontend** (React) is maintained in a separate repository:

> **Frontend Repository:** [PASTE FRONTEND REPO URL HERE]

The frontend communicates with this backend by sending HTTP requests to the API base URL. In development, configure the frontend's API base URL to point to `http://localhost:5000`. In production, update it to match the deployed backend URL.

---

## 🤝 User Roles

Rentora uses a two-role system enforced at the API level:

| Role | Capabilities |
|---|---|
| `owner` | List products, manage listings, view & respond to incoming rental requests |
| `renter` | Browse products, submit rental requests, view request history |

Roles are assigned at registration and cannot be changed through the API.

---

*Built with ❤️ as part of a DSA/MERN stack university project.*
