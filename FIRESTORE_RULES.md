# Firestore Security Rules Setup

## Problem
If you're getting "missing or insufficient permissions" error when placing orders, you need to configure Firestore security rules.

## Solution

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **leo-store-8ffbe**
3. Click on **Firestore Database** in the left menu
4. Click on the **Rules** tab

### Step 2: Add Security Rules
Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users Collection
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Carts Collection
    // Users can read/write their own cart
    match /carts/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Orders Collection
    // Users can create orders (for themselves)
    // Users can read their own orders
    match /orders/{orderId} {
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Contacts Collection
    // Anyone can create contact messages
    // Authenticated users can read their own messages
    match /contacts/{contactId} {
      allow create: if true; // Anyone can submit contact form
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || resource.data.userId == null);
    }
  }
}
```

### Step 3: Publish Rules
1. Click **Publish** button
2. Wait for confirmation that rules are published

### Step 4: Test
1. Try placing an order again
2. The error should be resolved

## Alternative: Temporary Development Rules (NOT FOR PRODUCTION)

⚠️ **WARNING**: Only use this for testing/development. Never use in production!

If you want to test quickly without setting up proper rules, you can use:

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

This allows any authenticated user to read/write any document. **Only use for development!**

## Understanding the Rules

### Users Collection
- Users can only access their own user document
- Prevents users from seeing other users' data

### Carts Collection
- Users can only access their own cart
- Each user has their own cart document

### Orders Collection
- Users can create orders (with their own userId)
- Users can only read/update their own orders
- Prevents users from seeing other users' orders

### Contacts Collection
- Anyone can submit a contact form (even without login)
- Logged-in users can read their own messages

## Troubleshooting

### Still Getting Permission Errors?

1. **Check Authentication**:
   - Make sure user is logged in
   - Check browser console for auth errors

2. **Verify Rules Are Published**:
   - Go to Firestore Rules tab
   - Make sure you clicked "Publish"
   - Rules should show as "Active"

3. **Check User ID**:
   - In browser console, check: `window.authService.getCurrentUser()`
   - Should return user object with `uid` property

4. **Test in Firebase Console**:
   - Go to Firestore Database
   - Try to manually create a document
   - Check if it works

5. **Check Error Code**:
   - Open browser console (F12)
   - Look for detailed error messages
   - Error code should be `permission-denied`

## Production Recommendations

For production, consider:

1. **More Restrictive Rules**: Only allow necessary operations
2. **Field Validation**: Validate data structure in rules
3. **Rate Limiting**: Prevent abuse
4. **Admin Rules**: Separate rules for admin operations

## Need Help?

If you're still having issues:
1. Check browser console for detailed errors
2. Verify Firebase project settings
3. Make sure Firestore is enabled (not Realtime Database)
4. Check that Email/Password authentication is enabled

---

**Last Updated**: Current Date
**Firebase Project**: leo-store-8ffbe

