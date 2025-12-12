// Auth State Management
// This script manages UI updates based on authentication state

function waitForAuthService() {
  return new Promise((resolve) => {
    const checkAuth = setInterval(() => {
      if (window.authService) {
        clearInterval(checkAuth);
        resolve();
      }
    }, 100);
  });
}

async function initAuthState() {
  await waitForAuthService();
  
  // Check session first (before Firebase auth loads)
  if (window.sessionService) {
    const sessionUser = window.sessionService.getSessionUser();
    if (sessionUser) {
      // Session exists, update UI
      updateAuthUI({ uid: sessionUser.uid, email: sessionUser.email, displayName: sessionUser.displayName });
    }
  }
  
  // Monitor auth state changes
  window.authService.onAuthStateChange((user) => {
    if (user && window.sessionService) {
      // Ensure session is created when Firebase auth state changes
      const sessionValidation = window.sessionService.validateCurrentSession();
      if (!sessionValidation.valid) {
        window.sessionService.createSession(user);
      }
    } else if (!user && window.sessionService) {
      // Clear session if user logged out
      window.sessionService.clearSession();
    }
    updateAuthUI(user);
  });
}

function updateAuthUI(user) {
  // Find all login/signup buttons
  const loginButtons = document.querySelectorAll('a[href="Login.html"]');
  const signupButtons = document.querySelectorAll('a[href="Signup.html"]');
  const loginBtnElements = document.querySelectorAll('button a[href="Login.html"]');
  const signupBtnElements = document.querySelectorAll('button a[href="Signup.html"]');
  
  if (user) {
    // User is logged in - hide login/signup buttons, show logout
    loginButtons.forEach(btn => {
      const button = btn.closest('button') || btn.parentElement;
      if (button) button.style.display = 'none';
    });
    
    signupButtons.forEach(btn => {
      const button = btn.closest('button') || btn.parentElement;
      if (button) button.style.display = 'none';
    });
    
    loginBtnElements.forEach(btn => {
      const button = btn.closest('button');
      if (button) button.style.display = 'none';
    });
    
    signupBtnElements.forEach(btn => {
      const button = btn.closest('button');
      if (button) button.style.display = 'none';
    });
    
    // Create logout button if it doesn't exist
    createLogoutButton();
    
    // Update user display name if available
    const userDisplay = document.getElementById('user-display');
    if (userDisplay) {
      userDisplay.textContent = user.displayName || user.email;
      userDisplay.style.display = 'block';
    }
  } else {
    // User is not logged in - show login/signup buttons
    loginButtons.forEach(btn => {
      const button = btn.closest('button') || btn.parentElement;
      if (button) button.style.display = 'inline-block';
    });
    
    signupButtons.forEach(btn => {
      const button = btn.closest('button') || btn.parentElement;
      if (button) button.style.display = 'inline-block';
    });
    
    loginBtnElements.forEach(btn => {
      const button = btn.closest('button');
      if (button) button.style.display = 'inline-block';
    });
    
    signupBtnElements.forEach(btn => {
      const button = btn.closest('button');
      if (button) button.style.display = 'inline-block';
    });
    
    // Remove logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.remove();
    
    // Hide user display
    const userDisplay = document.getElementById('user-display');
    if (userDisplay) {
      userDisplay.style.display = 'none';
    }
  }
}

function createLogoutButton() {
  // Check if logout button already exists
  if (document.getElementById('logout-btn')) {
    return;
  }
  
  // Find a login button to replace
  const loginBtn = document.querySelector('button a[href="Login.html"]');
  if (loginBtn) {
    const button = loginBtn.closest('button');
    if (button) {
      button.id = 'logout-btn';
      button.innerHTML = '<a href="#" id="logout-link">Logout</a>';
      button.style.display = 'inline-block';
      
      const logoutLink = document.getElementById('logout-link');
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const result = await window.authService.logOut();
        if (result.success) {
          window.location.href = 'index.html';
        } else {
          alert('Error logging out: ' + result.error);
        }
      });
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthState);
} else {
  initAuthState();
}

