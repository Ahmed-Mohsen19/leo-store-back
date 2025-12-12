// Session Token Management Service
// Manages user session tokens for secure authentication

// Session token storage keys
const SESSION_TOKEN_KEY = 'leo_store_session_token';
const SESSION_EXPIRY_KEY = 'leo_store_session_expiry';
const SESSION_USER_KEY = 'leo_store_session_user';

// Session duration (24 hours in milliseconds)
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Generate a secure session token
function generateSessionToken(userId, email) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const tokenData = {
    userId: userId,
    email: email,
    timestamp: timestamp,
    random: random
  };
  
  // Create token string
  const tokenString = btoa(JSON.stringify(tokenData));
  
  // Add hash for security
  const hash = btoa(userId + timestamp + random).substring(0, 16);
  
  return `${tokenString}.${hash}`;
}

// Validate session token
function validateSessionToken(token) {
  try {
    console.log("validateSessionToken called with token:", token ? token.substring(0, 50) + "..." : "null");

    if (!token || typeof token !== 'string') {
      console.log("Invalid token format");
      return { valid: false, error: 'Invalid token format' };
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      console.log("Invalid token structure, parts:", parts.length);
      return { valid: false, error: 'Invalid token structure' };
    }

    const [tokenData, hash] = parts;
    console.log("Token data length:", tokenData.length);
    console.log("Hash:", hash);

    let decoded;
    try {
      decoded = JSON.parse(atob(tokenData));
      console.log("Decoded token data:", decoded);
    } catch (decodeError) {
      console.log("Failed to decode token data:", decodeError);
      return { valid: false, error: 'Token decode failed: ' + decodeError.message };
    }

    // Check if token is expired
    const now = Date.now();
    const tokenAge = now - decoded.timestamp;
    console.log("Token age:", tokenAge, "max allowed:", SESSION_DURATION);

    if (tokenAge > SESSION_DURATION) {
      console.log("Token expired");
      return { valid: false, error: 'Token expired', expired: true };
    }

    // Verify hash
    const expectedHash = btoa(decoded.userId + decoded.timestamp + decoded.random).substring(0, 16);
    console.log("Expected hash:", expectedHash);
    console.log("Actual hash:", hash);

    if (hash !== expectedHash) {
      console.log("Token hash mismatch");
      return { valid: false, error: 'Token tampered' };
    }

    console.log("Token validation successful");
    return {
      valid: true,
      userId: decoded.userId,
      email: decoded.email,
      timestamp: decoded.timestamp
    };
  } catch (error) {
    console.error("Token validation error:", error);
    return { valid: false, error: 'Token validation failed: ' + error.message };
  }
}

// Create session for user
function createSession(user) {
  try {
    const userId = user.uid;
    const email = user.email || '';
    const displayName = user.displayName || '';
    
    // Generate session token
    const token = generateSessionToken(userId, email);
    const expiry = Date.now() + SESSION_DURATION;
    
    // Store session data
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify({
      uid: userId,
      email: email,
      displayName: displayName
    }));
    
    // Also store in localStorage for persistence across tabs
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify({
      uid: userId,
      email: email,
      displayName: displayName
    }));
    
    return { success: true, token: token, expiry: expiry };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: error.message };
  }
}

// Get current session token
function getSessionToken() {
  // Try sessionStorage first (more secure, cleared on tab close)
  let token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  let expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);
  
  // Fallback to localStorage if sessionStorage is empty
  if (!token) {
    token = localStorage.getItem(SESSION_TOKEN_KEY);
    expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
  }
  
  if (!token || !expiry) {
    return null;
  }
  
  // Check if expired
  const expiryTime = parseInt(expiry);
  if (Date.now() > expiryTime) {
    clearSession();
    return null;
  }
  
  return token;
}

// Get current session user
function getSessionUser() {
  let userData = sessionStorage.getItem(SESSION_USER_KEY);
  
  if (!userData) {
    userData = localStorage.getItem(SESSION_USER_KEY);
  }
  
  if (!userData) {
    return null;
  }
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing session user:', error);
    return null;
  }
}

// Validate current session
function validateCurrentSession() {
  console.log("validateCurrentSession called");

  const token = getSessionToken();
  console.log("Session token found:", !!token);

  if (!token) {
    console.log("No session token found");
    return { valid: false, error: 'No session token found' };
  }

  const validation = validateSessionToken(token);
  console.log("Token validation result:", validation);

  if (!validation.valid) {
    // Clear invalid session
    if (validation.expired) {
      console.log("Session expired, clearing...");
      clearSession();
    }
    return validation;
  }

  const sessionUser = getSessionUser();
  console.log("Session user from storage:", sessionUser);

  return {
    valid: true,
    userId: validation.userId,
    email: validation.email,
    user: sessionUser
  };
}

// Refresh session token (extend expiry)
function refreshSession() {
  const token = getSessionToken();
  const user = getSessionUser();
  
  if (!token || !user) {
    return { success: false, error: 'No active session to refresh' };
  }
  
  const validation = validateSessionToken(token);
  if (!validation.valid) {
    return { success: false, error: 'Cannot refresh invalid session' };
  }
  
  // Create new session with extended expiry
  return createSession({
    uid: validation.userId,
    email: validation.email,
    displayName: user.displayName || ''
  });
}

// Clear session
function clearSession() {
  // Clear from sessionStorage
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_EXPIRY_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
  
  // Clear from localStorage
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
  
  return { success: true };
}

// Check if session is active
function isSessionActive() {
  const validation = validateCurrentSession();
  return validation.valid;
}

// Auto-refresh session before expiry (within 1 hour)
function autoRefreshSession() {
  const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY) || localStorage.getItem(SESSION_EXPIRY_KEY);
  
  if (!expiry) {
    return;
  }
  
  const expiryTime = parseInt(expiry);
  const now = Date.now();
  const timeUntilExpiry = expiryTime - now;
  const oneHour = 60 * 60 * 1000;
  
  // Refresh if less than 1 hour remaining
  if (timeUntilExpiry > 0 && timeUntilExpiry < oneHour) {
    refreshSession();
  }
}

// Initialize session service
function initSessionService() {
  // Auto-refresh session periodically
  setInterval(() => {
    if (isSessionActive()) {
      autoRefreshSession();
    }
  }, 30 * 60 * 1000); // Check every 30 minutes
  
  // Validate session on page load
  const validation = validateCurrentSession();
  if (!validation.valid && validation.expired) {
    console.log('Session expired, user needs to login again');
  }
}

// Export session service
window.sessionService = {
  createSession,
  getSessionToken,
  getSessionUser,
  validateCurrentSession,
  validateSessionToken,
  refreshSession,
  clearSession,
  isSessionActive,
  initSessionService
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSessionService);
} else {
  initSessionService();
}

