document.addEventListener('DOMContentLoaded', function() {
    // Get register form if it exists on the page
    const registerForm = document.querySelector('form[action="/register"]');
    
    if (registerForm) {
      registerForm.addEventListener('submit', function(event) {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        // Check if passwords match
        if (password !== confirmPassword) {
          event.preventDefault();
          alert('Mật khẩu không khớp. Vui lòng thử lại!');
        }
        
        // Password strength validation
        if (password.length < 6) {
          event.preventDefault();
          alert('Mật khẩu phải có ít nhất 6 ký tự');
        }
      });
    }
    
    // Initialize tooltips and popovers
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Add active class to current navbar item
    const currentLocation = location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentLocation) {
        link.classList.add('active');
      }
    });
  });
  
  // Show password toggle function
  function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
    } else {
      passwordInput.type = 'password';
    }
  }