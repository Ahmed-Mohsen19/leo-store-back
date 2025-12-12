// Authentication service using Firebase Auth v9+
// This file uses ES modules and should be loaded as type="module"

// Wait for Firebase to be initialized
async function waitForFirebase() {
  while (!window.firebaseAuth) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Sign up new user
async function signUp(email, password, firstName, lastName) {
  let user = null;
  try {
    await waitForFirebase();
    
    const { createUserWithEmailAndPassword, updateProfile } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
    
    const auth = window.firebaseAuth;
    
    if (!auth) {
      return { success: false, error: "Firebase Auth not initialized" };
    }

    // Step 1: Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    user = userCredential.user;
    
    // Step 2: Update user profile with display name
    try {
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });
    } catch (profileError) {
      console.warn("Failed to update profile, but user created:", profileError);
      // Continue even if profile update fails
    }

    // Step 3: Save user data to Firestore (non-critical - user is already created)
    const db = window.firebaseDb;
    if (db) {
      try {
        const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          displayName: `${firstName} ${lastName}`,
          createdAt: serverTimestamp(),
          cart: []
        });
      } catch (firestoreError) {
        // Firestore write failed, but user is created - log warning but don't fail
        console.warn("User created but Firestore write failed:", firestoreError);
        // User can still use the app, we'll retry saving user data later if needed
      }
    }

    // Success - user is created and authenticated
    // Create session token
    if (window.sessionService) {
      window.sessionService.createSession(user);
    }
    
    return { success: true, user: user };
  } catch (error) {
    // Only return error if Auth creation failed (user not created)
    let errorMessage = "An error occurred during sign up.";
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already registered.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address.";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password should be at least 6 characters.";
    } else if (error.code) {
      errorMessage = error.message || "Authentication error occurred.";
    }
    return { success: false, error: errorMessage };
  }
}

// Sign in existing user
async function signIn(email, password) {
  try {
    await waitForFirebase();
    
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
    const auth = window.firebaseAuth;
    
    if (!auth) {
      return { success: false, error: "Firebase Auth not initialized" };
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create session token
    if (window.sessionService) {
      window.sessionService.createSession(user);
    }
    
    return { success: true, user: user };
  } catch (error) {
    let errorMessage = "An error occurred during sign in.";
    if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email.";
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Incorrect password.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address.";
    } else if (error.code === "auth/user-disabled") {
      errorMessage = "This account has been disabled.";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later.";
    }
    return { success: false, error: errorMessage };
  }
}

// Sign out user
async function logOut() {
  try {
    await waitForFirebase();
    
    const { signOut } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
    const auth = window.firebaseAuth;
    
    if (!auth) {
      return { success: false, error: "Firebase Auth not initialized" };
    }

    await signOut(auth);
    
    // Clear session token
    if (window.sessionService) {
      window.sessionService.clearSession();
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Send password reset email
async function resetPassword(email) {
  try {
    await waitForFirebase();
    
    const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
    const auth = window.firebaseAuth;
    
    if (!auth) {
      return { success: false, error: "Firebase Auth not initialized" };
    }

    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    let errorMessage = "An error occurred.";
    if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address.";
    }
    return { success: false, error: errorMessage };
  }
}

// Monitor authentication state
function onAuthStateChange(callback) {
  waitForFirebase().then(async () => {
    const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
    const auth = window.firebaseAuth;
    
    if (!auth) {
      console.error("Firebase Auth not initialized");
      return;
    }

    onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  });
}

// Get current user
function getCurrentUser() {
  const auth = window.firebaseAuth;
  const firebaseUser = auth ? auth.currentUser : null;
  
  // If Firebase user exists, verify session token
  if (firebaseUser && window.sessionService) {
    const sessionValidation = window.sessionService.validateCurrentSession();
    if (!sessionValidation.valid) {
      // Session invalid, but Firebase user exists - refresh session
      window.sessionService.createSession(firebaseUser);
      return firebaseUser;
    }
    return firebaseUser;
  }
  
  // If no Firebase user but session exists, return null (need to login)
  if (!firebaseUser && window.sessionService) {
    const sessionValidation = window.sessionService.validateCurrentSession();
    if (sessionValidation.valid) {
      // Session exists but Firebase user doesn't - clear session
      window.sessionService.clearSession();
    }
  }
  
  return firebaseUser;
}

// Get user from session (works even if Firebase auth state not loaded yet)
function getCurrentUserFromSession() {
  if (window.sessionService) {
    const sessionValidation = window.sessionService.validateCurrentSession();
    if (sessionValidation.valid) {
      return window.sessionService.getSessionUser();
    }
  }
  return null;
}

// Export functions globally
window.authService = {
  signUp,
  signIn,
  logOut,
  resetPassword,
  onAuthStateChange,
  getCurrentUser,
  getCurrentUserFromSession
};
