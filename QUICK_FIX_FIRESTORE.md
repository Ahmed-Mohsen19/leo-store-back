# Quick Fix: Firestore Permissions Error

## The Problem
When clicking "Buy Now" in cart, you get: **"Error placing order: missing or insufficient permissions"**

## The Solution (2 Options)

### Option 1: Quick Development Fix (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **leo-store-8ffbe**
3. Click **Firestore Database** → **Rules** tab
4. Replace ALL rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Click **Publish**
6. Try placing order again - should work now!

⚠️ **Note**: This allows any logged-in user to read/write everything. Good for testing, but use Option 2 for production.

---

### Option 2: Proper Security Rules (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **leo-store-8ffbe**
3. Click **Firestore Database** → **Rules** tab
4. Replace ALL rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users can manage their own data
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Users can manage their own cart
    match /carts/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Users can create and read their own orders
    match /orders/{orderId} {
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow read, update: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Anyone can submit contact form
    match /contacts/{contactId} {
      allow create: if true;
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || resource.data.userId == null);
    }
  }
}
```

5. Click **Publish**
6. Done! ✅

---

## Still Not Working?

1. **Make sure you're logged in** - Check if Login/Signup buttons are visible (means you're not logged in)
2. **Check browser console** (F12) for detailed error messages
3. **Verify rules are published** - Should see "Rules published successfully"
4. **Clear browser cache** and try again

---

## What These Rules Do

- **Users**: Users can only access their own profile
- **Carts**: Users can only access their own cart
- **Orders**: Users can create orders and read their own orders
- **Contacts**: Anyone can submit, users can read their own messages

---

**Need more help?** See `FIRESTORE_RULES.md` for detailed explanation.

