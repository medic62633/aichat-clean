class SessionSwitcher {
    constructor() {
        this.isVisible = false;
        this.multiSessionManager = window.multiSessionManager;
        
        this.init();
    }

    init() {
        this.createSwitcherUI();
        this.bindEvents();
        this.startListening();
    }

    createSwitcherUI() {
        // Create session switcher button
        const switcherButton = document.createElement('button');
        switcherButton.id = 'sessionSwitcherBtn';
        switcherButton.className = 'session-switcher-btn';
        switcherButton.innerHTML = `
            <i class="fas fa-users"></i>
            <span class="session-count">1</span>
        `;
        switcherButton.title = 'Switch User Session';

        // Create session switcher dropdown
        const switcherDropdown = document.createElement('div');
        switcherDropdown.id = 'sessionSwitcherDropdown';
        switcherDropdown.className = 'session-switcher-dropdown';
        switcherDropdown.style.display = 'none';

        // Add to sidebar user section
        const userSection = document.querySelector('.user-section');
        if (userSection) {
            userSection.appendChild(switcherButton);
            userSection.appendChild(switcherDropdown);
        }

        this.addSwitcherStyles();
    }

    addSwitcherStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .session-switcher-btn {
                position: relative;
                background: rgba(59, 130, 246, 0.2);
                border: 1px solid #3b82f6;
                color: #3b82f6;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 12px;
                margin-top: 10px;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }

            .session-switcher-btn:hover {
                background: rgba(59, 130, 246, 0.3);
                transform: translateY(-1px);
            }

            .session-count {
                background: #3b82f6;
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 600;
            }

            .session-switcher-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: #1a1a1a;
                border: 1px solid #404040;
                border-radius: 8px;
                margin-top: 5px;
                z-index: 1000;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                overflow: hidden;
                animation: dropdownSlideIn 0.2s ease-out;
            }

            @keyframes dropdownSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .session-dropdown-header {
                padding: 12px 15px;
                background: #2a2a2a;
                border-bottom: 1px solid #404040;
                font-size: 12px;
                font-weight: 600;
                color: #10a37f;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .session-item {
                padding: 12px 15px;
                border-bottom: 1px solid #303030;
                cursor: pointer;
                transition: background-color 0.2s ease;
                position: relative;
            }

            .session-item:hover {
                background-color: #2a2a2a;
            }

            .session-item.current {
                background-color: rgba(16, 163, 127, 0.1);
                border-left: 3px solid #10a37f;
            }

            .session-item.current::after {
                content: "CURRENT";
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 9px;
                color: #10a37f;
                font-weight: 600;
            }

            .session-user {
                font-size: 14px;
                font-weight: 500;
                color: #ffffff;
                margin-bottom: 4px;
            }

            .session-details {
                font-size: 11px;
                color: #888;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .session-role {
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .session-role.administrator {
                background: rgba(16, 163, 127, 0.2);
                color: #10a37f;
            }

            .session-role.user {
                background: rgba(59, 130, 246, 0.2);
                color: #3b82f6;
            }

            .session-role.guest {
                background: rgba(156, 163, 175, 0.2);
                color: #9ca3af;
            }

            .session-actions {
                padding: 10px 15px;
                background: #2a2a2a;
                border-top: 1px solid #404040;
                display: flex;
                gap: 8px;
            }

            .session-action-btn {
                flex: 1;
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .session-action-btn.add {
                background: linear-gradient(135deg, #10a37f 0%, #0d8f6b 100%);
                color: white;
            }

            .session-action-btn.add:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(16, 163, 127, 0.3);
            }

            .session-action-btn.logout-all {
                background: rgba(255, 107, 107, 0.2);
                color: #ff6b6b;
                border: 1px solid #ff6b6b;
            }

            .session-action-btn.logout-all:hover {
                background: rgba(255, 107, 107, 0.3);
            }

            .no-sessions {
                padding: 20px 15px;
                text-align: center;
                color: #888;
                font-size: 12px;
            }

            .session-time-remaining {
                font-size: 10px;
                color: #10a37f;
                font-weight: 500;
            }

            .session-time-remaining.warning {
                color: #f59e0b;
            }

            .session-time-remaining.critical {
                color: #ff6b6b;
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        const switcherBtn = document.getElementById('sessionSwitcherBtn');
        if (switcherBtn) {
            switcherBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('sessionSwitcherDropdown');
            if (dropdown && !dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });
    }

    startListening() {
        // Listen for session updates
        window.addEventListener('sessionListUpdated', (e) => {
            this.updateSessionList(e.detail.sessions, e.detail.currentSessionId);
        });

        // Update on page load
        if (this.multiSessionManager) {
            const sessions = this.multiSessionManager.getActiveSessions();
            this.updateSessionList(sessions, this.multiSessionManager.currentSessionId);
        }
    }

    toggleDropdown() {
        const dropdown = document.getElementById('sessionSwitcherDropdown');
        if (dropdown) {
            if (this.isVisible) {
                this.hideDropdown();
            } else {
                this.showDropdown();
            }
        }
    }

    showDropdown() {
        const dropdown = document.getElementById('sessionSwitcherDropdown');
        if (dropdown) {
            dropdown.style.display = 'block';
            this.isVisible = true;
            this.refreshSessionList();
        }
    }

    hideDropdown() {
        const dropdown = document.getElementById('sessionSwitcherDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
            this.isVisible = false;
        }
    }

    refreshSessionList() {
        if (this.multiSessionManager) {
            const sessions = this.multiSessionManager.getActiveSessions();
            this.updateSessionList(sessions, this.multiSessionManager.currentSessionId);
        }
    }

    updateSessionList(sessions, currentSessionId) {
        const dropdown = document.getElementById('sessionSwitcherDropdown');
        const switcherBtn = document.getElementById('sessionSwitcherBtn');
        const sessionCount = document.querySelector('.session-count');

        if (!dropdown || !switcherBtn || !sessionCount) return;

        // Update session count
        sessionCount.textContent = sessions.length;

        // Show/hide switcher button based on session count
        if (sessions.length <= 1) {
            switcherBtn.style.display = 'none';
        } else {
            switcherBtn.style.display = 'flex';
        }

        // Build dropdown content
        let dropdownHTML = `
            <div class="session-dropdown-header">
                <span>Active Sessions</span>
                <span>${sessions.length} user${sessions.length !== 1 ? 's' : ''}</span>
            </div>
        `;

        if (sessions.length === 0) {
            dropdownHTML += `
                <div class="no-sessions">
                    No active sessions found
                </div>
            `;
        } else {
            sessions.forEach(session => {
                const isCurrent = session.id === currentSessionId;
                const timeRemaining = this.getTimeRemaining(session.expiresAt);
                const timeClass = this.getTimeRemainingClass(timeRemaining.milliseconds);

                dropdownHTML += `
                    <div class="session-item ${isCurrent ? 'current' : ''}" data-session-id="${session.id}">
                        <div class="session-user">${session.user.username}</div>
                        <div class="session-details">
                            <span class="session-role ${session.user.role}">${session.user.role}</span>
                            <span class="session-time-remaining ${timeClass}">
                                ${timeRemaining.display}
                            </span>
                        </div>
                    </div>
                `;
            });
        }

        dropdownHTML += `
            <div class="session-actions">
                <button class="session-action-btn add" onclick="sessionSwitcher.addNewSession()">
                    <i class="fas fa-plus"></i> Add User
                </button>
                <button class="session-action-btn logout-all" onclick="sessionSwitcher.logoutAllSessions()">
                    <i class="fas fa-sign-out-alt"></i> Logout All
                </button>
            </div>
        `;

        dropdown.innerHTML = dropdownHTML;

        // Bind session switch events
        dropdown.querySelectorAll('.session-item:not(.current)').forEach(item => {
            item.addEventListener('click', () => {
                const sessionId = item.dataset.sessionId;
                this.switchToSession(sessionId);
            });
        });
    }

    getTimeRemaining(expiresAt) {
        const now = new Date();
        const expires = new Date(expiresAt);
        const remaining = expires - now;

        if (remaining <= 0) {
            return { display: 'Expired', milliseconds: 0 };
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

        return {
            display: `${hours}h ${minutes}m`,
            milliseconds: remaining
        };
    }

    getTimeRemainingClass(milliseconds) {
        if (milliseconds < 30 * 60 * 1000) { // Less than 30 minutes
            return 'critical';
        } else if (milliseconds < 2 * 60 * 60 * 1000) { // Less than 2 hours
            return 'warning';
        }
        return '';
    }

    switchToSession(sessionId) {
        if (this.multiSessionManager) {
            this.hideDropdown();
            
            // Show loading indicator
            const notification = this.showNotification('Switching user session...', 'info');
            
            setTimeout(() => {
                this.multiSessionManager.switchSession(sessionId);
            }, 500);
        }
    }

    addNewSession() {
        this.hideDropdown();
        
        // Open login page in new tab for additional session
        const loginUrl = 'login.html?mode=additional';
        window.open(loginUrl, '_blank');
    }

    logoutAllSessions() {
        const confirmLogout = confirm('Are you sure you want to logout all active sessions? This will close all user sessions in this browser.');
        
        if (confirmLogout && this.multiSessionManager) {
            this.hideDropdown();
            
            // Clear all sessions
            this.multiSessionManager.sessions = {};
            this.multiSessionManager.currentSessionId = null;
            localStorage.removeItem('current_session_id');
            this.multiSessionManager.saveSessions();
            
            this.showNotification('All sessions logged out. Redirecting...', 'info');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }
    }

    showNotification(message, type = 'info') {
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
        
        const colors = {
            'success': '#10a37f',
            'error': '#ff6b6b',
            'info': '#3b82f6',
            'warning': '#f59e0b'
        };
        
        notification.style.backgroundColor = colors[type] || colors['info'];
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
        
        return notification;
    }
}

// Initialize session switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other components to load
    setTimeout(() => {
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            window.sessionSwitcher = new SessionSwitcher();
        }
    }, 1000);
}); 