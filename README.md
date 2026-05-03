# Splitwise MVP — Expense Sharing REST API

A backend REST API that replicates the core functionality of Splitwise: users can log expenses, split them among participants, and check who owes whom at any point.

Built on top of the [express-sequelize-boilerplate](https://github.com/gadfaria/express-sequelize-boilerplate), extended with authentication, expense management, and balance calculation.

**Stack:** Node.js · Express · Sequelize ORM · PostgreSQL (Neon) · JWT Auth · Sucrase (ES Modules)

---

## Project Structure

```
splitwise-mvp/
├── src/
│   ├── index.js                        # Entry point — boots services in order
│   ├── config/
│   │   └── database.js                 # Sequelize connection config
│   ├── database/
│   │   ├── reset.js                    # Drop & recreate all tables (dev utility)
│   │   └── seeders/
│   │       └── 20240601000000-demo-data.js
│   ├── models/
│   │   ├── User.js                     # name, email, password (virtual), password_hash, default_currency
│   │   ├── Address.js                  # city, state, neighborhood, country
│   │   ├── UserAddress.js              # join table: users ↔ addresses
│   │   ├── Expense.js                  # name, amount, currency, created_by, date
│   │   └── ExpenseParticipant.js       # expense_id, user_id, share_amount
│   ├── controllers/
│   │   ├── login.controller.js         # register, login, logout
│   │   ├── user.controller.js          # CRUD + addAddress
│   │   ├── address.controller.js       # create address
│   │   ├── expense.controller.js       # CRUD expenses with split logic
│   │   └── balance.controller.js       # net balance calculation per user
│   ├── routes/
│   │   ├── login.routes.js
│   │   ├── user.routes.js
│   │   ├── address.routes.js
│   │   ├── expense.routes.js
│   │   └── balance.routes.js
│   ├── services/
│   │   ├── express.service.js          # Express setup + auto route loader
│   │   ├── sequelize.service.js        # DB connection + auto model loader
│   │   ├── jwt.service.js              # JWT sign / verify / blacklist
│   │   └── aws.service.js              # AWS SDK init (boilerplate, not used)
│   ├── middlewares/
│   │   ├── auth.middleware.js          # JWT verification on protected routes
│   │   └── errorHandler.middleware.js  # Global error handler
│   └── utils/
│       └── ApiError.js                 # Typed error classes (400/401/404/422/500)
├── postman.json                        # Importable Postman collection (all endpoints)
├── .env.example                        # Environment variable template
├── nodemon.json                        # Sucrase + nodemon config for ES modules
└── package.json
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/taruntailor7/MVP-of-Splitwise-.git
cd MVP-of-Splitwise-
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your Neon PostgreSQL credentials in `.env`:

```env
DB_DIALECT=postgres
DB_HOST=ep-xxxx.us-east-2.aws.neon.tech
DB_USER=your_neon_user
DB_PASS=your_neon_password
DB_NAME=your_db_name
SERVER_JWT_SECRET=your_secret_key
```

> Get connection details from [console.neon.tech](https://console.neon.tech) → your project → **Connection Details** → switch to **"Connection parameters"** view.

### 3. Create database tables (run once)

```bash
npm run reset-db
```

This drops any existing tables and recreates them fresh from the model definitions.

### 4. Start the development server

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

> For daily development, just use `npm run dev`. Only re-run `reset-db` if you change model fields.

---

## Authentication

Protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Get the token from the **Login** endpoint. It expires in 24 hours (`SERVER_JWT_TIMEOUT=86400`).

---

## API Reference

### Auth

| Method | Endpoint    | Auth | Description             |
|--------|-------------|------|-------------------------|
| POST   | /register   | No   | Create a new account    |
| POST   | /login      | No   | Login, returns JWT token|
| GET    | /logout     | Yes  | Blacklist current token |

**POST /register**
```json
{
  "name": "Tarun Tailor",
  "email": "tarun@example.com",
  "password": "password123",
  "default_currency": "INR"
}
```

**POST /login**
```json
{
  "email": "tarun@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "user": { "id": 1, "name": "Tarun Tailor", "email": "tarun@example.com", "default_currency": "INR" },
  "token": "eyJhbGci..."
}
```

---

### Users

| Method | Endpoint          | Auth | Description                    |
|--------|-------------------|------|--------------------------------|
| POST   | /users            | No   | Create user (same as register) |
| GET    | /users            | No   | List all users                 |
| GET    | /users/:id        | Yes  | Get user by ID                 |
| PUT    | /users/:id        | Yes  | Update name / email / currency |
| DELETE | /users/:id        | Yes  | Delete user                    |
| POST   | /users/address    | Yes  | Link an address to the user    |

**POST /users** — body same as `/register`

**PUT /users/:id** — update profile:
```json
{
  "name": "Tarun Updated",
  "default_currency": "USD"
}
```

**PUT /users/:id** — change password:
```json
{
  "oldPassword": "password123",
  "password": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

**POST /users/address**
```json
{
  "address": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "neighborhood": "Bandra",
    "country": "India"
  }
}
```

---

### Expenses

| Method | Endpoint        | Auth | Description                  |
|--------|-----------------|------|------------------------------|
| POST   | /expenses       | Yes  | Create expense and split     |
| GET    | /expenses/:id   | Yes  | Get expense with participants|
| PUT    | /expenses/:id   | Yes  | Update expense details       |
| DELETE | /expenses/:id   | Yes  | Delete expense               |

**POST /expenses** — equal split (omit `share_amount`):
```json
{
  "name": "Dinner at restaurant",
  "amount": 900,
  "currency": "INR",
  "created_by": 1,
  "date": "2025-05-01",
  "participants": [
    { "user_id": 1 },
    { "user_id": 2 },
    { "user_id": 3 }
  ]
}
```
Each participant automatically gets `share_amount = 900 / 3 = 300`.

**POST /expenses** — custom split (provide `share_amount`):
```json
{
  "name": "Hotel booking",
  "amount": 3000,
  "currency": "INR",
  "created_by": 1,
  "date": "2025-05-02",
  "participants": [
    { "user_id": 1, "share_amount": 1500 },
    { "user_id": 2, "share_amount": 1000 },
    { "user_id": 3, "share_amount": 500 }
  ]
}
```

**PUT /expenses/:id**
```json
{
  "name": "Dinner (updated)",
  "amount": 1200,
  "currency": "INR"
}
```

---

### Balances

| Method | Endpoint   | Auth | Description                    |
|--------|------------|------|--------------------------------|
| GET    | /balances  | Yes  | Net balance for every user     |

**Sample response:**
```json
[
  { "userId": 1, "email": "tarun@example.com",  "balance": 600  },
  { "userId": 2, "email": "alice@example.com",  "balance": -300 },
  { "userId": 3, "email": "bob@example.com",    "balance": -300 }
]
```

- `balance > 0` → others owe this user
- `balance < 0` → this user owes others
- `balance = 0` → settled up

---

## Balance Calculation Logic

For every expense in the database:

1. **Credit the payer** the full expense amount:  
   `balance[created_by] += expense.amount`

2. **Debit each participant** their individual share:  
   `balance[participant.user_id] -= participant.share_amount`

The sum across all expenses gives each user's net balance.

**Example:**

| Expense | Amount | Payer | Participants | Share each |
|---------|--------|-------|--------------|------------|
| Dinner  | ₹900   | Tarun | Tarun, Alice, Bob | ₹300 |

After calculation:
- Tarun: `+900 - 300 = +600` (Alice and Bob owe him ₹300 each)
- Alice: `0 - 300 = -300` (owes Tarun ₹300)
- Bob:   `0 - 300 = -300` (owes Tarun ₹300)

---

## Testing with Postman

1. Open Postman → click **Import** → select `postman.json`
2. The `baseUrl` variable is pre-set to `http://localhost:3000`
3. The **Login** request automatically saves the JWT token to `{{token}}` — all other requests use it

**Recommended test flow:**
1. Register 2–3 users (`POST /register`)
2. Login as one of them (`POST /login`) — token is saved automatically
3. Create an expense with those user IDs (`POST /expenses`)
4. Check balances (`GET /balances`)

---

## Design Decisions

- **Boilerplate-first:** The project uses the [express-sequelize-boilerplate](https://github.com/gadfaria/express-sequelize-boilerplate) as its foundation. Auto-loading of routes and models, ES module support via Sucrase, and the JWT/error infrastructure are all inherited from it — no reinvention.

- **VIRTUAL password field:** Following the boilerplate's pattern, `password` is a `Sequelize.VIRTUAL` field (never stored in DB). The `beforeSave` hook hashes it into `password_hash` using bcrypt. This cleanly separates input from storage.

- **Equal vs custom split:** If participants are sent without `share_amount`, the server divides the total equally. If `share_amount` is provided for all participants, those values are used directly — giving flexibility for unequal splits.

- **Balance as a read-only calculation:** Balances are not stored — they are computed on every `GET /balances` request by aggregating all expense and participant rows. This keeps the data model simple and always consistent.

- **`sync({ force: false })` on startup:** The app only creates tables that don't yet exist on each boot — it never alters or drops data. A separate `npm run reset-db` script handles schema resets during development.

---

## Scripts

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `npm run dev`     | Start with nodemon (auto-reload on file changes) |
| `npm start`       | Start in production mode                         |
| `npm run reset-db`| Drop all tables and recreate from models (dev)   |
| `npm run seed`    | Insert sample users and expenses via Sequelize CLI|
