// Cart service using Firestore v9+
// This service handles cart persistence for authenticated users

async function waitForFirebase() {
  while (!window.firebaseDb) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function saveCartToFirestore(userId, cartItems) {
  try {
    await waitForFirebase();
    
    const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const db = window.firebaseDb;
    
    if (!db) {
      return { success: false, error: "Firestore not initialized" };
    }
    
    await setDoc(doc(db, "carts", userId), {
      items: cartItems,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error("Error saving cart:", error);
    return { success: false, error: error.message };
  }
}

async function loadCartFromFirestore(userId) {
  try {
    await waitForFirebase();
    
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const db = window.firebaseDb;
    
    if (!db) {
      return { success: false, error: "Firestore not initialized", cart: [] };
    }
    
    const cartDoc = await getDoc(doc(db, "carts", userId));
    
    if (cartDoc.exists()) {
      return { success: true, cart: cartDoc.data().items || [] };
    } else {
      return { success: true, cart: [] };
    }
  } catch (error) {
    console.error("Error loading cart:", error);
    return { success: false, error: error.message, cart: [] };
  }
}

async function saveOrderToFirestore(userId, orderData) {
  try {
    await waitForFirebase();
    
    const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const db = window.firebaseDb;
    
    if (!db) {
      return { success: false, error: "Firestore not initialized" };
    }
    
    const order = {
      userId: userId,
      items: orderData.items,
      total: orderData.total,
      status: "pending",
      createdAt: serverTimestamp(),
      ...orderData
    };
    
    const docRef = await addDoc(collection(db, "orders"), order);
    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error("Error saving order:", error);
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.code === 'permission-denied' || error.message.includes('permission')) {
      errorMessage = "Permission denied. Please check Firestore security rules. See FIRESTORE_RULES.md for setup instructions.";
    } else if (error.code === 'unauthenticated') {
      errorMessage = "You must be logged in to place an order. Please login and try again.";
    }
    
    return { success: false, error: errorMessage, code: error.code };
  }
}

// Export functions globally
window.cartService = {
  saveCartToFirestore,
  loadCartFromFirestore,
  saveOrderToFirestore
};
