// Firebase configuration and initialization
// Using Firebase v9+ modular SDK via CDN

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNHV1FI-azYG0KCFHRtbht0RtlKiS2Wo0",
  authDomain: "leo-store-8ffbe.firebaseapp.com",
  projectId: "leo-store-8ffbe",
  storageBucket: "leo-store-8ffbe.firebasestorage.app",
  messagingSenderId: "35995777186",
  appId: "1:35995777186:web:fa2fa700cecd82d1783ffb",
  measurementId: "G-917X55PXLZ"
};

// Initialize Firebase - this will be called after Firebase modules are imported
async function initializeFirebase() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const { getStorage } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js");
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    
    // Make Firebase services globally available
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    window.firebaseStorage = storage;
    
    // Store Firebase functions for use in other modules
    window.firebaseModules = {
      initializeApp,
      getAuth,
      getFirestore,
      getStorage
    };
    
    console.log("Firebase initialized successfully");
    
    // Dispatch custom event when Firebase is ready
    window.dispatchEvent(new CustomEvent('firebaseReady'));
    
    return { app, auth, db, storage };
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return null;
  }
}

// Auto-initialize when script loads
initializeFirebase();

// Export config
window.firebaseConfig = firebaseConfig;
window.initializeFirebase = initializeFirebase;
