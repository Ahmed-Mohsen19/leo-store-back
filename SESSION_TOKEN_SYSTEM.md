# Session Token System - Implementation Guide

## Overview
The project now includes a comprehensive session token management system that works alongside Firebase Authentication to provide secure, persistent user sessions.

## Features

### 1. Session Token Generation
- **Secure Token Creation**: Generates unique, tamper-proof session tokens
- **Token Structure**: Contains userId, email, timestamp, and security hash
- **Base64 Encoding**: Tokens are encoded for safe storage

### 2. Session Storage
- **Dual Storage**: Uses both `sessionStorage` (tab-specific) and `localStorage` (persistent)
- **Session Data**: Stores token, expiry time, and user information
- **Automatic Fallback**: Falls back to localStorage if sessionStorage is empty

### 3. Session Validation
- **Token Verification**: Validates token structure and integrity
- **Expiry Checking**: Automatically detects expired sessions
- **Tamper Detection**: Detects if token has been modified

### 4. Session Management
- **Auto-Refresh**: Automatically refreshes tokens before expiry
- **Session Persistence**: Sessions persist across page reloads
- **Secure Logout**: Completely clears all session data

### 5. Integration with Firebase Auth
- **Seamless Integration**: Works with Firebase Authentication
- **Token Creation**: Creates session token on login/signup
- **Token Validation**: Validates session on every page load
- **Auto-Sync**: Syncs with Firebase auth state

## Session Token Structure

```
Token Format: [encodedData].[hash]

Encoded Data Contains:
{
  userId: "user123",
  email: "user@example.com",
  timestamp: 1234567890,
  random: "abc123xyz"
}

Hash: Security hash based on userId + timestamp + random
```

## Storage Keys

- `leo_store_session_token` - The session token
- `leo_store_session_expiry` - Token expiry timestamp
- `leo_store_session_user` - User information (uid, email, displayName)

## Session Duration

- **Default**: 24 hours
- **Auto-Refresh**: Refreshes if less than 1 hour remaining
- **Check Interval**: Validates every 30 minutes

## API Reference

### `window.sessionService`

#### `createSession(user)`
Creates a new session token for the user.
```javascript
const result = window.sessionService.createSession(user);
// Returns: { success: true, token: "...", expiry: 1234567890 }
```

#### `getSessionToken()`
Gets the current session token.
```javascript
const token = window.sessionService.getSessionToken();
// Returns: token string or null
```

#### `getSessionUser()`
Gets user information from session.
```javascript
const user = window.sessionService.getSessionUser();
// Returns: { uid: "...", email: "...", displayName: "..." } or null
```

#### `validateCurrentSession()`
Validates the current session.
```javascript
const validation = window.sessionService.validateCurrentSession();
// Returns: { valid: true, userId: "...", email: "..." } or { valid: false, error: "..." }
```

#### `validateSessionToken(token)`
Validates a specific token.
```javascript
const validation = window.sessionService.validateSessionToken(token);
// Returns: { valid: true, userId: "..." } or { valid: false, error: "..." }
```

#### `refreshSession()`
Refreshes the current session (extends expiry).
```javascript
const result = window.sessionService.refreshSession();
// Returns: { success: true } or { success: false, error: "..." }
```

#### `clearSession()`
Clears all session data.
```javascript
const result = window.sessionService.clearSession();
// Returns: { success: true }
```

#### `isSessionActive()`
Checks if session is currently active.
```javascript
const active = window.sessionService.isSessionActive();
// Returns: true or false
```

## Integration Points

### 1. User Login
- Session token created automatically on successful login
- Stored in both sessionStorage and localStorage

### 2. User Signup
- Session token created automatically on successful signup
- User data saved to Firestore

### 3. User Logout
- Session token cleared from all storage
- Firebase auth state cleared

### 4. Page Load
- Session validated automatically
- UI updated based on session state
- Auto-refresh if needed

### 5. Protected Routes
- Can check session before allowing access
- Validates both Firebase auth and session token

## Security Features

### 1. Token Security
- **Hash Verification**: Each token includes a security hash
- **Tamper Detection**: Detects if token is modified
- **Expiry Management**: Tokens expire after 24 hours

### 2. Storage Security
- **Dual Storage**: Uses both sessionStorage and localStorage
- **Automatic Cleanup**: Expired tokens are automatically removed
- **Secure Logout**: All session data cleared on logout

### 3. Validation
- **Structure Validation**: Validates token format
- **Expiry Checking**: Checks if token is expired
- **User Verification**: Verifies token belongs to current user

## Usage Examples

### Check if User is Logged In
```javascript
if (window.sessionService && window.sessionService.isSessionActive()) {
  const user = window.sessionService.getSessionUser();
  console.log("User logged in:", user.email);
}
```

### Get Current User
```javascript
// Method 1: From session
const sessionUser = window.sessionService.getSessionUser();

// Method 2: From auth service (includes session validation)
const authUser = window.authService.getCurrentUser();

// Method 3: From session (works even if Firebase not loaded)
const sessionUser = window.authService.getCurrentUserFromSession();
```

### Validate Session Before Action
```javascript
const validation = window.sessionService.validateCurrentSession();
if (validation.valid) {
  // Proceed with action
  console.log("User ID:", validation.userId);
} else {
  // Redirect to login
  window.location.href = "Login.html";
}
```

### Manual Session Refresh
```javascript
if (window.sessionService.isSessionActive()) {
  const result = window.sessionService.refreshSession();
  if (result.success) {
    console.log("Session refreshed");
  }
}
```

## Flow Diagram

### Login Flow
```
User Login → Firebase Auth → Create Session Token → Store in Storage → Update UI
```

### Page Load Flow
```
Page Load → Check Session Token → Validate Token → 
  If Valid: Load User Data → Update UI
  If Invalid: Clear Session → Show Login
```

### Logout Flow
```
User Logout → Clear Session Token → Clear Firebase Auth → Clear Storage → Update UI
```

## Benefits

1. **Persistent Sessions**: Users stay logged in across page reloads
2. **Security**: Tokens are validated and tamper-proof
3. **Performance**: Fast session validation without Firebase calls
4. **Reliability**: Works even if Firebase auth is slow to load
5. **User Experience**: Seamless authentication experience

## Files Modified

1. **js/sessionService.js** (NEW) - Complete session management system
2. **js/auth.js** - Integrated session token creation/clearing
3. **js/authState.js** - Added session checking on init
4. **All HTML pages** - Added sessionService script

## Testing

### Test Session Creation
1. Login with valid credentials
2. Check browser console for session token
3. Check localStorage/sessionStorage for session data

### Test Session Persistence
1. Login
2. Reload page
3. Verify user is still logged in
4. Check session token is still valid

### Test Session Expiry
1. Login
2. Manually set expiry to past time in storage
3. Reload page
4. Verify session is cleared and user needs to login

### Test Session Logout
1. Login
2. Click logout
3. Verify all session data is cleared
4. Verify user needs to login again

---

**Status**: ✅ Implemented
**Date**: Current

