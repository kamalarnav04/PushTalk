/**
 * Authentication JavaScript - Login and Signup Management
 * Handles user registration, login, and local storage
 */

class AuthManager {
    constructor() {
        this.elements = {
            loginForm: document.getElementById('loginForm'),
            signupForm: document.getElementById('signupForm'),
            loginFormElement: document.getElementById('loginFormElement'),
            signupFormElement: document.getElementById('signupFormElement'),
            showSignup: document.getElementById('showSignup'),
            showLogin: document.getElementById('showLogin'),
            loginMessage: document.getElementById('loginMessage'),
            signupMessage: document.getElementById('signupMessage')
        };
    }

    /**
     * Initialize the authentication manager
     */
    async init() {
        console.log('🔐 Initializing Authentication Manager...');
        
        // Check if user is already logged in
        this.checkExistingAuth();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('✅ Authentication Manager initialized');
    }

    /**
     * Check if user is already authenticated
     */
    checkExistingAuth() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const userData = JSON.parse(currentUser);
                console.log('🔑 User already logged in:', userData.username);
                
                // Redirect to landing page
                window.location.href = 'landing.html';
                return;
            } catch (error) {
                console.log('⚠️ Invalid user data, clearing storage');
                localStorage.removeItem('currentUser');
            }
        }
    }

    /**
     * Set up event listeners for forms and switches
     */
    setupEventListeners() {
        // Form submissions
        this.elements.loginFormElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        this.elements.signupFormElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Form switching
        this.elements.showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignupForm();
        });

        this.elements.showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
    }

    /**
     * Handle user login
     */
    handleLogin() {
        console.log('🔍 Login attempt...');
        
        const formData = new FormData(this.elements.loginFormElement);
        const email = formData.get('loginEmail').trim().toLowerCase();
        const password = formData.get('loginPassword').trim();
        
        // Validate input
        if (!email || !password) {
            this.showMessage('loginMessage', 'Please fill in all fields.', 'error');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showMessage('loginMessage', 'Please enter a valid email address.', 'error');
            return;
        }
        
        // Set loading state
        this.setFormLoading('loginFormElement', true);
        this.hideMessage('loginMessage');
        
        // Get users from localStorage
        const users = this.getStoredUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        setTimeout(() => {
            if (user) {
                this.showMessage('loginMessage', `Welcome back, ${user.username}!`, 'success');
                
                // Store current user session
                const currentUser = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Redirect to landing page
                setTimeout(() => {
                    window.location.href = 'landing.html';
                }, 1500);
                
            } else {
                this.showMessage('loginMessage', 'Invalid email or password. Please try again.', 'error');
                this.setFormLoading('loginFormElement', false);
            }
        }, 1000); // Simulate network delay
    }

    /**
     * Handle user signup
     */
    handleSignup() {
        console.log('🔍 Signup attempt...');
        
        const formData = new FormData(this.elements.signupFormElement);
        const username = formData.get('signupUsername').trim();
        const email = formData.get('signupEmail').trim().toLowerCase();
        const password = formData.get('signupPassword').trim();
        const confirmPassword = formData.get('signupConfirmPassword').trim();
        
        // Validate input
        if (!username || !email || !password || !confirmPassword) {
            this.showMessage('signupMessage', 'Please fill in all fields.', 'error');
            return;
        }
        
        if (username.length < 2) {
            this.showMessage('signupMessage', 'Username must be at least 2 characters long.', 'error');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showMessage('signupMessage', 'Please enter a valid email address.', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('signupMessage', 'Password must be at least 6 characters long.', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('signupMessage', 'Passwords do not match.', 'error');
            return;
        }
        
        // Set loading state
        this.setFormLoading('signupFormElement', true);
        this.hideMessage('signupMessage');
        
        // Check if user already exists
        const users = this.getStoredUsers();
        const existingUser = users.find(u => u.email === email || u.username.toLowerCase() === username.toLowerCase());
        
        setTimeout(() => {
            if (existingUser) {
                if (existingUser.email === email) {
                    this.showMessage('signupMessage', 'An account with this email already exists.', 'error');
                } else {
                    this.showMessage('signupMessage', 'This username is already taken.', 'error');
                }
                this.setFormLoading('signupFormElement', false);
                return;
            }
            
            // Create new user
            const newUser = {
                id: Date.now().toString(),
                username: username,
                email: email,
                password: password,
                createdAt: new Date().toISOString()
            };
            
            // Store user
            users.push(newUser);
            localStorage.setItem('pushtalkUsers', JSON.stringify(users));
            
            this.showMessage('signupMessage', `Account created successfully! Welcome, ${username}!`, 'success');
            
            // Store current user session
            const currentUser = {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Redirect to landing page
            setTimeout(() => {
                window.location.href = 'landing.html';
            }, 2000);
            
        }, 1000); // Simulate network delay
    }

    /**
     * Get stored users from localStorage
     */
    getStoredUsers() {
        try {
            const users = localStorage.getItem('pushtalkUsers');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Error parsing stored users:', error);
            return [];
        }
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Show signup form and hide login form
     */
    showSignupForm() {
        this.elements.loginForm.classList.add('hidden');
        this.elements.signupForm.classList.remove('hidden');
        this.hideMessage('loginMessage');
        this.hideMessage('signupMessage');
        this.clearForms();
    }

    /**
     * Show login form and hide signup form
     */
    showLoginForm() {
        this.elements.signupForm.classList.add('hidden');
        this.elements.loginForm.classList.remove('hidden');
        this.hideMessage('loginMessage');
        this.hideMessage('signupMessage');
        this.clearForms();
    }

    /**
     * Clear form data
     */
    clearForms() {
        this.elements.loginFormElement.reset();
        this.elements.signupFormElement.reset();
        this.setFormLoading('loginFormElement', false);
        this.setFormLoading('signupFormElement', false);
    }

    /**
     * Show message to user
     */
    showMessage(elementId, message, type = 'info') {
        const messageElement = this.elements[elementId];
        if (!messageElement) return;
        
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.classList.remove('hidden');
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage(elementId);
            }, 3000);
        }
    }

    /**
     * Hide message
     */
    hideMessage(elementId) {
        const messageElement = this.elements[elementId];
        if (!messageElement) return;
        
        messageElement.classList.add('hidden');
    }

    /**
     * Set form loading state
     */
    setFormLoading(formId, loading) {
        const form = document.getElementById(formId);
        const submitBtn = form.querySelector('button[type="submit"]');
        const inputs = form.querySelectorAll('input');
        
        if (loading) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            inputs.forEach(input => input.disabled = true);
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            inputs.forEach(input => input.disabled = false);
        }
    }
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the authentication manager
    window.authManager = new AuthManager();
    authManager.init();
});
