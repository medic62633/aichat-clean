class UserManager {
    constructor() {
        this.currentUser = AuthManager.checkAuth();
        this.users = this.loadUsers();
        this.editingUser = null;
        
        // Check if user has admin permissions
        if (!this.currentUser || !this.currentUser.permissions.includes('user_management')) {
            alert('Access denied. Administrator permissions required.');
            window.location.href = 'index.html';
            return;
        }
        
        this.init();
    }

    init() {
        this.initElements();
        this.bindEvents();
        this.loadStats();
        this.populateUserTable();
        this.populateUniversalTable();
        this.initDurationOptions();
    }

    initElements() {
        this.addUserBtn = document.getElementById('addUserBtn');
        this.refreshUsersBtn = document.getElementById('refreshUsers');
        this.userModal = document.getElementById('userModal');
        this.closeModalBtn = document.getElementById('closeModal');
        this.userForm = document.getElementById('userForm');
        this.modalTitle = document.getElementById('modalTitle');
        this.usersTableBody = document.getElementById('usersTableBody');
        
        // Form elements
        this.usernameInput = document.getElementById('username');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.roleSelect = document.getElementById('role');
        this.defaultDurationSelect = document.getElementById('defaultDuration');
        this.maxDurationSelect = document.getElementById('maxDuration');
        this.durationOptionsGrid = document.getElementById('durationOptions');
        
        // Stats elements
        this.totalUsersEl = document.getElementById('totalUsers');
        this.adminUsersEl = document.getElementById('adminUsers');
        this.activeSessionsEl = document.getElementById('activeSessions');
        this.multiSessionsEl = document.getElementById('multiSessions');
        this.lockedAccountsEl = document.getElementById('lockedAccounts');
        
        // Session management elements
        this.refreshSessionsBtn = document.getElementById('refreshSessions');
        this.sessionsTableBody = document.getElementById('sessionsTableBody');
        
        // Universal account elements
        this.addUniversalBtn = document.getElementById('addUniversalBtn');
        this.refreshUniversalBtn = document.getElementById('refreshUniversal');
        this.universalTableBody = document.getElementById('universalTableBody');
        this.universalModal = document.getElementById('universalModal');
        this.closeUniversalModalBtn = document.getElementById('closeUniversalModal');
        this.universalForm = document.getElementById('universalForm');
        this.universalModalTitle = document.getElementById('universalModalTitle');
        
        // Bulk generate elements
        this.bulkGenerateBtn = document.getElementById('bulkGenerateBtn');
        this.bulkGenerateModal = document.getElementById('bulkGenerateModal');
        this.closeBulkGenerateModalBtn = document.getElementById('closeBulkGenerateModal');
        this.previewBulkBtn = document.getElementById('previewBulkBtn');
        this.generateBulkBtn = document.getElementById('generateBulkBtn');
        this.bulkTypeSelect = document.getElementById('bulkType');
        this.bulkUniversalOptions = document.getElementById('bulkUniversalOptions');
        
        // Security settings elements
        this.securitySettingsBtn = document.getElementById('securitySettingsBtn');
        this.securityModal = document.getElementById('securityModal');
        this.closeSecurityModalBtn = document.getElementById('closeSecurityModal');
        this.saveSecuritySettingsBtn = document.getElementById('saveSecuritySettings');
        this.forceLogoutAllBtn = document.getElementById('forceLogoutAll');
        this.conflictStatsEl = document.getElementById('conflictStats');
    }

    bindEvents() {
        this.addUserBtn.addEventListener('click', () => this.openAddUserModal());
        this.refreshUsersBtn.addEventListener('click', () => this.refreshData());
        this.refreshSessionsBtn.addEventListener('click', () => this.refreshSessionData());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.userForm.addEventListener('submit', (e) => this.handleUserSubmit(e));
        
        // Universal account events
        this.addUniversalBtn.addEventListener('click', () => this.openUniversalModal());
        this.refreshUniversalBtn.addEventListener('click', () => this.populateUniversalTable());
        this.closeUniversalModalBtn.addEventListener('click', () => this.closeUniversalModal());
        this.universalForm.addEventListener('submit', (e) => this.handleUniversalSubmit(e));

        // Credential generation events - Regular users
        document.getElementById('generateUsername')?.addEventListener('click', () => this.generateUsername());
        document.getElementById('generateEmail')?.addEventListener('click', () => this.generateEmail());
        document.getElementById('generatePassword')?.addEventListener('click', () => this.generatePassword());
        document.getElementById('showPassword')?.addEventListener('click', () => this.togglePasswordVisibility('password'));
        document.getElementById('generateAllCredentials')?.addEventListener('click', () => this.generateAllCredentials());

        // Credential generation events - Universal users
        document.getElementById('generateUniversalUsername')?.addEventListener('click', () => this.generateUniversalUsername());
        document.getElementById('generateUniversalEmail')?.addEventListener('click', () => this.generateUniversalEmail());
        document.getElementById('generateUniversalPassword')?.addEventListener('click', () => this.generateUniversalPassword());
        document.getElementById('showUniversalPassword')?.addEventListener('click', () => this.togglePasswordVisibility('universalPassword'));
        document.getElementById('generateAllUniversalCredentials')?.addEventListener('click', () => this.generateAllUniversalCredentials());

        // Password strength checking
        document.getElementById('password')?.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value, 'passwordStrength'));
        document.getElementById('universalPassword')?.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value, 'universalPasswordStrength'));

        // Bulk generate events
        this.bulkGenerateBtn.addEventListener('click', () => this.openBulkGenerateModal());
        this.closeBulkGenerateModalBtn.addEventListener('click', () => this.closeBulkGenerateModal());
        this.previewBulkBtn.addEventListener('click', () => this.previewBulkCredentials());
        this.generateBulkBtn.addEventListener('click', () => this.generateBulkCredentials());
        this.bulkTypeSelect.addEventListener('change', () => this.toggleBulkUniversalOptions());
        
        // Close modal when clicking outside
        this.userModal.addEventListener('click', (e) => {
            if (e.target === this.userModal) {
                this.closeModal();
            }
        });
        
        // Close universal modal when clicking outside
        this.universalModal.addEventListener('click', (e) => {
            if (e.target === this.universalModal) {
                this.closeUniversalModal();
            }
        });
        
        // Update duration options when role changes
        this.roleSelect.addEventListener('change', () => this.updateDurationOptionsForRole());
        
        // Security settings events
        this.securitySettingsBtn.addEventListener('click', () => this.openSecuritySettings());
        this.closeSecurityModalBtn.addEventListener('click', () => this.closeSecuritySettings());
        this.saveSecuritySettingsBtn.addEventListener('click', () => this.saveSecuritySettings());
        this.forceLogoutAllBtn.addEventListener('click', () => this.forceLogoutAllDuplicates());
        
        // Close security modal when clicking outside
        this.securityModal.addEventListener('click', (e) => {
            if (e.target === this.securityModal) {
                this.closeSecuritySettings();
            }
        });

        // Close bulk generate modal when clicking outside
        this.bulkGenerateModal.addEventListener('click', (e) => {
            if (e.target === this.bulkGenerateModal) {
                this.closeBulkGenerateModal();
            }
        });
        
        // Auto-refresh sessions every 30 seconds
        setInterval(() => {
            this.refreshSessionData();
        }, 30000);
    }

    loadUsers() {
        const stored = localStorage.getItem('godforever_users');
        return stored ? JSON.parse(stored) : {};
    }

    saveUsers() {
        localStorage.setItem('godforever_users', JSON.stringify(this.users));
    }

    loadStats() {
        const users = Object.values(this.users);
        const adminUsers = users.filter(user => user.role === 'administrator');
        const activeSessions = this.getActiveSessions();
        const lockedAccounts = this.getLockedAccounts();
        
        // Multi-session statistics
        const multiSessionStats = this.getMultiSessionStats();
        
        this.totalUsersEl.textContent = users.length;
        this.adminUsersEl.textContent = adminUsers.length;
        this.activeSessionsEl.textContent = activeSessions.length;
        this.multiSessionsEl.textContent = multiSessionStats.concurrentUsers;
        this.lockedAccountsEl.textContent = lockedAccounts.length;
        
        // Update sessions table
        this.populateSessionsTable(activeSessions);
    }

    getActiveSessions() {
        // Use multi-session manager if available for comprehensive session tracking
        if (window.multiSessionManager) {
            return window.multiSessionManager.getActiveSessions();
        }
        
        // Fallback to original method
        const sessions = [];
        const localSession = localStorage.getItem('godforever_session');
        const sessionSession = sessionStorage.getItem('godforever_session');
        
        if (localSession) {
            const session = JSON.parse(localSession);
            if (this.isSessionValid(session)) {
                sessions.push(session);
            }
        }
        
        if (sessionSession) {
            const session = JSON.parse(sessionSession);
            if (this.isSessionValid(session)) {
                sessions.push(session);
            }
        }
        
        return sessions;
    }

    getLockedAccounts() {
        const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
        const lockedUsers = [];
        
        Object.entries(attempts).forEach(([username, userAttempts]) => {
            if (userAttempts.length >= 5) {
                const lastAttempt = Math.max(...userAttempts);
                const lockoutTime = 15 * 60 * 1000; // 15 minutes
                if (Date.now() - lastAttempt < lockoutTime) {
                    lockedUsers.push(username);
                }
            }
        });
        
        return lockedUsers;
    }

    isSessionValid(session) {
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        return now < expiresAt;
    }

    populateUserTable() {
        this.usersTableBody.innerHTML = '';
        
        Object.entries(this.users).forEach(([username, user]) => {
            const row = this.createUserRow(username, user);
            this.usersTableBody.appendChild(row);
        });
    }

    createUserRow(username, user) {
        const row = document.createElement('tr');
        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';
        const defaultDuration = user.defaultSessionDuration || '8hours';
        const maxDuration = user.maxSessionDuration || '24hours';
        const isLocked = this.getLockedAccounts().includes(username);
        const status = isLocked ? '🔒 Locked' : '✅ Active';
        
        row.innerHTML = `
            <td><strong>${username}</strong></td>
            <td>${user.email}</td>
            <td><span class="role-badge role-${user.role}">${user.role}</span></td>
            <td>
                <div>Default: ${this.formatDuration(user.sessionDurations?.[defaultDuration] || 28800000)}</div>
                <div class="session-duration">Max: ${this.formatDuration(user.sessionDurations?.[maxDuration] || 86400000)}</div>
            </td>
            <td>${lastLogin}</td>
            <td>${status}</td>
            <td class="actions">
                <button class="btn btn-secondary btn-small" onclick="userManager.editUser('${username}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-small" onclick="userManager.deleteUser('${username}')" ${username === this.currentUser.username ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i> Delete
                </button>
                ${isLocked ? `<button class="btn btn-primary btn-small" onclick="userManager.unlockUser('${username}')">
                    <i class="fas fa-unlock"></i> Unlock
                </button>` : ''}
            </td>
        `;
        
        return row;
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

    openAddUserModal() {
        this.editingUser = null;
        this.modalTitle.textContent = 'Add New User';
        this.userForm.reset();
        this.initDurationOptions();
        this.userModal.style.display = 'block';
    }

    editUser(username) {
        this.editingUser = username;
        const user = this.users[username];
        
        this.modalTitle.textContent = `Edit User: ${username}`;
        this.usernameInput.value = username;
        this.usernameInput.disabled = true;
        this.emailInput.value = user.email;
        this.passwordInput.value = user.password;
        this.roleSelect.value = user.role;
        this.defaultDurationSelect.value = user.defaultSessionDuration || '8hours';
        this.maxDurationSelect.value = user.maxSessionDuration || '24hours';
        
        this.initDurationOptions();
        this.updateDurationOptionsForRole();
        
        this.userModal.style.display = 'block';
    }

    deleteUser(username) {
        if (username === this.currentUser.username) {
            alert('You cannot delete your own account.');
            return;
        }
        
        if (confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            delete this.users[username];
            this.saveUsers();
            this.refreshData();
            this.showNotification(`User "${username}" deleted successfully.`, 'success');
        }
    }

    unlockUser(username) {
        const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
        delete attempts[username];
        localStorage.setItem('login_attempts', JSON.stringify(attempts));
        this.refreshData();
        this.showNotification(`User "${username}" unlocked successfully.`, 'success');
    }

    closeModal() {
        this.userModal.style.display = 'none';
        this.usernameInput.disabled = false;
        this.editingUser = null;
    }

    initDurationOptions() {
        const durations = {
            '15min': { label: '15 minutes', value: 15 * 60 * 1000 },
            '1hour': { label: '1 hour', value: 60 * 60 * 1000 },
            '4hours': { label: '4 hours', value: 4 * 60 * 60 * 1000 },
            '8hours': { label: '8 hours', value: 8 * 60 * 60 * 1000 },
            '24hours': { label: '24 hours', value: 24 * 60 * 60 * 1000 },
            '7days': { label: '7 days', value: 7 * 24 * 60 * 60 * 1000 },
            '30days': { label: '30 days', value: 30 * 24 * 60 * 60 * 1000 }
        };
        
        this.durationOptionsGrid.innerHTML = '';
        
        Object.entries(durations).forEach(([key, duration]) => {
            const durationItem = document.createElement('div');
            durationItem.className = 'duration-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `duration_${key}`;
            checkbox.value = key;
            checkbox.checked = true; // Default to all checked
            
            const label = document.createElement('label');
            label.htmlFor = `duration_${key}`;
            label.textContent = duration.label;
            
            durationItem.appendChild(checkbox);
            durationItem.appendChild(label);
            this.durationOptionsGrid.appendChild(durationItem);
        });
    }

    updateDurationOptionsForRole() {
        const role = this.roleSelect.value;
        const checkboxes = this.durationOptionsGrid.querySelectorAll('input[type="checkbox"]');
        
        // Role-based duration restrictions
        const roleRestrictions = {
            'guest': ['15min', '1hour', '4hours'],
            'user': ['15min', '1hour', '4hours', '8hours', '24hours'],
            'administrator': ['15min', '1hour', '4hours', '8hours', '24hours', '7days', '30days']
        };
        
        const allowedDurations = roleRestrictions[role] || roleRestrictions['user'];
        
        checkboxes.forEach(checkbox => {
            const durationKey = checkbox.value;
            const isAllowed = allowedDurations.includes(durationKey);
            
            checkbox.disabled = !isAllowed;
            checkbox.checked = isAllowed;
            
            if (!isAllowed) {
                checkbox.parentElement.style.opacity = '0.5';
            } else {
                checkbox.parentElement.style.opacity = '1';
            }
        });
        
        // Update default and max duration options
        this.updateDurationSelects(allowedDurations);
    }

    updateDurationSelects(allowedDurations) {
        const durationsMap = {
            '15min': '15 minutes',
            '1hour': '1 hour',
            '4hours': '4 hours',
            '8hours': '8 hours',
            '24hours': '24 hours',
            '7days': '7 days',
            '30days': '30 days'
        };
        
        // Update default duration select
        const currentDefaultValue = this.defaultDurationSelect.value;
        this.defaultDurationSelect.innerHTML = '';
        
        allowedDurations.forEach(duration => {
            const option = document.createElement('option');
            option.value = duration;
            option.textContent = durationsMap[duration];
            if (duration === currentDefaultValue || (currentDefaultValue === '' && duration === '8hours')) {
                option.selected = true;
            }
            this.defaultDurationSelect.appendChild(option);
        });
        
        // Update max duration select
        const currentMaxValue = this.maxDurationSelect.value;
        this.maxDurationSelect.innerHTML = '';
        
        allowedDurations.forEach(duration => {
            const option = document.createElement('option');
            option.value = duration;
            option.textContent = durationsMap[duration];
            if (duration === currentMaxValue || (currentMaxValue === '' && duration === '24hours')) {
                option.selected = true;
            }
            this.maxDurationSelect.appendChild(option);
        });
    }

    handleUserSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.userForm);
        const userData = {
            password: formData.get('password'),
            email: formData.get('email'),
            role: formData.get('role'),
            defaultSessionDuration: formData.get('defaultDuration'),
            maxSessionDuration: formData.get('maxDuration'),
            createdAt: this.editingUser ? this.users[this.editingUser].createdAt : new Date().toISOString(),
            lastLogin: this.editingUser ? this.users[this.editingUser].lastLogin : null,
            apiAccess: formData.get('role') !== 'guest',
            permissions: this.getRolePermissions(formData.get('role')),
            sessionDurations: this.getSelectedDurations()
        };
        
        const username = formData.get('username');
        
        // Validation
        if (!username || !userData.password || !userData.email) {
            this.showNotification('Please fill in all required fields.', 'error');
            return;
        }
        
        if (!this.editingUser && this.users[username]) {
            this.showNotification('Username already exists.', 'error');
            return;
        }
        
        // Save user
        this.users[username] = userData;
        this.saveUsers();
        
        this.closeModal();
        this.refreshData();
        
        const action = this.editingUser ? 'updated' : 'created';
        this.showNotification(`User "${username}" ${action} successfully.`, 'success');
    }

    getRolePermissions(role) {
        const permissionsMap = {
            'administrator': ['full_access', 'api_management', 'user_management'],
            'user': ['chat_access'],
            'guest': ['limited_chat']
        };
        
        return permissionsMap[role] || permissionsMap['user'];
    }

    getSelectedDurations() {
        const checkboxes = this.durationOptionsGrid.querySelectorAll('input[type="checkbox"]:checked');
        const durations = {};
        
        const durationsMap = {
            '15min': 15 * 60 * 1000,
            '1hour': 60 * 60 * 1000,
            '4hours': 4 * 60 * 60 * 1000,
            '8hours': 8 * 60 * 60 * 1000,
            '24hours': 24 * 60 * 60 * 1000,
            '7days': 7 * 24 * 60 * 60 * 1000,
            '30days': 30 * 24 * 60 * 60 * 1000
        };
        
        checkboxes.forEach(checkbox => {
            const key = checkbox.value;
            durations[key] = durationsMap[key];
        });
        
        return durations;
    }

    refreshData() {
        this.users = this.loadUsers();
        this.loadStats();
        this.populateUserTable();
    }

    refreshSessionData() {
        this.loadStats();
    }

    getMultiSessionStats() {
        if (window.multiSessionManager) {
            const stats = window.multiSessionManager.getSessionStats();
            return {
                totalSessions: stats.totalSessions,
                concurrentUsers: stats.uniqueUsers,
                userBreakdown: stats.userBreakdown
            };
        }
        
        // Fallback for basic session counting
        const sessions = this.getActiveSessions();
        const uniqueUsers = new Set(sessions.map(s => s.user?.username)).size;
        
        return {
            totalSessions: sessions.length,
            concurrentUsers: uniqueUsers,
            userBreakdown: {}
        };
    }

    populateSessionsTable(sessions) {
        if (!this.sessionsTableBody) return;
        
        this.sessionsTableBody.innerHTML = '';
        
        if (sessions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="7" style="text-align: center; color: #888; padding: 30px;">
                    <i class="fas fa-user-clock" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No active sessions found
                </td>
            `;
            this.sessionsTableBody.appendChild(row);
            return;
        }
        
        sessions.forEach(session => {
            const row = this.createSessionRow(session);
            this.sessionsTableBody.appendChild(row);
        });
    }

    createSessionRow(session) {
        const row = document.createElement('tr');
        
        const loginTime = new Date(session.loginTime || session.user?.lastLogin || Date.now()).toLocaleString();
        const lastActivity = session.lastActivity ? new Date(session.lastActivity).toLocaleString() : 'Unknown';
        const expiresAt = new Date(session.expiresAt);
        const timeRemaining = this.getSessionTimeRemaining(expiresAt);
        const browserInfo = this.getBrowserDisplayName(session.browserInfo);
        
        const username = session.user?.username || 'Unknown';
        const role = session.user?.role || 'unknown';
        const sessionId = session.id || 'legacy';
        
        row.innerHTML = `
            <td><strong>${username}</strong></td>
            <td><span class="role-badge role-${role}">${role}</span></td>
            <td>${loginTime}</td>
            <td>${lastActivity}</td>
            <td class="session-expires ${timeRemaining.class}">${timeRemaining.display}</td>
            <td>${browserInfo}</td>
            <td class="actions">
                ${sessionId !== 'legacy' ? `
                    <button class="btn btn-danger btn-small" onclick="userManager.terminateSession('${sessionId}', '${username}')">
                        <i class="fas fa-times"></i> End
                    </button>
                ` : `
                    <span style="color: #888; font-size: 11px;">Legacy Session</span>
                `}
            </td>
        `;
        
        return row;
    }

    getSessionTimeRemaining(expiresAt) {
        const now = new Date();
        const remaining = expiresAt - now;
        
        if (remaining <= 0) {
            return { display: 'Expired', class: 'expired' };
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        let className = '';
        if (remaining < 30 * 60 * 1000) { // Less than 30 minutes
            className = 'critical';
        } else if (remaining < 2 * 60 * 60 * 1000) { // Less than 2 hours
            className = 'warning';
        }
        
        return {
            display: `${hours}h ${minutes}m`,
            class: className
        };
    }

    getBrowserDisplayName(browserInfo) {
        if (!browserInfo) return 'Unknown Browser';
        
        const userAgent = browserInfo.userAgent || '';
        const platform = browserInfo.platform || '';
        
        let browser = 'Unknown';
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        
        let os = platform;
        if (platform.includes('Win')) os = 'Windows';
        else if (platform.includes('Mac')) os = 'macOS';
        else if (platform.includes('Linux')) os = 'Linux';
        
        return `${browser} (${os})`;
    }

    terminateSession(sessionId, username) {
        const confirmTerminate = confirm(`Are you sure you want to terminate the session for "${username}"? They will be logged out immediately.`);
        
        if (confirmTerminate && window.multiSessionManager) {
            window.multiSessionManager.removeSession(sessionId);
            this.refreshSessionData();
            this.showNotification(`Session terminated for ${username}`, 'success');
            
            // If this is the current user's session, redirect them
            if (sessionId === window.multiSessionManager.currentSessionId) {
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            max-width: 300px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Set background color based on type
        const colors = {
            'success': '#10a37f',
            'error': '#ff6b6b',
            'info': '#3b82f6',
            'warning': '#f59e0b'
        };
        
        notification.style.backgroundColor = colors[type] || colors['info'];
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Security settings methods
    openSecuritySettings() {
        this.loadSecuritySettings();
        this.updateConflictStats();
        this.securityModal.style.display = 'block';
    }

    closeSecuritySettings() {
        this.securityModal.style.display = 'none';
    }

    loadSecuritySettings() {
        if (!window.exclusiveLoginManager) return;
        
        const currentMode = window.exclusiveLoginManager.getConflictMode();
        const radioButtons = document.querySelectorAll('input[name="conflictMode"]');
        
        radioButtons.forEach(radio => {
            radio.checked = radio.value === currentMode;
        });
    }

    saveSecuritySettings() {
        const selectedMode = document.querySelector('input[name="conflictMode"]:checked');
        
        if (!selectedMode) {
            this.showNotification('Please select a conflict resolution mode.', 'error');
            return;
        }

        if (window.exclusiveLoginManager) {
            window.exclusiveLoginManager.setConflictMode(selectedMode.value);
            this.showNotification(`Security policy updated to: ${this.getModeName(selectedMode.value)}`, 'success');
            this.closeSecuritySettings();
        }
    }

    getModeName(mode) {
        const modeNames = {
            'prevent': 'Prevent (Block duplicate logins)',
            'ask': 'Ask User (Let user choose)',
            'force': 'Auto-logout (Force logout others)'
        };
        return modeNames[mode] || mode;
    }

    updateConflictStats() {
        if (!window.exclusiveLoginManager) {
            this.conflictStatsEl.innerHTML = '<div class="stat-item"><span class="stat-label">Exclusive login not available</span></div>';
            return;
        }

        const stats = window.exclusiveLoginManager.getConflictStats();
        const currentMode = window.exclusiveLoginManager.getConflictMode();
        
        let statsHTML = `
            <div class="stat-item">
                <span class="stat-label">Current Policy</span>
                <span class="stat-value">${this.getModeName(currentMode)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Active Users</span>
                <span class="stat-value">${stats.totalUsers || 0}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Active Sessions</span>
                <span class="stat-value">${stats.totalSessions || 0}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Users with Multiple Sessions</span>
                <span class="stat-value ${stats.hasDuplicates ? 'warning' : ''}">${stats.duplicateUsers?.length || 0}</span>
            </div>
        `;

        if (stats.duplicateUsers && stats.duplicateUsers.length > 0) {
            statsHTML += `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #404040;">
                    <h5 style="color: #f59e0b; margin-bottom: 10px;">⚠️ Duplicate Sessions Detected:</h5>
                    ${stats.duplicateUsers.map(user => `
                        <div class="stat-item">
                            <span class="stat-label">${user.username}</span>
                            <span class="stat-value warning">${user.sessionCount} sessions</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        this.conflictStatsEl.innerHTML = statsHTML;
    }

    forceLogoutAllDuplicates() {
        if (!window.exclusiveLoginManager) {
            this.showNotification('Exclusive login manager not available.', 'error');
            return;
        }

        const stats = window.exclusiveLoginManager.getConflictStats();
        
        if (!stats.duplicateUsers || stats.duplicateUsers.length === 0) {
            this.showNotification('No duplicate sessions found.', 'info');
            return;
        }

        const totalDuplicates = stats.duplicateUsers.reduce((sum, user) => sum + (user.sessionCount - 1), 0);
        
        const confirmLogout = confirm(
            `This will logout ${totalDuplicates} duplicate sessions across ${stats.duplicateUsers.length} users.\n\n` +
            `Users affected: ${stats.duplicateUsers.map(u => u.username).join(', ')}\n\n` +
            `Are you sure you want to continue?`
        );

        if (!confirmLogout) return;

        let totalTerminated = 0;

        stats.duplicateUsers.forEach(user => {
            const sessions = window.exclusiveLoginManager.getActiveSessionsForUser(user.username);
            
            // Keep the most recent session, logout the rest
            const sortedSessions = sessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
            const sessionsToTerminate = sortedSessions.slice(1); // All except the first (most recent)

            sessionsToTerminate.forEach(session => {
                if (window.multiSessionManager) {
                    window.multiSessionManager.removeSession(session.id);
                    totalTerminated++;
                }
            });
        });

        this.showNotification(`Successfully terminated ${totalTerminated} duplicate sessions.`, 'success');
        this.refreshSessionData();
        this.updateConflictStats();
    }

    // Universal Account Management Methods
    openUniversalModal() {
        if (this.universalModal) {
            this.universalModalTitle.textContent = 'Add Universal Account';
            this.universalForm.reset();
            this.universalModal.style.display = 'flex';
        }
    }

    closeUniversalModal() {
        if (this.universalModal) {
            this.universalModal.style.display = 'none';
            this.universalForm.reset();
        }
    }

    handleUniversalSubmit(e) {
        e.preventDefault();
        
        if (!window.universalLoginManager) {
            this.showNotification('Universal login manager not available', 'error');
            return;
        }

        const formData = new FormData(this.universalForm);
        const accountData = {
            username: formData.get('username'),
            password: formData.get('password'),
            email: formData.get('email'),
            role: formData.get('role'),
            universalType: formData.get('universalType'),
            maxSessions: parseInt(formData.get('maxSessions')),
            defaultSessionDuration: formData.get('defaultDuration'),
            description: formData.get('description') || `Universal ${formData.get('universalType')} account`
        };

        // Create session durations based on role
        accountData.sessionDurations = this.getSessionDurationsForRole(accountData.role);
        accountData.maxSessionDuration = this.getMaxDurationForRole(accountData.role);

        const result = window.universalLoginManager.createUniversalAccount(accountData);
        
        if (result.success) {
            this.showNotification(result.message, 'success');
            this.closeUniversalModal();
            this.populateUniversalTable();
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    populateUniversalTable() {
        if (!this.universalTableBody || !window.universalLoginManager) {
            return;
        }

        const universalAccounts = window.universalLoginManager.getUniversalAccountsList();
        
        this.universalTableBody.innerHTML = '';

        if (universalAccounts.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="7" style="text-align: center; color: #888;">No universal accounts found</td>';
            this.universalTableBody.appendChild(row);
            return;
        }

        universalAccounts.forEach(account => {
            const row = this.createUniversalRow(account);
            this.universalTableBody.appendChild(row);
        });
    }

    createUniversalRow(account) {
        const row = document.createElement('tr');
        
        const utilizationPercent = Math.round((account.activeSessions / account.maxSessions) * 100);
        const utilizationClass = utilizationPercent >= 100 ? 'danger' : 
                               utilizationPercent >= 80 ? 'warning' : 'success';

        const lastAccess = account.lastAccess ? 
            new Date(account.lastAccess).toLocaleString() : 'Never';

        row.innerHTML = `
            <td>
                <div class="user-cell">
                    <div class="user-name">${account.username}</div>
                    <div class="user-email">${account.email}</div>
                </div>
            </td>
            <td>
                <span class="role-badge ${account.universalType}">
                    ${account.universalType}
                </span>
            </td>
            <td>
                <div style="text-align: center;">
                    <div style="font-weight: 600; color: ${utilizationClass === 'danger' ? '#ff6b6b' : utilizationClass === 'warning' ? '#f59e0b' : '#10a37f'};">
                        ${account.activeSessions}/${account.maxSessions}
                    </div>
                </div>
            </td>
            <td>
                <div style="text-align: center;">
                    <div style="font-weight: 600; color: ${utilizationClass === 'danger' ? '#ff6b6b' : utilizationClass === 'warning' ? '#f59e0b' : '#10a37f'};">
                        ${utilizationPercent}%
                    </div>
                    <div style="width: 100%; height: 4px; background: #404040; border-radius: 2px; margin-top: 4px; overflow: hidden;">
                        <div style="height: 100%; background: ${utilizationClass === 'danger' ? '#ff6b6b' : utilizationClass === 'warning' ? '#f59e0b' : '#10a37f'}; width: ${Math.min(utilizationPercent, 100)}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            </td>
            <td style="text-align: center;">${account.totalLogins || 0}</td>
            <td style="text-align: center; font-size: 12px; color: #888;">${lastAccess}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-danger btn-small" onclick="userManager.deleteUniversalAccount('${account.username}')" title="Delete Account">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-warning btn-small" onclick="userManager.terminateUniversalSessions('${account.username}')" title="Terminate All Sessions">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    deleteUniversalAccount(username) {
        if (!window.universalLoginManager) {
            this.showNotification('Universal login manager not available', 'error');
            return;
        }

        if (confirm(`Are you sure you want to delete universal account "${username}"? This will terminate all active sessions.`)) {
            const result = window.universalLoginManager.deleteUniversalAccount(username);
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                this.populateUniversalTable();
                this.loadStats(); // Refresh overall stats
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    terminateUniversalSessions(username) {
        if (!window.multiSessionManager) {
            this.showNotification('Multi-session manager not available', 'error');
            return;
        }

        const sessions = window.multiSessionManager.getActiveSessions();
        const userSessions = sessions.filter(session => 
            session.user.username === username && session.user.universalType
        );

        if (userSessions.length === 0) {
            this.showNotification(`No active sessions found for universal account "${username}"`, 'info');
            return;
        }

        if (confirm(`Terminate ${userSessions.length} active session(s) for universal account "${username}"?`)) {
            let terminated = 0;
            userSessions.forEach(session => {
                if (window.multiSessionManager.removeSession(session.id)) {
                    terminated++;
                }
            });

            this.showNotification(`Successfully terminated ${terminated} session(s) for "${username}"`, 'success');
            this.populateUniversalTable();
            this.refreshSessionData();
        }
    }

    getSessionDurationsForRole(role) {
        const durationsMap = {
            'administrator': {
                '1hour': 60 * 60 * 1000,
                '8hours': 8 * 60 * 60 * 1000,
                '24hours': 24 * 60 * 60 * 1000
            },
            'user': {
                '15min': 15 * 60 * 1000,
                '30min': 30 * 60 * 1000,
                '1hour': 60 * 60 * 1000,
                '2hours': 2 * 60 * 60 * 1000,
                '4hours': 4 * 60 * 60 * 1000,
                '8hours': 8 * 60 * 60 * 1000
            },
            'guest': {
                '15min': 15 * 60 * 1000,
                '30min': 30 * 60 * 1000,
                '1hour': 60 * 60 * 1000
            }
        };
        
        return durationsMap[role] || durationsMap['user'];
    }

    getMaxDurationForRole(role) {
        const maxDurationsMap = {
            'administrator': '24hours',
            'user': '8hours',
            'guest': '1hour'
        };
        
        return maxDurationsMap[role] || maxDurationsMap['user'];
    }

    // Credential Generation Methods
    generateUsername() {
        if (!window.credentialGenerator) {
            this.showNotification('Credential generator not available', 'error');
            return;
        }

        const username = window.credentialGenerator.generateUsername('regular');
        document.getElementById('username').value = username;
        this.generateEmail(); // Auto-generate email when username changes
        this.animateGeneratedField('username');
    }

    generateEmail() {
        if (!window.credentialGenerator) {
            this.showNotification('Credential generator not available', 'error');
            return;
        }

        const username = document.getElementById('username').value;
        if (username) {
            const email = window.credentialGenerator.generateEmail(username);
            document.getElementById('email').value = email;
            this.animateGeneratedField('email');
        } else {
            this.showNotification('Please enter a username first', 'warning');
        }
    }

    generatePassword() {
        if (!window.credentialGenerator) {
            this.showNotification('Credential generator not available', 'error');
            return;
        }

        const password = window.credentialGenerator.generatePassword(12, {
            includeSymbols: true,
            excludeSimilar: true
        });
        
        document.getElementById('password').value = password;
        this.checkPasswordStrength(password, 'passwordStrength');
        this.animateGeneratedField('password');
    }

    generateAllCredentials() {
        if (!window.credentialGenerator) {
            this.showNotification('Credential generator not available', 'error');
            return;
        }

        const credentials = window.credentialGenerator.generateSecureCredentials();
        
        document.getElementById('username').value = credentials.username;
        document.getElementById('email').value = credentials.email;
        document.getElementById('password').value = credentials.password;
        
        this.checkPasswordStrength(credentials.password, 'passwordStrength');
        
        // Animate all fields
        this.animateGeneratedField('username');
        setTimeout(() => this.animateGeneratedField('email'), 100);
        setTimeout(() => this.animateGeneratedField('password'), 200);
        
        this.showNotification('✨ All credentials generated successfully!', 'success');
    }

    // Universal credential generation
    generateUniversalUsername() {
        if (!window.credentialGenerator) {
            this.showNotification('Credential generator not available', 'error');
            return;
        }

        const universalTypeSelect = document.getElementById('universalType');
        const selectedType = universalTypeSelect.value || 'demo';
        
        const username = window.credentialGenerator.generateUsername('universal', selectedType);
        document.getElementById('universalUsername').value = username;
        this.generateUniversalEmail();
        this.animateGeneratedField('universalUsername');
    }

    generateUniversalEmail() {
        if (!window.credentialGenerator) {
            this.showNotification('Credential generator not available', 'error');
            return;
        }

        const username = document.getElementById('universalUsername').value;
        if (username) {
            const email = window.credentialGenerator.generateEmail(username);
            document.getElementById('universalEmail').value = email;
            this.animateGeneratedField('universalEmail');
        } else {
            this.showNotification('Please enter a username first', 'warning');
        }
    }

    generateUniversalPassword() {
        if (!window.credentialGenerator) {
            this.showNotification('Credential generator not available', 'error');
            return;
        }

        const universalTypeSelect = document.getElementById('universalType');
        const selectedType = universalTypeSelect.value || 'demo';
        
        const password = window.credentialGenerator.generateUniversalPassword(selectedType);
        document.getElementById('universalPassword').value = password;
        this.checkPasswordStrength(password, 'universalPasswordStrength');
        this.animateGeneratedField('universalPassword');
    }

    generateAllUniversalCredentials() {
        if (!window.credentialGenerator) {
            this.showNotification('Credential generator not available', 'error');
            return;
        }

        const universalTypeSelect = document.getElementById('universalType');
        const selectedType = universalTypeSelect.value || 'demo';
        
        const credentials = window.credentialGenerator.generateCredentialSet('universal', {
            customPrefix: selectedType,
            simplePassword: true
        });
        
        document.getElementById('universalUsername').value = credentials.username;
        document.getElementById('universalEmail').value = credentials.email;
        document.getElementById('universalPassword').value = credentials.password;
        
        this.checkPasswordStrength(credentials.password, 'universalPasswordStrength');
        
        // Animate all fields
        this.animateGeneratedField('universalUsername');
        setTimeout(() => this.animateGeneratedField('universalEmail'), 100);
        setTimeout(() => this.animateGeneratedField('universalPassword'), 200);
        
        this.showNotification('🌐 Universal credentials generated successfully!', 'success');
    }

    // Password utilities
    togglePasswordVisibility(fieldId) {
        const field = document.getElementById(fieldId);
        const button = document.getElementById(fieldId === 'password' ? 'showPassword' : 'showUniversalPassword');
        const icon = button.querySelector('i');
        
        if (field.type === 'password') {
            field.type = 'text';
            icon.className = 'fas fa-eye-slash';
            button.title = 'Hide Password';
        } else {
            field.type = 'password';
            icon.className = 'fas fa-eye';
            button.title = 'Show Password';
        }
    }

    checkPasswordStrength(password, strengthElementId) {
        if (!window.credentialGenerator || !password) {
            const strengthEl = document.getElementById(strengthElementId);
            if (strengthEl) {
                strengthEl.style.display = 'none';
            }
            return;
        }

        const validation = window.credentialGenerator.validatePassword(password);
        const strength = validation.strength;
        const strengthEl = document.getElementById(strengthElementId);
        
        if (strengthEl) {
            strengthEl.style.display = 'block';
            strengthEl.className = `password-strength ${strength.level}`;
            strengthEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Password Strength: ${strength.level.charAt(0).toUpperCase() + strength.level.slice(1)}</span>
                    <span>${strength.score}%</span>
                </div>
                <div style="margin-top: 4px; font-size: 11px; opacity: 0.8;">
                    ${strength.feedback.join(', ')}
                </div>
            `;
        }
    }

    animateGeneratedField(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.background = 'rgba(16, 163, 127, 0.1)';
            field.style.borderColor = '#10a37f';
            field.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                field.style.background = '';
                field.style.borderColor = '';
            }, 1000);
        }
    }

    // Bulk credential generation for admin
    generateMultipleCredentials(count = 10, type = 'regular') {
        if (!window.credentialGenerator) {
            this.showNotification('Credential generator not available', 'error');
            return;
        }

        const credentials = window.credentialGenerator.generateMultipleCredentials(count, type);
        
        // Create downloadable CSV
        const csvContent = this.createCredentialCSV(credentials);
        this.downloadCSV(csvContent, `generated_${type}_credentials_${new Date().toISOString().split('T')[0]}.csv`);
        
        this.showNotification(`Generated ${count} ${type} credentials - CSV downloaded!`, 'success');
    }

    createCredentialCSV(credentials) {
        const headers = ['Username', 'Email', 'Password', 'Generated Date'];
        const rows = credentials.map(cred => [
            cred.username,
            cred.email,
            cred.password,
            new Date(cred.generated).toLocaleString()
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Bulk Generate Modal Methods
    openBulkGenerateModal() {
        if (this.bulkGenerateModal) {
            this.bulkGenerateModal.style.display = 'flex';
            this.toggleBulkUniversalOptions();
        }
    }

    closeBulkGenerateModal() {
        if (this.bulkGenerateModal) {
            this.bulkGenerateModal.style.display = 'none';
            document.getElementById('bulkPreview').style.display = 'none';
        }
    }

    toggleBulkUniversalOptions() {
        const bulkType = document.getElementById('bulkType').value;
        const universalOptions = document.getElementById('bulkUniversalOptions');
        
        if (universalOptions) {
            universalOptions.style.display = bulkType === 'universal' ? 'block' : 'none';
        }
    }

    previewBulkCredentials() {
        if (!window.credentialGenerator) {
            this.showNotification('Credential generator not available', 'error');
            return;
        }

        const bulkType = document.getElementById('bulkType').value;
        const passwordType = document.getElementById('bulkPasswordType').value;
        const universalType = document.getElementById('bulkUniversalType').value;

        let options = {};
        
        if (bulkType === 'universal') {
            options = {
                customPrefix: universalType,
                simplePassword: passwordType === 'simple' || passwordType === 'universal'
            };
        } else {
            if (passwordType === 'simple') {
                options.simplePassword = true;
            } else if (passwordType === 'secure') {
                options.passwordOptions = {
                    includeSymbols: true,
                    length: 12
                };
            }
        }

        const sample = window.credentialGenerator.generateCredentialSet(bulkType, options);
        
        document.getElementById('previewUsername').textContent = sample.username;
        document.getElementById('previewEmail').textContent = sample.email;
        document.getElementById('previewPassword').textContent = sample.password;
        document.getElementById('bulkPreview').style.display = 'block';
    }

    generateBulkCredentials() {
        if (!window.credentialGenerator) {
            this.showNotification('Credential generator not available', 'error');
            return;
        }

        const count = parseInt(document.getElementById('bulkCount').value);
        const bulkType = document.getElementById('bulkType').value;
        const passwordType = document.getElementById('bulkPasswordType').value;
        const universalType = document.getElementById('bulkUniversalType').value;

        if (!count || count < 1 || count > 1000) {
            this.showNotification('Please enter a valid count (1-1000)', 'error');
            return;
        }

        // Show loading state
        const generateBtn = document.getElementById('generateBulkBtn');
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;

        // Generate credentials with a small delay to show loading
        setTimeout(() => {
            try {
                let options = {};
                
                if (bulkType === 'universal') {
                    options = {
                        customPrefix: universalType,
                        simplePassword: passwordType === 'simple' || passwordType === 'universal'
                    };
                } else {
                    if (passwordType === 'simple') {
                        options.simplePassword = true;
                    } else if (passwordType === 'secure') {
                        options.passwordOptions = {
                            includeSymbols: true,
                            length: 12
                        };
                    }
                }

                const credentials = window.credentialGenerator.generateMultipleCredentials(count, bulkType, options);
                
                // Create enhanced CSV with metadata
                const csvContent = this.createEnhancedCredentialCSV(credentials, {
                    type: bulkType,
                    passwordType: passwordType,
                    universalType: bulkType === 'universal' ? universalType : null,
                    generatedAt: new Date().toISOString(),
                    count: count
                });

                const filename = `bulk_${bulkType}_credentials_${new Date().toISOString().split('T')[0]}_${count}users.csv`;
                this.downloadCSV(csvContent, filename);
                
                this.showNotification(`🎉 Successfully generated ${count} ${bulkType} credentials! CSV downloaded.`, 'success');
                this.closeBulkGenerateModal();
                
            } catch (error) {
                this.showNotification(`Error generating credentials: ${error.message}`, 'error');
            } finally {
                // Restore button state
                generateBtn.innerHTML = originalText;
                generateBtn.disabled = false;
            }
        }, 500);
    }

    createEnhancedCredentialCSV(credentials, metadata) {
        const headers = [
            'Username',
            'Email', 
            'Password',
            'Account Type',
            'Password Type',
            'Universal Type',
            'Generated Date',
            'Generated By'
        ];

        const metadataRows = [
            ['# Bulk Credential Generation Report'],
            [`# Generated: ${new Date(metadata.generatedAt).toLocaleString()}`],
            [`# Count: ${metadata.count}`],
            [`# Type: ${metadata.type}`],
            [`# Password Type: ${metadata.passwordType}`],
            metadata.universalType ? [`# Universal Type: ${metadata.universalType}`] : [],
            [`# Generated By: ${this.currentUser.username || 'Admin'}`],
            [''],
            headers
        ].filter(row => row.length > 0);

        const dataRows = credentials.map(cred => [
            cred.username,
            cred.email,
            cred.password,
            metadata.type,
            metadata.passwordType,
            metadata.universalType || '',
            new Date(cred.generated).toLocaleString(),
            this.currentUser.username || 'Admin'
        ]);

        return [...metadataRows, ...dataRows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }
}

// Initialize user manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userManager = new UserManager();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style); 