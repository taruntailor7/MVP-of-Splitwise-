# Splitwise MVP

A simple expense-sharing REST API built on top of the [express-sequelize-boilerplate](https://github.com/gadfaria/express-sequelize-boilerplate).

**Stack:** Node.js · Express · Sequelize · PostgreSQL (Neon) · Sucrase (ES modules)

---

## Project Structure

```
splitwise-mvp/
├── src/
│   ├── index.js                          # Entry point — initializes services
│   ├── config/
│   │   └── database.js                   # Sequelize config (used by app + CLI)
│   ├── database/
│   │   ├── migrations/                   # Sequelize CLI migrations
│   │   └── seeders/
│   │       └── 20240601000000-demo-data.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Expense.js
│   │   └── ExpenseParticipant.js
│   ├── services/
│   │   ├── express.service.js            # Boilerplate: Express setup + route auto-loader
│   │   ├── sequelize.service.js          # Boilerplate: DB setup + model auto-loader
│   │   ├── user.service.js               # User CRUD logic
│   │   ├── expense.service.js            # Expense CRUD + equal-split logic
│   │   └── balance.service.js            # Core balance calculation
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── expense.controller.js
│   │   └── balance.controller.js
│   ├── routes/
│   │   ├── user.route.js
│   │   ├── expense.route.js
│   │   └── balance.route.js
│   ├── middlewares/
│   │   └── errorHandler.middleware.js
│   └── utils/
│       └── ApiError.js
├── .env.example
├── .sequelizerc
├── nodemon.json
├── postman_collection.json
└── README.md
```

---

## Setup & Running

### 1. Clone & install

```bash
git clone <your-repo-url>
cd splitwise-mvp
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in your **Neon** connection details in `.env`:

```
DB_DIALECT=postgres
DB_HOST=ep-xxxx.us-east-2.aws.neon.tech
DB_USER=your_neon_user
DB_PASS=your_neon_password
DB_NAME=your_db_name
```

> Get these from: [Neon dashboard](https://console.neon.tech) → your project → **Connection Details** → switch view to **Connection parameters**

### 3. Run migrations (creates tables)

```bash
npx sequelize-cli db:migrate
```

> Note: We use `sequelize.sync()` in dev via the service. For production use migrations.

### 4. Seed sample data (optional)

```bash
npm run seed
```

This creates 3 users (Alice, Bob, Carol) and 3 sample expenses.

### 5. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`.

---

## API Reference

### Users

| Method | Endpoint      | Description     |
|--------|---------------|-----------------|
| POST   | /users        | Create a user   |
| GET    | /users/:id    | Get user by ID  |
| PUT    | /users/:id    | Update user     |
| DELETE | /users/:id    | Delete user     |

**Create user body:**
```json
{
  "email": "alice@example.com",
  "password": "secret123",
  "default_currency": "USD"
}
```

---

### Expenses

| Method | Endpoint        | Description       |
|--------|-----------------|-------------------|
| POST   | /expenses       | Create an expense |
| GET    | /expenses/:id   | Get expense by ID |
| PUT    | /expenses/:id   | Update expense    |
| DELETE | /expenses/:id   | Delete expense    |

**Create expense body:**
```json
{
  "name": "Dinner",
  "amount": 90,
  "currency": "USD",
  "created_by": 1,
  "date": "2024-06-01",
  "participant_ids": [1, 2, 3]
}
```

- `created_by` — the user who paid
- `participant_ids` — users splitting the cost (equal split)
- Include the payer in `participant_ids` if they share the cost too

---

### Balances

| Method | Endpoint   | Description              |
|--------|------------|--------------------------|
| GET    | /balances  | Get net balance per user |

**Sample response:**
```json
[
  { "userId": 1, "email": "alice@example.com", "balance": 45 },
  { "userId": 2, "email": "bob@example.com",   "balance": -15 },
  { "userId": 3, "email": "carol@example.com", "balance": -30 }
]
```

- `balance > 0` → others owe this user
- `balance < 0` → this user owes others
- `balance = 0` → settled up

---

## Balance Calculation Logic

Lives in `src/services/balance.service.js`.

For every expense:
1. **Credit** the payer: `balance[payer] += expense.amount`
2. **Debit** each participant: `balance[participant] -= share_amount`

Sum across all expenses → net balance per user.

---

## Testing with Postman

1. Open Postman → **Import** → select `postman.json`
2. Set `baseUrl` variable to `http://localhost:3000`
3. Run in order: create users → create expenses → check balances

---

## Boilerplate Features Used

| Feature | File |
|---|---|
| ES modules via sucrase | `nodemon.json` |
| Auto route loading | `src/services/express.service.js` |
| Auto model loading + associations | `src/services/sequelize.service.js` |
| Typed error classes | `src/utils/ApiError.js` |
| Global error middleware | `src/middlewares/errorHandler.middleware.js` |
| Sequelize CLI config | `.sequelizerc` + `src/config/database.js` |
