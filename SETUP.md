# Setup Guide for AssessMyCoop API

## Quick Start

### 1. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE assessmycoop_db;
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=assessmycoop_db

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## Testing the API

### Using REST Client (VS Code)

1. Install the "REST Client" extension in VS Code
2. Open `rest/users.rest` or `rest/cooperative.rest`
3. Click "Send Request" above any endpoint

### Testing Flow

1. **Register an admin user** (rest/users.rest):
   - Use the "Register an admin user" request
   - Copy the response

2. **Login** (rest/users.rest):
   - Use the "Login admin" request
   - Copy the `token` from the response

3. **Update the token variable**:
   - In both `.rest` files, replace `YOUR_TOKEN_HERE` with your actual token
   ```
   @token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Test protected endpoints**:
   - Now you can test all authenticated endpoints
   - Create cooperatives
   - Update scores
   - Manage users

### Sample Test Sequence

```
1. POST /api/users/register (admin user)
2. POST /api/users/login (get token)
3. POST /api/cooperatives (create cooperative)
4. GET /api/cooperatives (view all)
5. PATCH /api/cooperatives/1/score (update score)
6. GET /api/cooperatives/search?minScore=50&maxScore=90
```

## Project Structure

```
assessmycoop-api/
├── src/
│   ├── config/
│   │   └── db.js                    # Database configuration
│   ├── middlwares/
│   │   ├── auth.middleware.js       # JWT authentication
│   │   └── error.middleware.js      # Error handling
│   ├── module/
│   │   ├── users/
│   │   │   ├── user.model.js        # User model
│   │   │   ├── user.controller.js   # User business logic
│   │   │   └── user.routes.js       # User endpoints
│   │   └── cooperative/
│   │       ├── cooperative.model.js
│   │       ├── cooperative.controller.js
│   │       └── cooperative.routes.js
│   └── app.js                       # Main application
├── rest/
│   ├── users.rest                   # User API tests
│   └── cooperative.rest             # Cooperative API tests
├── .env                             # Environment variables (create this)
├── .env.example                     # Environment template
├── package.json
└── README.md
```

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Check database credentials in `.env`
- Verify database exists: `SHOW DATABASES;`

### Authentication Error
- Make sure you've logged in and copied the token
- Token expires after 24 hours - login again if needed
- Ensure token is in format: `Bearer YOUR_TOKEN`

### Port Already in Use
- Change PORT in `.env` file
- Or kill the process using port 3000

## API Endpoints Summary

### Public Endpoints
- `GET /` - Health check
- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login
- `GET /api/cooperatives` - List cooperatives
- `GET /api/cooperatives/:id` - Get cooperative
- `GET /api/cooperatives/search` - Search by score

### Protected Endpoints (Require Authentication)
- `POST /api/cooperatives` - Create cooperative
- `PUT /api/cooperatives/:id` - Update cooperative
- `PATCH /api/cooperatives/:id/score` - Update score
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user

### Admin Only Endpoints
- `GET /api/users` - List all users
- `DELETE /api/users/:id` - Delete user
- `DELETE /api/cooperatives/:id` - Delete cooperative

