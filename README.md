# AssessMyCoop API

A REST API for cooperative assessment and management built with Node.js, Express, and MySQL.

## Features

- 🔐 User authentication with JWT
- 👥 User management (registration, login, CRUD operations)
- 🏢 Cooperative management (CRUD operations)
- 📊 Cooperative scoring/assessment system
- 🔒 Role-based access control (admin/user)
- 🛡️ Secure password hashing with bcrypt

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd assessmycoop-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=assessmycoop_db

JWT_SECRET=your_super_secret_jwt_key
```

5. Create the MySQL database:
```sql
CREATE DATABASE assessmycoop_db;
```

## Running the Application

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /` - API health check

### User Routes
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Cooperative Routes
- `GET /api/cooperatives` - Get all cooperatives
- `GET /api/cooperatives/:id` - Get cooperative by ID
- `GET /api/cooperatives/search` - Search cooperatives by score range
- `POST /api/cooperatives` - Create cooperative (authenticated)
- `PUT /api/cooperatives/:id` - Update cooperative (authenticated)
- `PATCH /api/cooperatives/:id/score` - Update cooperative score (authenticated)
- `DELETE /api/cooperatives/:id` - Delete cooperative (admin only)

## Testing with REST Client

REST client files are provided in the `rest/` directory:
- `rest/users.rest` - User endpoint tests
- `rest/cooperative.rest` - Cooperative endpoint tests

To use these files:
1. Install the REST Client extension in VS Code
2. Open the `.rest` files
3. Update the `@token` variable with your JWT token after login
4. Click "Send Request" above each endpoint

## Project Structure

```
assessmycoop-api/
├── src/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── middlwares/
│   │   ├── auth.middleware.js # Authentication middleware
│   │   └── error.middleware.js # Error handling
│   ├── module/
│   │   ├── users/
│   │   │   ├── user.model.js
│   │   │   ├── user.controller.js
│   │   │   └── user.routes.js
│   │   └── cooperative/
│   │       ├── cooperative.model.js
│   │       ├── cooperative.controller.js
│   │       └── cooperative.routes.js
│   └── app.js                 # Main application file
├── rest/                      # REST client test files
├── .env.example              # Environment variables template
├── package.json
└── README.md
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected routes:

1. Register a user or login
2. Copy the token from the response
3. Include it in the Authorization header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Roles

- **user**: Can create and update cooperatives, view users
- **admin**: Full access including user deletion and cooperative deletion

## License

ISC

