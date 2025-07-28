class AuthManager {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = null;
        this.defaultSessionTimeout = 24 * 60 * 60 * 1000; // 24 hours default
        this.maxLoginAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
        
        this.init();
    }

    init() {
        this.initElements();
        this.bindEvents();
        this.checkExistingSession();
        this.initDefaultUsers();
    }

    initElements() {
        this.loginForm = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.rememberMeCheckbox = document.getElementById('rememberMe');
        this.sessionDurationSelect = document.getElementById('sessionDuration');
        this.loginButton = document.getElementById('loginButton');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.buttonText = document.getElementById('buttonText');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');

        this.forgotPasswordBtn = document.getElementById('forgotPassword');
        this.helpLink = document.getElementById('helpLink');
    }

    bindEvents() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.forgotPasswordBtn.addEventListener('click', (e) => this.handleForgotPassword(e));
        this.helpLink.addEventListener('click', (e) => this.handleHelp(e));
        
        // Session duration change handler
        if (this.sessionDurationSelect) {
            this.sessionDurationSelect.addEventListener('change', () => this.updateSessionInfo());
        }


        
        // Enter key support
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.passwordInput.focus();
        });
        
        this.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loginForm.dispatchEvent(new Event('submit'));
        });

        // Clear error on input
        this.usernameInput.addEventListener('input', () => this.clearError());
        this.passwordInput.addEventListener('input', () => this.clearError());
        
        // Update session duration options when username changes
        this.usernameInput.addEventListener('input', () => this.updateSessionDurationOptions());
    }

    initDefaultUsers() {
        // Initialize default users if none exist
        if (Object.keys(this.users).length === 0) {
            console.log('Creating default users...');
            this.users = {
                'admin': {
                    password: 'admin123',
                    email: 'admin@godforever.ai',
                    role: 'administrator',
                    createdAt: new Date().toISOString(),
                    lastLogin: null,
                    apiAccess: true,
                    permissions: ['full_access', 'api_management', 'user_management'],
                    sessionDurations: {
                        '15min': 15 * 60 * 1000,
                        '1hour': 60 * 60 * 1000,
                        '8hours': 8 * 60 * 60 * 1000,
                        '24hours': 24 * 60 * 60 * 1000,
                        '7days': 7 * 24 * 60 * 60 * 1000,
                        '30days': 30 * 24 * 60 * 60 * 1000
                    },
                    defaultSessionDuration: '24hours',
                    maxSessionDuration: '30days'
                },
                'demo': {
                    password: 'demo123',
                    email: 'demo@godforever.ai',
                    role: 'user',
                    createdAt: new Date().toISOString(),
                    lastLogin: null,
                    apiAccess: true,
                    permissions: ['chat_access'],
                    sessionDurations: {
                        '15min': 15 * 60 * 1000,
                        '1hour': 60 * 60 * 1000,
                        '8hours': 8 * 60 * 60 * 1000,
                        '24hours': 24 * 60 * 60 * 1000
                    },
                    defaultSessionDuration: '8hours',
                    maxSessionDuration: '24hours'
                },
                'guest': {
                    password: 'guest123',
                    email: 'guest@godforever.ai',
                    role: 'guest',
                    createdAt: new Date().toISOString(),
                    lastLogin: null,
                    apiAccess: false,
                    permissions: ['limited_chat'],
                    sessionDurations: {
                        '15min': 15 * 60 * 1000,
                        '1hour': 60 * 60 * 1000,
                        '4hours': 4 * 60 * 60 * 1000
                    },
                    defaultSessionDuration: '1hour',
                    maxSessionDuration: '4hours'
                }
            };
            this.saveUsers();
            console.log('Default users created:', Object.keys(this.users));
        }
    }

    updateSessionDurationOptions() {
        if (!this.sessionDurationSelect) return;
        
        const username = this.usernameInput.value.trim();
        const user = this.users[username];
        
        // Clear existing options
        this.sessionDurationSelect.innerHTML = '';
        
        if (user && user.sessionDurations) {
            Object.entries(user.sessionDurations).forEach(([key, duration]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = this.formatDuration(duration);
                if (key === user.defaultSessionDuration) {
                    option.selected = true;
                }
                this.sessionDurationSelect.appendChild(option);
            });
        } else {
            // Default options for unknown users
            const defaultOptions = {
                '15min': '15 minutes',
                '1hour': '1 hour',
                '8hours': '8 hours',
                '24hours': '24 hours'
            };
            
            Object.entries(defaultOptions).forEach(([key, label]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = label;
                if (key === '8hours') option.selected = true;
                this.sessionDurationSelect.appendChild(option);
            });
        }
        
        this.updateSessionInfo();
    }

    updateSessionInfo() {
        const sessionInfo = document.getElementById('sessionInfo');
        if (sessionInfo && this.sessionDurationSelect) {
            const selectedDuration = this.sessionDurationSelect.value;
            const username = this.usernameInput.value.trim();
            const user = this.users[username];
            
            if (user && user.sessionDurations && user.sessionDurations[selectedDuration]) {
                const duration = user.sessionDurations[selectedDuration];
                const expiryTime = new Date(Date.now() + duration);
                sessionInfo.textContent = `Session will expire: ${expiryTime.toLocaleString()}`;
                sessionInfo.style.color = '#10a37f';
            } else {
                sessionInfo.textContent = 'Select user to see session options';
                sessionInfo.style.color = '#888';
            }
        }
    }

    formatDuration(milliseconds) {
        const minutes = Math.floor(milliseconds / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;
        const rememberMe = this.rememberMeCheckbox.checked;
        const selectedDuration = this.sessionDurationSelect ? this.sessionDurationSelect.value : null;

        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        // Check if user is locked out
        if (this.isUserLockedOut(username)) {
            const lockoutEnd = this.getLockoutEndTime(username);
            const remainingTime = Math.ceil((lockoutEnd - Date.now()) / 1000 / 60);
            this.showError(`Account locked. Try again in ${remainingTime} minutes.`);
            return;
        }

        this.setLoading(true);

        try {
            // Simulate network delay for better UX
            await this.delay(1000);

            const loginResult = this.authenticateUser(username, password);

            if (loginResult.success) {
                this.clearLoginAttempts(username);
                
                // Check if there was a forced logout
                if (loginResult.forcedLogout) {
                    this.showSuccess(`Logged out ${loginResult.terminatedSessions} existing session(s). Logging you in...`);
                    await this.delay(1500);
                }
                
                this.createSession(loginResult.user, rememberMe, selectedDuration);
                this.showSuccess('Login successful! Redirecting...');
                
                await this.delay(1000);
                this.redirectToApp();
            } else {
                this.recordFailedAttempt(username);
                this.showError(loginResult.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }

    authenticateUser(username, password) {
        // Ensure users object exists
        if (!this.users || typeof this.users !== 'object') {
            this.users = this.loadUsers();
            this.initDefaultUsers();
        }
        
        const user = this.users[username];
        
        if (!user) {
            return {
                success: false,
                message: 'Invalid username or password'
            };
        }

        if (user.password !== password) {
            return {
                success: false,
                message: 'Invalid username or password'
            };
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        this.saveUsers();

        return {
            success: true,
            user: {
                username,
                ...user
            }
        };
    }

    createSession(user, rememberMe, selectedDuration = null) {
        // Determine session duration
        let sessionTimeout = this.defaultSessionTimeout;
        
        if (selectedDuration && user.sessionDurations && user.sessionDurations[selectedDuration]) {
            sessionTimeout = user.sessionDurations[selectedDuration];
        } else if (user.sessionDurations && user.defaultSessionDuration) {
            sessionTimeout = user.sessionDurations[user.defaultSessionDuration];
        }

        const session = {
            user: {
                username: user.username,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                apiAccess: user.apiAccess,
                sessionDurations: user.sessionDurations,
                maxSessionDuration: user.maxSessionDuration
            },
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + sessionTimeout).toISOString(),
            sessionDuration: sessionTimeout,
            selectedDuration: selectedDuration || user.defaultSessionDuration,
            rememberMe: rememberMe
        };

        // Store session
        if (rememberMe) {
            localStorage.setItem('godforever_session', JSON.stringify(session));
        } else {
            sessionStorage.setItem('godforever_session', JSON.stringify(session));
        }

        // Set session cookie for additional security
        this.setSessionCookie(session);
        
        // Log session creation
        console.log(`🔐 Session created for ${user.username}:`, {
            duration: this.formatDuration(sessionTimeout),
            expires: new Date(session.expiresAt).toLocaleString(),
            rememberMe: rememberMe
        });
    }

    setSessionCookie(session) {
        const expiryDate = new Date(session.expiresAt);
        document.cookie = `gf_session=${session.user.username}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
    }

    checkExistingSession() {
        const session = this.getStoredSession();
        
        if (session && this.isSessionValid(session)) {
            this.currentUser = session.user;
            this.redirectToApp();
        } else if (session) {
            // Clear invalid session
            this.clearSession();
        }
    }

    getStoredSession() {
        const localSession = localStorage.getItem('godforever_session');
        const sessionSession = sessionStorage.getItem('godforever_session');
        
        if (localSession) {
            return JSON.parse(localSession);
        } else if (sessionSession) {
            return JSON.parse(sessionSession);
        }
        
        return null;
    }

    isSessionValid(session) {
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        return now < expiresAt;
    }

    clearSession() {
        localStorage.removeItem('godforever_session');
        sessionStorage.removeItem('godforever_session');
        document.cookie = 'gf_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    redirectToApp() {
        // Add a small delay for better UX
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }



    handleForgotPassword(e) {
        e.preventDefault();
        
        const modal = this.createModal(
            'Password Recovery',
            `
            <p>For demo purposes, here are the available accounts:</p>
            <div style="margin: 15px 0; padding: 15px; background: rgba(16, 163, 127, 0.1); border-radius: 8px; border: 1px solid #10a37f;">
                <strong>Administrator:</strong><br>
                Username: <code>admin</code><br>
                Password: <code>admin123</code>
            </div>
            <div style="margin: 15px 0; padding: 15px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid #3b82f6;">
                <strong>Demo User:</strong><br>
                Username: <code>demo</code><br>
                Password: <code>demo123</code>
            </div>
            <div style="margin: 15px 0; padding: 15px; background: rgba(156, 163, 175, 0.1); border-radius: 8px; border: 1px solid #9ca3af;">
                <strong>Guest (Limited Access):</strong><br>
                Username: <code>guest</code><br>
                Password: <code>guest123</code>
            </div>
            <p style="color: #888; font-size: 12px; margin-top: 15px;">
                In a production environment, this would send a password reset email.
            </p>
            `
        );
        
        document.body.appendChild(modal);
    }

    handleHelp(e) {
        e.preventDefault();
        
        const modal = this.createModal(
            'Help & Support',
            `
            <div style="text-align: left;">
                <h4 style="color: #10a37f; margin-bottom: 10px;">Getting Started</h4>
                <ul style="margin-left: 20px; margin-bottom: 15px;">
                    <li>Use the demo credentials to try the application</li>
                    <li>Admin account has full access to all features</li>
                    <li>Demo account has standard user access</li>
                    <li>Guest account has limited functionality</li>
                </ul>
                
                <h4 style="color: #10a37f; margin-bottom: 10px;">Features by Role</h4>
                <div style="margin-bottom: 15px;">
                    <strong>Administrator:</strong> Full API access, user management, all models<br>
                    <strong>User:</strong> Full chat access, most models<br>
                    <strong>Guest:</strong> Limited chat access, basic models only
                </div>
                
                <h4 style="color: #10a37f; margin-bottom: 10px;">Troubleshooting</h4>
                <ul style="margin-left: 20px;">
                    <li>Clear browser cache if you experience issues</li>
                    <li>Make sure JavaScript is enabled</li>
                    <li>Check that your API keys are correctly configured</li>
                </ul>
            </div>
            `
        );
        
        document.body.appendChild(modal);
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div style="
                background: #1a1a1a;
                border: 1px solid #404040;
                border-radius: 16px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
                animation: modalSlideIn 0.3s ease-out;
            ">
                <h3 style="color: #fff; margin-bottom: 20px; padding-right: 30px;">${title}</h3>
                <div style="color: #ccc; line-height: 1.6;">
                    ${content}
                </div>
                <button onclick="this.closest('div').parentNode.remove()" style="
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: none;
                    border: none;
                    color: #888;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 4px;
                    transition: color 0.2s ease;
                " onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#888'">×</button>
                <button onclick="this.closest('div').parentNode.remove()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #10a37f;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Close</button>
            </div>
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;
        document.head.appendChild(style);

        return modal;
    }

    // Login attempt tracking for security
    recordFailedAttempt(username) {
        const attempts = this.getLoginAttempts();
        const now = Date.now();
        
        if (!attempts[username]) {
            attempts[username] = [];
        }
        
        attempts[username].push(now);
        
        // Keep only recent attempts (within lockout time)
        attempts[username] = attempts[username].filter(time => 
            now - time < this.lockoutTime
        );
        
        localStorage.setItem('login_attempts', JSON.stringify(attempts));
    }

    getLoginAttempts() {
        const stored = localStorage.getItem('login_attempts');
        return stored ? JSON.parse(stored) : {};
    }

    clearLoginAttempts(username) {
        const attempts = this.getLoginAttempts();
        delete attempts[username];
        localStorage.setItem('login_attempts', JSON.stringify(attempts));
    }

    isUserLockedOut(username) {
        const attempts = this.getLoginAttempts();
        const userAttempts = attempts[username] || [];
        return userAttempts.length >= this.maxLoginAttempts;
    }

    getLockoutEndTime(username) {
        const attempts = this.getLoginAttempts();
        const userAttempts = attempts[username] || [];
        if (userAttempts.length === 0) return 0;
        
        const lastAttempt = Math.max(...userAttempts);
        return lastAttempt + this.lockoutTime;
    }

    // User management
    loadUsers() {
        const stored = localStorage.getItem('godforever_users');
        return stored ? JSON.parse(stored) : {};
    }

    saveUsers() {
        localStorage.setItem('godforever_users', JSON.stringify(this.users));
    }

    // UI helper methods
    setLoading(isLoading) {
        if (isLoading) {
            this.loginButton.disabled = true;
            this.loadingSpinner.style.display = 'inline-block';
            this.buttonText.textContent = 'Signing In...';
        } else {
            this.loginButton.disabled = false;
            this.loadingSpinner.style.display = 'none';
            this.buttonText.textContent = 'Sign In';
        }
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.clearError();
        }, 5000);
    }

    clearError() {
        this.errorMessage.style.display = 'none';
    }

    showSuccess(message) {
        // Create success message similar to error
        const successEl = document.createElement('div');
        successEl.style.cssText = `
            background: rgba(16, 163, 127, 0.1);
            border: 1px solid #10a37f;
            color: #10a37f;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        `;
        successEl.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        this.errorMessage.parentNode.insertBefore(successEl, this.errorMessage);
        
        setTimeout(() => {
            successEl.remove();
        }, 3000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Session conflict handling methods
    handleSessionConflict(loginResult) {
        const { conflictData } = loginResult;
        const sessionCount = conflictData.existingSessions.length;
        const sessionText = sessionCount === 1 ? 'session' : 'sessions';
        
        const modal = this.createModal(
            '🔒 Account Already In Use',
            `
            <div style="text-align: left;">
                <p style="margin-bottom: 15px; color: #ff6b6b;">
                    <strong>User "${conflictData.username}" is already logged in.</strong>
                </p>
                
                <p style="margin-bottom: 20px; color: #ccc;">
                    This account has <strong>${sessionCount} active ${sessionText}</strong> from other locations:
                </p>
                
                <div style="background: #2a2a2a; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    ${conflictData.existingSessions.map(session => `
                        <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #404040;">
                            <div style="color: #10a37f; font-weight: 500;">${session.browserInfo}</div>
                            <div style="font-size: 12px; color: #888;">
                                Login: ${new Date(session.loginTime).toLocaleString()}<br>
                                Expires: ${session.timeRemaining} remaining
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="background: rgba(255, 107, 107, 0.1); border: 1px solid #ff6b6b; border-radius: 6px; padding: 12px; margin-bottom: 20px;">
                    <div style="color: #ff6b6b; font-size: 14px; font-weight: 500;">
                        🔒 Access Denied
                    </div>
                    <div style="color: #ccc; font-size: 12px; margin-top: 5px;">
                        Only one login per account is allowed for security reasons.
                    </div>
                </div>
                
                <p style="color: #888; font-size: 12px;">
                    To login, please logout from other locations first or contact an administrator.
                </p>
            </div>
            `
        );
        
        document.body.appendChild(modal);
    }

    showConflictChoiceModal(loginResult) {
        const { conflictData } = loginResult;
        const sessionCount = conflictData.existingSessions.length;
        const sessionText = sessionCount === 1 ? 'session' : 'sessions';
        
        const modal = this.createModal(
            '⚠️ Account Conflict Resolution',
            `
            <div style="text-align: left;">
                <p style="margin-bottom: 15px; color: #f59e0b;">
                    <strong>User "${conflictData.username}" is already logged in.</strong>
                </p>
                
                <p style="margin-bottom: 20px; color: #ccc;">
                    This account has <strong>${sessionCount} active ${sessionText}</strong>:
                </p>
                
                <div style="background: #2a2a2a; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                    ${conflictData.existingSessions.map(session => `
                        <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #404040;">
                            <div style="color: #10a37f; font-weight: 500;">${session.browserInfo}</div>
                            <div style="font-size: 12px; color: #888;">
                                Login: ${new Date(session.loginTime).toLocaleString()}<br>
                                Last Activity: ${new Date(session.lastActivity).toLocaleString()}<br>
                                Expires: ${session.timeRemaining} remaining
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <p style="margin-bottom: 20px; color: #ccc; font-size: 14px;">
                    How would you like to proceed?
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button onclick="authManager.resolveConflictChoice('force')" style="
                        padding: 12px 20px;
                        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                        <i class="fas fa-sign-out-alt"></i> Logout Other Sessions & Continue
                    </button>
                    
                    <button onclick="authManager.resolveConflictChoice('cancel')" style="
                        padding: 12px 20px;
                        background: rgba(156, 163, 175, 0.2);
                        color: #9ca3af;
                        border: 1px solid #9ca3af;
                        border-radius: 8px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.background='rgba(156, 163, 175, 0.3)'" onmouseout="this.style.background='rgba(156, 163, 175, 0.2)'">
                        <i class="fas fa-times"></i> Cancel Login
                    </button>
                </div>
                
                <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; border-radius: 6px; padding: 12px; margin-top: 20px;">
                    <div style="color: #3b82f6; font-size: 12px;">
                        <strong>⚠️ Security Warning:</strong> Logging out other sessions will terminate their access immediately.
                    </div>
                </div>
            </div>
            `,
            false // Don't add default close button
        );
        
        document.body.appendChild(modal);
    }

    async resolveConflictChoice(action) {
        // Close the conflict modal
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        
        if (action === 'cancel') {
            this.showError('Login cancelled by user.');
            return;
        }
        
        if (action === 'force') {
            // Get the pending conflict data and resolve it
            if (window.exclusiveLoginManager && window.exclusiveLoginManager.pendingConflict) {
                this.setLoading(true);
                
                const resolution = window.exclusiveLoginManager.resolveConflict('force');
                
                if (resolution.success) {
                    this.showSuccess(`Logged out ${resolution.terminatedSessions} existing session(s). Logging you in...`);
                    await this.delay(1500);
                    
                    // Get form data to proceed with login
                    const username = this.usernameInput.value.trim();
                    const rememberMe = this.rememberMeCheckbox.checked;
                    const selectedDuration = this.sessionDurationSelect ? this.sessionDurationSelect.value : null;
                    
                    this.createSession(resolution.user, rememberMe, selectedDuration);
                    this.showSuccess('Login successful! Redirecting...');
                    
                    await this.delay(1000);
                    this.redirectToApp();
                } else {
                    this.showError('Failed to resolve session conflict.');
                    this.setLoading(false);
                }
            }
        }
    }

    createModal(title, content, showCloseButton = true) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div style="
                background: #1a1a1a;
                border: 1px solid #404040;
                border-radius: 16px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
                animation: modalSlideIn 0.3s ease-out;
            ">
                <h3 style="color: #fff; margin-bottom: 20px; ${showCloseButton ? 'padding-right: 30px;' : ''}">${title}</h3>
                <div style="color: #ccc; line-height: 1.6;">
                    ${content}
                </div>
                ${showCloseButton ? `
                    <button onclick="this.closest('.modal-overlay').remove()" style="
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: none;
                        border: none;
                        color: #888;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 5px;
                        border-radius: 4px;
                        transition: color 0.2s ease;
                    " onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#888'">×</button>
                ` : ''}
            </div>
        `;

        return modal;
    }


}

// Static method to check authentication for other pages
AuthManager.checkAuth = function() {
    const session = AuthManager.getStoredSession();
    
    if (!session || !AuthManager.isSessionValid(session)) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return null;
    }
    
    return session.user;
};

AuthManager.getStoredSession = function() {
    const localSession = localStorage.getItem('godforever_session');
    const sessionSession = sessionStorage.getItem('godforever_session');
    
    if (localSession) {
        return JSON.parse(localSession);
    } else if (sessionSession) {
        return JSON.parse(sessionSession);
    }
    
    return null;
};

AuthManager.isSessionValid = function(session) {
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    return now < expiresAt;
};

AuthManager.logout = function() {
    localStorage.removeItem('godforever_session');
    sessionStorage.removeItem('godforever_session');
    document.cookie = 'gf_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = 'login.html';
};

AuthManager.getCurrentUser = function() {
    const session = AuthManager.getStoredSession();
    return session && AuthManager.isSessionValid(session) ? session.user : null;
};

// Initialize auth manager when on login page
if (window.location.pathname.includes('login.html') || window.location.pathname === '/login.html') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authManager = new AuthManager();
    });
} 