# LuxeFinds API Documentation

## Base URL
```
http://localhost:9002/api
```

For production, replace with your deployment URL.

## Authentication

All endpoints requiring authentication use JWT tokens stored in httpOnly cookies.

### Login
- **Endpoint:** `POST /auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "isAdmin": false
    }
  }
  ```

### Register
- **Endpoint:** `POST /auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name"
  }
  ```
- **Response:** Same as login

### Get Current User
- **Endpoint:** `GET /auth/me`
- **Headers:** Requires authentication cookie
- **Response:**
  ```json
  {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "isAdmin": false,
      "createdAt": "2026-02-10T00:00:00Z",
      "updatedAt": "2026-02-10T00:00:00Z"
    }
  }
  ```

### Refresh Token
- **Endpoint:** `POST /auth/refresh`
- **Headers:** Requires authentication cookie
- **Response:** Same as login

### Logout
- **Endpoint:** `POST /auth/logout`
- **Headers:** Requires authentication cookie
- **Response:**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## Products

### List Products
- **Endpoint:** `GET /products`
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20, max: 100)
  - `categoryId` (string, optional)
  - `search` (string, optional - searches name and description)
  - `sortBy` (string: 'name', 'price', 'newest', default: 'newest')
  - `sortOrder` (string: 'asc', 'desc', default: 'asc')
  - `inStock` (boolean, default: true)

- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "product-id",
        "name": "Product Name",
        "price": 99.99,
        "description": "Product description",
        "image": "https://example.com/image.jpg",
        "stock": 50,
        "featured": false,
        "categoryId": "category-id",
        "category": {
          "id": "category-id",
          "name": "Category Name",
          "slug": "category-slug"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
  ```

### Get Product Detail
- **Endpoint:** `GET /products/:id`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "product-id",
      "name": "Product Name",
      "price": 99.99,
      "description": "Product description",
      "materials": "Materials info",
      "care": "Care instructions",
      "image": "https://example.com/image.jpg",
      "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      "modelImages": [],
      "video": null,
      "stock": 50,
      "featured": false,
      "categoryId": "category-id",
      "category": {
        "id": "category-id",
        "name": "Category Name",
        "slug": "category-slug"
      },
      "createdAt": "2026-02-10T00:00:00Z",
      "updatedAt": "2026-02-10T00:00:00Z"
    }
  }
  ```

---

## Categories

### List Categories
- **Endpoint:** `GET /categories`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "category-id",
        "name": "Bags",
        "slug": "bags",
        "description": "Category description",
        "displayOrder": 0
      }
    ]
  }
  ```

---

## Shopping Cart

### Get Cart
- **Endpoint:** `GET /cart`
- **Headers:** Requires authentication cookie
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "cart-id",
      "userId": "user-id",
      "items": [
        {
          "id": "cart-item-id",
          "productId": "product-id",
          "quantity": 2,
          "product": {
            "id": "product-id",
            "name": "Product Name",
            "price": 99.99,
            "image": "https://example.com/image.jpg",
            "stock": 50
          }
        }
      ],
      "createdAt": "2026-02-10T00:00:00Z",
      "updatedAt": "2026-02-10T00:00:00Z"
    }
  }
  ```

### Add Item to Cart
- **Endpoint:** `POST /cart/items`
- **Headers:** Requires authentication cookie
- **Body:**
  ```json
  {
    "productId": "product-id",
    "quantity": 1
  }
  ```
- **Response:** Single cart item object

### Update Cart Item
- **Endpoint:** `PUT /cart/items/:id`
- **Headers:** Requires authentication cookie
- **Body:**
  ```json
  {
    "quantity": 3
  }
  ```
- **Response:** Updated cart item object

### Remove Cart Item
- **Endpoint:** `DELETE /cart/items/:id`
- **Headers:** Requires authentication cookie
- **Response:**
  ```json
  {
    "success": true,
    "message": "Item removed from cart"
  }
  ```

---

## Orders

### List User Orders
- **Endpoint:** `GET /orders`
- **Headers:** Requires authentication cookie
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20, max: 100)

- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "order-id",
        "status": "pending",
        "total": 199.99,
        "items": [
          {
            "id": "order-item-id",
            "productId": "product-id",
            "quantity": 2,
            "price": 99.99,
            "product": {
              "id": "product-id",
              "name": "Product Name",
              "image": "https://example.com/image.jpg"
            }
          }
        ],
        "createdAt": "2026-02-10T00:00:00Z",
        "updatedAt": "2026-02-10T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
  ```

### Create Order
- **Endpoint:** `POST /orders`
- **Headers:** Requires authentication cookie
- **Body:**
  ```json
  {
    "shippingAddress": "123 Main St, City, State 12345",
    "paymentMethod": "credit_card"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "order-id",
      "status": "pending",
      "total": 199.99,
      "shippingAddress": "123 Main St, City, State 12345",
      "paymentMethod": "credit_card",
      "userId": "user-id",
      "items": [
        {
          "id": "order-item-id",
          "productId": "product-id",
          "quantity": 2,
          "price": 99.99,
          "product": {
            "id": "product-id",
            "name": "Product Name",
            "image": "https://example.com/image.jpg"
          }
        }
      ],
      "createdAt": "2026-02-10T00:00:00Z",
      "updatedAt": "2026-02-10T00:00:00Z"
    }
  }
  ```

### Get Order Detail
- **Endpoint:** `GET /orders/:id`
- **Headers:** Requires authentication cookie
- **Response:** Single order object

---

## Admin Endpoints

All admin endpoints require authentication and `isAdmin: true` flag.

### List Products (Admin)
- **Endpoint:** `GET /admin/products`
- **Headers:** Requires admin authentication cookie
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20, max: 100)
  - `search` (string, optional)
  - `categoryId` (string, optional)

### Create Product (Admin)
- **Endpoint:** `POST /admin/products`
- **Headers:** Requires admin authentication cookie
- **Body:**
  ```json
  {
    "name": "New Product",
    "description": "Product description",
    "categoryId": "category-id",
    "price": 99.99,
    "stock": 100,
    "image": "https://example.com/image.jpg",
    "images": [],
    "materials": "Materials info",
    "care": "Care instructions",
    "featured": false
  }
  ```

### Get Product (Admin)
- **Endpoint:** `GET /admin/products/:id`
- **Headers:** Requires admin authentication cookie

### Update Product (Admin)
- **Endpoint:** `PUT /admin/products/:id`
- **Headers:** Requires admin authentication cookie
- **Body:** Any fields to update (all optional)

### Delete Product (Admin)
- **Endpoint:** `DELETE /admin/products/:id`
- **Headers:** Requires admin authentication cookie
- **Response:**
  ```json
  {
    "success": true,
    "message": "Product deleted successfully"
  }
  ```

### List Orders (Admin)
- **Endpoint:** `GET /admin/orders`
- **Headers:** Requires admin authentication cookie
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20, max: 100)
  - `status` (string: 'pending', 'processing', 'shipped', 'delivered', 'cancelled', optional)
  - `sortBy` (string: 'date', 'total', default: 'date')
  - `sortOrder` (string: 'asc', 'desc', default: 'desc')

### Get Order (Admin)
- **Endpoint:** `GET /admin/orders/:id`
- **Headers:** Requires admin authentication cookie

### Update Order (Admin)
- **Endpoint:** `PUT /admin/orders/:id`
- **Headers:** Requires admin authentication cookie
- **Body:**
  ```json
  {
    "status": "shipped"
  }
  ```

### List Categories (Admin)
- **Endpoint:** `GET /admin/categories`
- **Headers:** Requires admin authentication cookie

### Create Category (Admin)
- **Endpoint:** `POST /admin/categories`
- **Headers:** Requires admin authentication cookie
- **Body:**
  ```json
  {
    "name": "New Category",
    "slug": "new-category",
    "description": "Category description",
    "displayOrder": 0
  }
  ```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `400` - Bad request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (e.g., duplicate email, duplicate slug)
- `429` - Too many requests (rate limited)
- `500` - Server error

---

## Rate Limiting

- Login: 10 attempts per 15 minutes per IP
- Registration: 5 attempts per hour per IP

---

## Environment Variables

For Flutter apps, set the following:

```
NEXT_PUBLIC_API_URL=http://localhost:9002/api
```

Or for production:
```
NEXT_PUBLIC_API_URL=https://api.luxefinds.com/api
```

---

**Last Updated:** February 10, 2026
