class ExclusiveLoginManager {
    constructor() {
        this.multiSessionManager = window.multiSessionManager;
        this.conflictMode = 'prevent'; // 'prevent', 'force', 'ask'
        
        this.init();
    }

    init() {
        // Load conflict resolution preference
        this.conflictMode = localStorage.getItem('login_conflict_mode') || 'prevent';
        
        // Extend AuthManager with exclusive login checks
        this.extendAuthManager();
    }

    extendAuthManager() {
        if (typeof AuthManager === 'undefined') return;

        // Store original authentication method
        const originalAuthenticateUser = AuthManager.prototype.authenticateUser;
        
        // Override authentication to check for existing sessions
        AuthManager.prototype.authenticateUser = (username, password) => {
            // First, validate credentials normally
            const authResult = originalAuthenticateUser.call(this, username, password);
            
            if (!authResult.success) {
                return authResult;
            }

            // Check for existing active sessions for this user
            const existingSessions = window.exclusiveLoginManager?.getActiveSessionsForUser(username) || [];
            
            if (existingSessions.length > 0) {
                // Handle session conflict
                return window.exclusiveLoginManager?.handleSessionConflict(username, existingSessions, authResult) || authResult;
            }

            return authResult;
        };
    }

    getActiveSessionsForUser(username) {
        if (!this.multiSessionManager) return [];
        
        return this.multiSessionManager.getActiveSessions().filter(session => 
            session.user.username === username
        );
    }

    handleSessionConflict(username, existingSessions, authResult) {
        const conflictData = {
            username,
            existingSessions,
            authResult,
            conflictCount: existingSessions.length
        };

        switch (this.conflictMode) {
            case 'prevent':
                return this.preventLogin(conflictData);
            
            case 'force':
                return this.forceLogoutExisting(conflictData);
            
            case 'ask':
                return this.askUserChoice(conflictData);
            
            default:
                return this.preventLogin(conflictData);
        }
    }

    preventLogin(conflictData) {
        const { username, existingSessions } = conflictData;
        const sessionDetails = this.formatSessionDetails(existingSessions);
        
        return {
            success: false,
            message: `User "${username}" is already logged in from another location.`,
            errorType: 'session_conflict',
            conflictData: {
                username,
                existingSessions: sessionDetails,
                resolution: 'prevent'
            }
        };
    }

    forceLogoutExisting(conflictData) {
        const { username, existingSessions, authResult } = conflictData;
        
        // Terminate all existing sessions for this user
        existingSessions.forEach(session => {
            if (this.multiSessionManager) {
                this.multiSessionManager.removeSession(session.id);
            }
        });

        // Log the forced logout
        console.log(`🔐 Forced logout of ${existingSessions.length} existing session(s) for user: ${username}`);
        
        // Allow the new login to proceed
        return {
            ...authResult,
            forcedLogout: true,
            terminatedSessions: existingSessions.length
        };
    }

    askUserChoice(conflictData) {
        // Store conflict data for the conflict resolution modal
        this.pendingConflict = conflictData;
        
        return {
            success: false,
            message: `User "${conflictData.username}" is already logged in. Choose how to proceed.`,
            errorType: 'session_conflict_choice',
            conflictData: {
                username: conflictData.username,
                existingSessions: this.formatSessionDetails(conflictData.existingSessions),
                resolution: 'ask'
            }
        };
    }

    formatSessionDetails(sessions) {
        return sessions.map(session => ({
            id: session.id,
            loginTime: session.loginTime,
            lastActivity: session.lastActivity,
            expiresAt: session.expiresAt,
            browserInfo: this.getBrowserDisplayName(session.browserInfo),
            timeRemaining: this.getTimeRemaining(session.expiresAt)
        }));
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
        
        return `${browser} on ${os}`;
    }

    getTimeRemaining(expiresAt) {
        const now = new Date();
        const expires = new Date(expiresAt);
        const remaining = expires - now;

        if (remaining <= 0) {
            return 'Expired';
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    }

    // Methods for conflict resolution modal
    resolveConflict(action) {
        if (!this.pendingConflict) return null;

        const conflictData = this.pendingConflict;
        this.pendingConflict = null;

        switch (action) {
            case 'cancel':
                return {
                    success: false,
                    message: 'Login cancelled by user.',
                    errorType: 'user_cancelled'
                };

            case 'force':
                return this.forceLogoutExisting(conflictData);

            case 'prevent':
                return this.preventLogin(conflictData);

            default:
                return this.preventLogin(conflictData);
        }
    }

    // Configuration methods
    setConflictMode(mode) {
        this.conflictMode = mode;
        localStorage.setItem('login_conflict_mode', mode);
    }

    getConflictMode() {
        return this.conflictMode;
    }

    // Admin methods
    getConflictStats() {
        if (!this.multiSessionManager) return {};

        const sessions = this.multiSessionManager.getActiveSessions();
        const userCounts = {};
        
        sessions.forEach(session => {
            const username = session.user.username;
            userCounts[username] = (userCounts[username] || 0) + 1;
        });

        const duplicateUsers = Object.entries(userCounts)
            .filter(([username, count]) => count > 1)
            .map(([username, count]) => ({ username, sessionCount: count }));

        return {
            totalUsers: Object.keys(userCounts).length,
            totalSessions: sessions.length,
            duplicateUsers,
            hasDuplicates: duplicateUsers.length > 0
        };
    }

    // Force logout all sessions for a specific user (admin function)
    adminForceLogoutUser(username) {
        const sessions = this.getActiveSessionsForUser(username);
        
        sessions.forEach(session => {
            if (this.multiSessionManager) {
                this.multiSessionManager.removeSession(session.id);
            }
        });

        return {
            success: true,
            terminatedSessions: sessions.length,
            message: `Terminated ${sessions.length} session(s) for user: ${username}`
        };
    }

    // Check if user currently has active sessions
    isUserCurrentlyLoggedIn(username) {
        const sessions = this.getActiveSessionsForUser(username);
        return sessions.length > 0;
    }

    // Get detailed session info for a user
    getUserSessionDetails(username) {
        const sessions = this.getActiveSessionsForUser(username);
        return this.formatSessionDetails(sessions);
    }
}

// Initialize exclusive login manager
document.addEventListener('DOMContentLoaded', () => {
    // Wait for other managers to initialize
    setTimeout(() => {
        if (!window.exclusiveLoginManager) {
            window.exclusiveLoginManager = new ExclusiveLoginManager();
        }
    }, 500);
}); 