# Leo Store - Project Restructure Documentation

## Overview
This document describes the complete restructure of the Leo Store project to integrate Firebase Authentication and Firestore database functionality.

## Major Changes

### 1. Firebase Integration
- **Firebase Configuration** (`js/firebase.js`): Initializes Firebase services (Auth, Firestore, Storage)
- **Authentication Service** (`js/auth.js`): Handles user signup, login, logout, and password reset
- **Cart Service** (`js/cartService.js`): Manages cart persistence in Firestore
- **Auth State Manager** (`js/authState.js`): Updates UI based on authentication state

### 2. Authentication Pages Updated

#### Login.html
- Integrated Firebase Authentication
- Real-time error handling and user feedback
- Redirects to home page on successful login
- Form validation

#### Signup.html
- Firebase user registration
- User profile creation in Firestore
- Display name setup
- Error handling for duplicate emails, weak passwords, etc.

#### pass.html (Password Reset)
- Firebase password reset email functionality
- User-friendly error messages
- Success confirmation

### 3. Cart Functionality Enhanced

#### Leo.js Updates
- **Cart Persistence**: Cart items are saved to Firestore for logged-in users
- **Cart Loading**: Automatically loads saved cart when user logs in
- **Order Management**: Orders are saved to Firestore with order history
- **User-Specific Carts**: Each user has their own cart in the database

### 4. Payment Page Improvements

#### pay.html
- Integrated with Firestore for order management
- Order summary display
- Payment processing (order status update)
- User authentication check
- Better UI/UX

### 5. Contact Page Enhancement

#### contact.html
- Contact messages saved to Firestore
- User information pre-filled for logged-in users
- Success/error feedback

## File Structure

```
leo_store-main/
├── js/
│   ├── firebase.js          # Firebase initialization
│   ├── auth.js              # Authentication service
│   ├── cartService.js       # Cart & order management
│   ├── authState.js         # Auth state UI management
│   └── Leo.js               # Updated cart functionality
│
├── HTML Pages (All updated with Firebase integration):
│   ├── home.html
│   ├── Leo.html             # Shirts page
│   ├── shoes.html           # Shoes page
│   ├── accessories.html     # Accessories page
│   ├── Login.html           # ✅ Firebase Auth integrated
│   ├── Signup.html          # ✅ Firebase Auth integrated
│   ├── pass.html            # ✅ Password reset integrated
│   ├── pay.html             # ✅ Order management integrated
│   └── contact.html         # ✅ Contact form integrated
│
└── Css/                     # Styling files (unchanged)
```

## Firebase Collections Structure

### Users Collection (`users/{userId}`)
```javascript
{
  email: string,
  firstName: string,
  lastName: string,
  displayName: string,
  createdAt: timestamp,
  cart: array
}
```

### Carts Collection (`carts/{userId}`)
```javascript
{
  items: [
    {
      title: string,
      price: string,
      imgSrc: string
    }
  ],
  updatedAt: timestamp
}
```

### Orders Collection (`orders/{orderId}`)
```javascript
{
  userId: string,
  items: array,
  total: number,
  status: "pending" | "completed",
  paymentMethod: string,
  shippingAddress: string,
  createdAt: timestamp,
  paidAt: timestamp (if completed)
}
```

### Contacts Collection (`contacts/{contactId}`)
```javascript
{
  name: string,
  email: string,
  message: string,
  userId: string | null,
  createdAt: timestamp
}
```

## How to Use

### 1. Setup
- Firebase project is already configured
- No additional setup needed - just open the HTML files in a browser
- Make sure you have internet connection for Firebase CDN

### 2. User Registration
1. Navigate to Signup.html
2. Fill in first name, last name, email, and password (min 6 characters)
3. Click Submit
4. User account is created in Firebase Auth
5. User data is saved to Firestore
6. Automatic redirect to home page

### 3. User Login
1. Navigate to Login.html
2. Enter email and password
3. Click Submit
4. On success, redirected to home page
5. Login/Signup buttons are replaced with Logout button

### 4. Shopping Cart
- **For Logged-in Users**: Cart is automatically saved to Firestore
- **Cart Persistence**: Cart items persist across sessions
- **Add to Cart**: Click shopping bag icon on any product
- **View Cart**: Click cart icon in header
- **Remove Items**: Click trash icon in cart
- **Update Quantity**: Change quantity input in cart

### 5. Checkout Process
1. Add items to cart
2. Click "Buy Now" in cart
3. Order is saved to Firestore
4. Redirected to payment page
5. Fill payment details
6. Complete payment
7. Order status updated to "completed"

### 6. Password Reset
1. Go to Login.html
2. Click "Forget a Password"
3. Enter email address
4. Password reset email sent via Firebase
5. Check email for reset link

## Features

### ✅ Implemented
- User authentication (signup, login, logout)
- Password reset via email
- Cart persistence per user
- Order management
- Contact form with Firestore storage
- Auth state management (UI updates based on login status)
- Error handling and user feedback
- Form validation

### 🔄 Enhanced
- Shopping cart functionality
- Payment page
- User experience improvements
- Navigation consistency

## Technical Details

### Firebase SDK Version
- Using Firebase v10.7.1 via CDN
- Modular SDK approach with ES6 modules

### Browser Compatibility
- Modern browsers with ES6 module support
- Chrome, Firefox, Safari, Edge (latest versions)

### Security
- Firebase handles authentication security
- Firestore security rules should be configured in Firebase Console
- No sensitive data stored in client-side code

## Firebase Console Setup

To manage the database and view data:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `leo-store-8ffbe`
3. Navigate to:
   - **Authentication**: View/manage users
   - **Firestore Database**: View collections (users, carts, orders, contacts)
   - **Storage**: (if needed for product images)

## Security Rules (Recommended)

Add these Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own cart
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Anyone can create contact messages
    match /contacts/{contactId} {
      allow create: if true;
      allow read: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Firebase not initializing
- Check browser console for errors
- Ensure internet connection
- Verify Firebase config in `js/firebase.js`

### Authentication not working
- Check Firebase Console > Authentication > Sign-in method
- Ensure Email/Password is enabled
- Check browser console for specific error messages

### Cart not saving
- Ensure user is logged in
- Check browser console for Firestore errors
- Verify Firestore is enabled in Firebase Console

## Future Enhancements

Potential improvements:
- Product detail pages
- Order history page
- User profile page
- Admin dashboard
- Product search improvements
- Payment gateway integration (Stripe, PayPal)
- Email notifications
- Product reviews/ratings

## Notes

- All Firebase operations are asynchronous
- Cart data is user-specific (requires login)
- Orders are saved with user ID for tracking
- Contact messages are stored for admin review
- Password reset emails are sent via Firebase

---

**Project Status**: ✅ Fully Restructured and Functional
**Last Updated**: Current Date
**Firebase Project**: leo-store-8ffbe

