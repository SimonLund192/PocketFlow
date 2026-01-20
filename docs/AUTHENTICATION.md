# Authentication System

## Overview
PocketFlow AI now has a complete authentication system with BCrypt password hashing, JWT tokens, and protected routes.

## Backend Implementation

### Dependencies Added
- `passlib[bcrypt]==1.7.4` - Password hashing with BCrypt
- `python-jose[cryptography]==3.3.0` - JWT token creation and verification

### Files Created

#### `/backend/app/security.py`
Core security utilities:
- `get_password_hash(password)` - Hash passwords with BCrypt
- `verify_password(plain, hashed)` - Verify password against hash
- `create_access_token(data, expires_delta)` - Create JWT tokens
- `verify_token(token)` - Verify and decode JWT tokens
- Token expiration: 7 days by default

#### `/backend/app/routes/auth.py`
Authentication endpoints:
- `POST /auth/register` - Create new user account
  - Validates email uniqueness
  - Hashes password with BCrypt
  - Returns JWT token and user info
- `POST /auth/login` - Authenticate existing user
  - Verifies credentials
  - Returns JWT token and user info
- `POST /auth/logout` - Logout endpoint (client-side token removal)

### Database Schema
Users collection:
```json
{
  "_id": ObjectId,
  "email": "user@example.com",
  "full_name": "John Doe",
  "hashed_password": "$2b$12$...",
  "created_at": ISODate,
  "is_active": true
}
```

## Frontend Implementation

### Files Created

#### `/frontend/contexts/AuthContext.tsx`
Global authentication state management:
- `AuthProvider` - Wraps app with auth context
- `useAuth()` hook - Access auth state and methods
- Methods: `login()`, `register()`, `logout()`
- Auto-redirects unauthenticated users to login
- Persists auth state in localStorage

#### `/frontend/app/login/page.tsx`
Login and registration page:
- Toggle between login/signup forms
- Email and password validation
- Password visibility toggle
- Error handling
- Responsive design with gradient background

#### `/frontend/components/ProfileDropdown.tsx`
User profile menu:
- Displays user initials in circular avatar
- Dropdown menu with:
  - Account Settings (navigates to /account)
  - Log Out (clears auth and redirects to login)
- Click-outside-to-close functionality

#### `/frontend/components/ConditionalSidebar.tsx`
Sidebar visibility controller:
- Shows sidebar on all pages except /login
- Keeps login page clean and focused

### Updated Files

#### `/frontend/components/Header.tsx`
- Integrated ProfileDropdown component
- Shows user initials dynamically
- Displays full name in dropdown

#### `/frontend/app/layout.tsx`
- Wrapped with AuthProvider
- Uses ConditionalSidebar instead of direct Sidebar

## Security Features

1. **Password Hashing**: BCrypt with automatic salt generation
2. **JWT Tokens**: Signed with HS256 algorithm
3. **Token Expiration**: 7-day expiry for access tokens
4. **Protected Routes**: Auto-redirect to login if not authenticated
5. **Secure Storage**: Tokens stored in localStorage (client-side)

## Usage Flow

### Registration
1. User fills signup form with email, password, full name
2. Frontend validates input (matching passwords, required fields)
3. POST to `/auth/register`
4. Backend hashes password, creates user in MongoDB
5. Backend returns JWT token and user info
6. Frontend stores token, redirects to dashboard

### Login
1. User enters email and password
2. POST to `/auth/login`
3. Backend verifies credentials against hashed password
4. Backend returns JWT token and user info
5. Frontend stores token, redirects to dashboard

### Logout
1. User clicks "Log Out" in profile dropdown
2. Frontend clears localStorage (token + user data)
3. AuthContext updates state
4. Auto-redirect to /login page

### Protected Access
1. On page load, AuthContext checks localStorage for token
2. If no token found, redirect to /login
3. If token exists, parse user data and allow access
4. Header displays user initials and name

## Environment Variables
**TODO**: Move JWT secret to environment variable
```bash
# .env
SECRET_KEY=your-secret-key-here-change-in-production
```

## Future Enhancements

1. **Token Refresh**: Implement refresh tokens for better security
2. **Email Verification**: Send verification emails on registration
3. **Password Reset**: Forgot password flow with email reset links
4. **Social Auth**: OAuth with Google, GitHub, etc.
5. **Session Management**: View and revoke active sessions
6. **2FA**: Two-factor authentication support
7. **Token Middleware**: Add authentication middleware to protect API endpoints
8. **Role-Based Access**: Admin vs regular user permissions

## Testing

To test the authentication system:

1. Start backend: `docker compose up`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to http://localhost:3000
4. You'll be redirected to /login
5. Create an account with email, password, name
6. You'll be logged in and redirected to dashboard
7. Click profile icon to see dropdown menu
8. Click "Log Out" to test logout flow

## API Endpoints

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}

Response 200:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

Response 200:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### Logout
```http
POST /auth/logout

Response 200:
{
  "message": "Successfully logged out"
}
```
