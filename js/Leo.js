// OPEN & CLOSE CART
const cartIcon = document.querySelector("#cart-icon");
const cart = document.querySelector(".cart");
const closeCart = document.querySelector("#cart-close");

if (cartIcon) {
  cartIcon.addEventListener("click", () => {
    cart.classList.add("active");
  });
}

if (closeCart) {
  closeCart.addEventListener("click", () => {
    cart.classList.remove("active");
  });
}

// Wait for Firebase and auth services
function waitForServices() {
  return new Promise((resolve) => {
    const checkServices = setInterval(() => {
      if (window.firebaseDb && window.authService && window.cartService) {
        clearInterval(checkServices);
        resolve();
      }
    }, 100);
  });
}

// Start when the document is ready
if (document.readyState == "loading") {
  document.addEventListener("DOMContentLoaded", async () => {
    await waitForServices();
    
    // Check if order is in progress (user clicked Buy Now but hasn't completed payment)
    if (sessionStorage.getItem('orderInProgress') === 'true') {
      // Don't load cart - order is being processed
      // Only clear if payment was completed
      if (sessionStorage.getItem('clearCart') === 'true') {
        sessionStorage.removeItem('clearCart');
        sessionStorage.removeItem('orderInProgress');
        itemsAdded = [];
        const cartContent = cart?.querySelector(".cart-content");
        if (cartContent) {
          cartContent.innerHTML = "";
        }
        updateTotal();
        // Clear cart from Firestore
        const user = window.authService ? window.authService.getCurrentUser() : null;
        if (user && window.cartService) {
          try {
            await window.cartService.saveCartToFirestore(user.uid, []);
          } catch (error) {
            console.warn("Could not clear cart from Firestore:", error);
          }
        }
      }
      // If orderInProgress but no clearCart flag, keep cart empty (payment not completed yet)
    } else if (sessionStorage.getItem('clearCart') === 'true') {
      // Payment completed, clear cart
      sessionStorage.removeItem('clearCart');
      itemsAdded = [];
      const cartContent = cart?.querySelector(".cart-content");
      if (cartContent) {
        cartContent.innerHTML = "";
      }
      updateTotal();
      // Clear cart from Firestore
      const user = window.authService ? window.authService.getCurrentUser() : null;
      if (user && window.cartService) {
        try {
          await window.cartService.saveCartToFirestore(user.uid, []);
        } catch (error) {
          console.warn("Could not clear cart from Firestore:", error);
        }
      }
    } else {
      // Normal flow - load cart from Firestore
      await loadCartFromFirestore();
    }
    
    start();
  });
} else {
  waitForServices().then(async () => {
    // Check if order is in progress (user clicked Buy Now but hasn't completed payment)
    if (sessionStorage.getItem('orderInProgress') === 'true') {
      // Don't load cart - order is being processed
      // Only clear if payment was completed
      if (sessionStorage.getItem('clearCart') === 'true') {
        sessionStorage.removeItem('clearCart');
        sessionStorage.removeItem('orderInProgress');
        itemsAdded = [];
        const cartContent = cart?.querySelector(".cart-content");
        if (cartContent) {
          cartContent.innerHTML = "";
        }
        updateTotal();
        // Clear cart from Firestore
        const user = window.authService ? window.authService.getCurrentUser() : null;
        if (user && window.cartService) {
          try {
            await window.cartService.saveCartToFirestore(user.uid, []);
          } catch (error) {
            console.warn("Could not clear cart from Firestore:", error);
          }
        }
      }
      // If orderInProgress but no clearCart flag, keep cart empty (payment not completed yet)
    } else if (sessionStorage.getItem('clearCart') === 'true') {
      // Payment completed, clear cart
      sessionStorage.removeItem('clearCart');
      itemsAdded = [];
      const cartContent = cart?.querySelector(".cart-content");
      if (cartContent) {
        cartContent.innerHTML = "";
      }
      updateTotal();
      // Clear cart from Firestore
      const user = window.authService ? window.authService.getCurrentUser() : null;
      if (user && window.cartService) {
        try {
          await window.cartService.saveCartToFirestore(user.uid, []);
        } catch (error) {
          console.warn("Could not clear cart from Firestore:", error);
        }
      }
    } else {
      // Normal flow - load cart from Firestore
      await loadCartFromFirestore();
    }
    
    start();
  });
}

// =============== START ====================
function start() {
  addEvents();
}

// ============= UPDATE & RERENDER ===========
// Throttle cart saving to avoid too many writes
let cartSaveTimeout = null;
function update() {
  addEvents();
  updateTotal();
  
  // Don't save cart if order is in progress (user is on payment page)
  if (sessionStorage.getItem('orderInProgress') === 'true') {
    return;
  }
  
  // Throttle cart saving - only save after 1 second of inactivity
  if (cartSaveTimeout) {
    clearTimeout(cartSaveTimeout);
  }
  cartSaveTimeout = setTimeout(() => {
    saveCartToFirestore();
  }, 1000);
}

// =============== ADD EVENTS ===============
// Store event listeners to avoid duplicates
const eventListeners = new Map();

function addEvents() {
  // Remove items from cart
  let cartRemove_btns = document.querySelectorAll(".cart-remove");
  cartRemove_btns.forEach((btn) => {
    if (!eventListeners.has(btn)) {
      btn.addEventListener("click", handle_removeCartItem);
      eventListeners.set(btn, true);
    }
  });

  // Change item quantity
  let cartQuantity_inputs = document.querySelectorAll(".cart-quantity");
  cartQuantity_inputs.forEach((input) => {
    if (!eventListeners.has(input)) {
      input.addEventListener("change", handle_changeItemQuantity);
      eventListeners.set(input, true);
    }
  });

  // Add item to cart (only add once on page load)
  if (!eventListeners.has('addCart')) {
    let addCart_btns = document.querySelectorAll(".add-cart");
    addCart_btns.forEach((btn) => {
      btn.addEventListener("click", handle_addCartItem);
    });
    eventListeners.set('addCart', true);
  }

  // Buy Order (only add once)
  if (!eventListeners.has('buyBtn')) {
    const buy_btn = document.querySelector(".btn-buy");
    if (buy_btn) {
      buy_btn.addEventListener("click", handle_buyOrder);
      eventListeners.set('buyBtn', true);
    }
  }
}

// ============= FIRESTORE CART PERSISTENCE ===========
async function saveCartToFirestore() {
  // Get user from session or Firebase auth
  let user = null;
  if (window.sessionService) {
    const sessionValidation = window.sessionService.validateCurrentSession();
    if (sessionValidation.valid) {
      user = window.authService ? window.authService.getCurrentUser() : null;
      if (!user) {
        const sessionUser = window.sessionService.getSessionUser();
        if (sessionUser) {
          user = { uid: sessionUser.uid };
        }
      }
    }
  } else {
    user = window.authService ? window.authService.getCurrentUser() : null;
  }
  
  if (user && window.cartService && itemsAdded.length >= 0) {
    try {
      await window.cartService.saveCartToFirestore(user.uid, itemsAdded);
    } catch (error) {
      console.error("Error saving cart to Firestore:", error);
      // Don't show error to user - cart still works locally
    }
  }
}

async function loadCartFromFirestore() {
  // Get user from session or Firebase auth
  let user = null;
  if (window.sessionService) {
    const sessionValidation = window.sessionService.validateCurrentSession();
    if (sessionValidation.valid) {
      user = window.authService ? window.authService.getCurrentUser() : null;
      if (!user) {
        const sessionUser = window.sessionService.getSessionUser();
        if (sessionUser) {
          user = { uid: sessionUser.uid };
        }
      }
    }
  } else {
    user = window.authService ? window.authService.getCurrentUser() : null;
  }
  
  if (user && window.cartService) {
    try {
      const result = await window.cartService.loadCartFromFirestore(user.uid);
      if (result.success && result.cart && result.cart.length > 0) {
        itemsAdded = result.cart;
        renderCartFromItems();
      }
    } catch (error) {
      console.error("Error loading cart from Firestore:", error);
      // Continue without cart - user can still shop
    }
  }
}

function renderCartFromItems() {
  const cartContent = cart?.querySelector(".cart-content");
  if (!cartContent) return;
  
  cartContent.innerHTML = "";
  itemsAdded.forEach(item => {
    if (item.title && item.price && item.imgSrc) {
      let cartBoxElement = CartBoxComponent(item.title, item.price, item.imgSrc);
      let newNode = document.createElement("div");
      newNode.innerHTML = cartBoxElement;
      cartContent.appendChild(newNode);
    }
  });
  update();
}

// ============= HANDLE EVENTS FUNCTIONS =============
let itemsAdded = [];

function handle_addCartItem() {
  let product = this.parentElement;
  let titleElement = product.querySelector(".product-title");
  let priceElement = product.querySelector(".product-price");
  let imgElement = product.querySelector(".product-img");
  
  if (!titleElement || !priceElement || !imgElement) {
    console.error("Product elements not found");
    return;
  }
  
  let title = titleElement.innerHTML.trim();
  let price = priceElement.innerHTML.trim();
  let imgSrc = imgElement.src;

  let newToAdd = {
    title,
    price,
    imgSrc,
  };

  // handle item is already exist
  if (itemsAdded.find((el) => el.title === newToAdd.title)) {
    alert("This Item Is Already In Your Cart!");
    return;
  } else {
    itemsAdded.push(newToAdd);
  }

  // Add product to cart
  let cartBoxElement = CartBoxComponent(title, price, imgSrc);
  let newNode = document.createElement("div");
  newNode.innerHTML = cartBoxElement;
  const cartContent = cart?.querySelector(".cart-content");
  if (cartContent) {
    cartContent.appendChild(newNode);
    update();
  } else {
    console.error("Cart content not found");
  }
}

function handle_removeCartItem() {
  const cartBox = this.parentElement;
  const titleElement = cartBox.querySelector(".cart-product-title");
  
  if (titleElement) {
    const title = titleElement.innerHTML.trim();
    itemsAdded = itemsAdded.filter((el) => el.title !== title);
    cartBox.remove();
    update();
  } else {
    // Fallback: remove by index if title not found
    const cartBoxes = Array.from(document.querySelectorAll(".cart-box"));
    const index = cartBoxes.indexOf(cartBox);
    if (index !== -1) {
      itemsAdded.splice(index, 1);
      cartBox.remove();
      update();
    }
  }
}

function handle_changeItemQuantity() {
  if (isNaN(this.value) || this.value < 1) {
    this.value = 1;
  }
  this.value = Math.floor(this.value); // to keep it integer

  update();
}

async function handle_buyOrder() {
  if (itemsAdded.length <= 0) {
    alert("There is No Order to Place Yet! \nPlease Make an Order first.");
    return;
  }
  
  // Check session first, then Firebase auth
  let user = null;
  if (window.sessionService) {
    const sessionValidation = window.sessionService.validateCurrentSession();
    if (sessionValidation.valid) {
      // Session valid, get user from session or Firebase
      user = window.authService ? window.authService.getCurrentUser() : null;
      if (!user) {
        // Try to get from session
        const sessionUser = window.sessionService.getSessionUser();
        if (sessionUser) {
          // Create a user-like object from session
          user = { uid: sessionUser.uid, email: sessionUser.email, displayName: sessionUser.displayName };
        }
      }
    }
  } else {
    user = window.authService ? window.authService.getCurrentUser() : null;
  }
  
  if (!user) {
    alert("Please login to place an order.");
    window.location.href = "Login.html";
    return;
  }
  
  // Calculate total using actual quantities from cart
  let total = 0;
  const cartBoxes = document.querySelectorAll(".cart-box");
  cartBoxes.forEach((cartBox) => {
    const priceElement = cartBox.querySelector(".cart-price");
    const quantityElement = cartBox.querySelector(".cart-quantity");
    if (priceElement && quantityElement) {
      const price = parseFloat(priceElement.innerHTML.replace("$", "").replace(",", ""));
      const quantity = parseInt(quantityElement.value) || 1;
      total += price * quantity;
    }
  });
  
  // Update itemsAdded with quantities for order
  const itemsWithQuantities = itemsAdded.map((item, index) => {
    const cartBox = cartBoxes[index];
    if (cartBox) {
      const quantityElement = cartBox.querySelector(".cart-quantity");
      return {
        ...item,
        quantity: parseInt(quantityElement?.value) || 1
      };
    }
    return { ...item, quantity: 1 };
  });
  
  // Prepare order data to pass to payment page
  const orderData = {
    items: itemsWithQuantities,
    total: total.toFixed(2),
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName || ""
  };
  
  // Save order data to localStorage to pass to payment page
  try {
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    // Set flag to prevent cart reloading after redirect
    sessionStorage.setItem('orderInProgress', 'true');
    
    // Clear cart from UI immediately (but don't save to Firestore yet - will be cleared after payment)
    itemsAdded = [];
    const cartContent = cart?.querySelector(".cart-content");
    if (cartContent) {
      cartContent.innerHTML = "";
    }
    updateTotal();
    
    // Close cart if open
    if (cart) {
      cart.classList.remove("active");
    }
    
    // Redirect to payment page
    window.location.href = "pay.html";
  } catch (error) {
    console.error("Error saving order data:", error);
    alert("Error preparing order. Please try again.");
  }
}

// =========== UPDATE & RERENDER FUNCTIONS =========
function updateTotal() {
  let cartBoxes = document.querySelectorAll(".cart-box");
  const totalElement = cart?.querySelector(".total-price");
  
  if (!totalElement) return;
  
  let total = 0;
  cartBoxes.forEach((cartBox) => {
    let priceElement = cartBox.querySelector(".cart-price");
    let quantityElement = cartBox.querySelector(".cart-quantity");
    
    if (priceElement && quantityElement) {
      let price = parseFloat(priceElement.innerHTML.replace("$", "").replace(",", ""));
      let quantity = parseInt(quantityElement.value) || 1;
      
      if (!isNaN(price) && !isNaN(quantity)) {
        total += price * quantity;
      }
    }
  });

  // keep 2 digits after the decimal point
  total = total.toFixed(2);
  totalElement.innerHTML = "$" + total;
}

// ============= HTML COMPONENTS =============
function CartBoxComponent(title, price, imgSrc) {
  return `
    <div class="cart-box">
        <img src=${imgSrc} alt="" class="cart-img">
        <div class="detail-box">
            <div class="cart-product-title">${title}</div>
            <div class="cart-price">${price}</div>
            <input type="number" value="1" class="cart-quantity">
        </div>
        <!-- REMOVE CART  -->
        <i class='bx bxs-trash-alt cart-remove'></i>
    </div>`;
}
// search - Initialize once
function initSearch() {
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    
    if (searchButton && searchInput) {
        // Only add listeners once
        if (!eventListeners.has('searchButton')) {
            searchButton.addEventListener('click', function() {
                const query = searchInput.value.toLowerCase().trim();
                search(query);
            });
            eventListeners.set('searchButton', true);
        }
        
        if (!eventListeners.has('searchInput')) {
            // Allow Enter key to search
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchButton.click();
                }
            });
            
            // Reset display when search is cleared
            searchInput.addEventListener('input', function() {
                if (this.value.trim() === '') {
                    resetSearchDisplay();
                }
            });
            
            eventListeners.set('searchInput', true);
        }
    }
}

function search(query) {
    const products = document.querySelectorAll('.product-box');
    let found = false;
    
    products.forEach(product => {
        const productName = product.querySelector('.product-title')?.innerText.toLowerCase() || '';
        if (productName.includes(query)) {
            product.style.display = 'block';
            found = true;
        } else {
            product.style.display = 'none';
        }
    });
    
    // Show message if no products found
    if (!found && query) {
        // Could add a "no results" message here
        console.log("No products found matching:", query);
    }
}

function resetSearchDisplay() {
    const products = document.querySelectorAll('.product-box');
    products.forEach(product => {
        product.style.display = 'block';
    });
}

// Initialize search when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
} else {
    initSearch();
}
