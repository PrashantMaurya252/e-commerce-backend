# E-Commerce Backend

This is the backend for an e-commerce application built using **Node.js**, **Express.js**, and **MongoDB**. It provides APIs for user authentication, product management, cart functionality, and payment integration with **Stripe**. The backend also includes features like image uploads using **Multer** and **Cloudinary**, product filtering, pagination, and search.

## Features

- **User Authentication**: Sign up, log in, and secure JWT-based authentication.
- **Product Management**: Add, update, and delete products with categories and filtering options.
- **Cart Management**: Add, update, and remove items from the cart.
- **Favourites**: Mark and unmark products as favourites.
- **Payment Integration**: Stripe integration for secure payments.
- **Image Upload**: Upload product images using Multer and Cloudinary.
- **Product Search**: Search products by name and filter by price, category, etc.
- **Pagination**: API pagination for product lists.
- **Middleware**: Custom middleware for authentication and authorization.

## Tech Stack

- **Node.js**: JavaScript runtime for server-side logic.
- **Express.js**: Framework for building RESTful APIs.
- **MongoDB**: NoSQL database for data storage.
- **Multer**: Middleware for handling multipart/form-data for image uploads.
- **Cloudinary**: Cloud service for image hosting and management.
- **JWT**: JSON Web Token for authentication.
- **Stripe**: Payment gateway integration for handling transactions.

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user.
- `POST /api/auth/login` - Log in a user.
- `GET /api/auth/profile` - Get the profile of the logged-in user.

### Products

- `POST /api/products` - Add a new product. (Admin only)
- `GET /api/products` - Get a list of products with pagination, search, and filtering.
- `GET /api/products/:id` - Get a single product by ID.
- `PUT /api/products/:id` - Update a product. (Admin only)
- `DELETE /api/products/:id` - Delete a product. (Admin only)

### Favourites

- `POST /api/products/:id/favourite` - Mark a product as favourite.
- `DELETE /api/products/:id/unfavourite` - Remove a product from favourites.
- `GET /api/products/favourites` - Get a list of favourite products.

### Cart

- `POST /api/cart` - Add a product to the cart.
- `PUT /api/cart/:id` - Update the quantity of a product in the cart.
- `DELETE /api/cart/:id` - Remove a product from the cart.
- `GET /api/cart` - Get the cart items of the logged-in user.

### Stripe Payment

- `POST /api/checkout` - Create a payment session with Stripe.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ecommerce-backend.git
   cd ecommerce-backend
