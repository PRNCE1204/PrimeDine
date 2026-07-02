# PrimeDine 🍽️

A modern, full-stack restaurant management and digital dining system. **PrimeDine** connects customers, kitchen staff, and restaurant owners in real-time to streamline order placement, table reservations, kitchen operations, and business analytics.

## 🚀 Key Features

### 👤 Customer Experience
* **Interactive Menu & Ordering**: Seamlessly browse categorized menus, add items to cart, and check out.
* **Table Reservations**: Book tables for anniversaries, birthdays, baby showers, or custom dining events with options to add decorations/stickers.
* **Order History & Tracking**: Real-time order status tracking from placement to preparation and delivery.
* **Table Pin Widget**: Easy in-app widget to identify and pin your table session.

### 🍳 Cook Dashboard
* **Kitchen Monitor**: Live dashboard displaying active order items, quantities, and table associations.
* **Preparation Status**: Mark order items as preparing or completed to keep customers updated in real-time.

### 💼 Owner Management Portal
* **Digital Twin & Table Session Visualizer**: Monitor live table sessions and reservations in a structured layout.
* **Advanced Business Analytics**: Detailed performance charts for Revenue, Bills Ledger, and overall restaurant health.
* **Inventory Monitor**: Keep track of ingredients and menu items in real-time.
* **Staff Performance & Management**: Assign roles (Cook, Admin, Staff) and monitor staff metrics.
* **Emergency Center & Staff Settings**: Safety and quick configuration controls.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React.js with Vite
* **State Management**: Redux Toolkit (User & Owner slices)
* **Real-time**: Socket.io Client
* **Styling**: Vanilla CSS (Premium, dark-mode, responsive layouts)

### Backend
* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: MongoDB (with Mongoose models)
* **Authentication**: JSON Web Tokens (JWT) & HTTP-only Cookies
* **Real-time Communication**: Socket.io

---

## 📦 Project Structure

```text
PrimeDine/
├── backend/             # Express.js backend API and WebSocket server
│   ├── config/          # Database connection and seeding scripts
│   ├── controllers/     # Controller logic (Auth, Reservations, Orders, Reviews)
│   ├── models/          # Mongoose database schemas
│   ├── routes/          # Express route endpoints
│   ├── utils/           # Helper scripts (tokens, mail senders)
│   └── index.js         # Entry point for backend server
│
├── frontend/            # Vite + React client application
│   ├── src/
│   │   ├── assets/      # Visual assets, food images, stickers
│   │   ├── components/  # Reusable UI widgets and Dashboards (Cook, Owner, User)
│   │   ├── context/     # React Context providers (Socket connection)
│   │   ├── hooks/       # Custom React hooks (location, fetching, actions)
│   │   ├── pages/       # Page views (Home, Reservations, Cart, Checkout, Auth)
│   │   └── redux/       # Store configurations and slices
```

---

## ⚙️ Setup and Installation

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v16+ recommended)
* [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas cluster)

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder and add the following configurations:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   # Add mail/SMTP configurations if needed
   ```
4. Run the seed scripts if you need to initialize database records:
   ```bash
   node config/adminSeeder.js
   ```
5. Start the backend server:
   ```bash
   npm start
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
