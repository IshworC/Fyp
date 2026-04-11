# SAN - Venue Booking System Backend

A comprehensive Node.js/Express backend for a venue booking system with role-based access control.

## Features

- **User Authentication**
  - Register (User/Venue Owner)
  - Login with role selection
  - JWT Token-based authentication

- **Role-Based Access Control**
  - User: Browse and book venues
  - Venue Owner: Register and manage venues
  - Admin: Manage users, venues, and bookings

- **User Management**
  - User registration and authentication
  - Admin can view all users
  - Role-based dashboard access

- **Venue Management**
  - Venue owners can register venues
  - Admin approval workflow
  - Search and filter approved venues
  - Venue owner can manage their venues

- **Booking System**
  - Users can create bookings
  - Venue owners can accept/reject bookings
  - Admin can monitor all bookings
  - Booking status tracking

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set up Environment Variables

Create a `.env` file in the backend folder:

```env
MONGO_URI=mongodb://localhost:27017/saan_db
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

### 3. MongoDB Setup

Make sure MongoDB is running on your machine or use MongoDB Atlas connection string.

```bash
# If using local MongoDB
mongod
```

### 4. Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user/venue owner
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/users` - Get all users (Admin only)

### Venues

- `POST /api/venues` - Create venue (Venue Owner)
- `GET /api/venues/approved` - Get all approved venues
- `GET /api/venues/:id` - Get single venue
- `GET /api/venues/owner/my-venues` - Get my venues (Venue Owner)
- `PUT /api/venues/:id` - Update venue
- `GET /api/venues` - Get all venues (Admin)
- `PUT /api/venues/:id/approve` - Approve venue (Admin)
- `DELETE /api/venues/:id` - Delete venue (Admin)

### Bookings

- `POST /api/bookings` - Create booking (User)
- `GET /api/bookings/my-bookings` - Get my bookings (User)
- `PUT /api/bookings/:id/cancel` - Cancel booking (User)
- `GET /api/bookings/venue/:venueId` - Get venue bookings (Venue Owner)
- `PUT /api/bookings/:id/status` - Update booking status (Venue Owner/Admin)
- `GET /api/bookings` - Get all bookings (Admin)

## Request Examples

### Register

```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

### Login

```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

### Create Venue

```json
POST /api/venues
Headers: Authorization: Bearer {token}
{
  "name": "Grand Banquet Hall",
  "type": "banquet",
  "city": "New York",
  "address": "123 Main St",
  "capacity": 500,
  "pricePerDay": 5000,
  "description": "Beautiful banquet hall",
  "amenities": ["AC", "Parking", "Catering"]
}
```

### Create Booking

```json
POST /api/bookings
Headers: Authorization: Bearer {token}
{
  "venueId": "venue_id",
  "eventDate": "2025-06-15",
  "numberOfGuests": 200,
  "eventType": "Wedding",
  "specialRequests": "Need vegetarian food"
}
```

## Project Structure

```
backend/
├── config/
│   └── config.js          # Configuration
├── controller/
│   ├── authController.js  # Auth logic
│   ├── venueController.js # Venue logic
│   └── bookingController.js # Booking logic
├── middleware/
│   └── auth.js            # JWT authentication
├── models/
│   ├── User.js
│   ├── Venue.js
│   └── Booking.js
├── route/
│   ├── authRoute.js
│   ├── venueRoute.js
│   └── bookingRoute.js
├── .env                   # Environment variables
├── index.js              # Server entry point
└── package.json
```

## Technologies Used

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests
