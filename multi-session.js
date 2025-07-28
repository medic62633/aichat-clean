class MultiSessionManager {
    constructor() {
        this.sessions = this.loadSessions();
        this.currentSessionId = localStorage.getItem('current_session_id');
        this.syncInterval = null;
        
        this.init();
    }

    init() {
        this.startSyncMonitoring();
        this.cleanupExpiredSessions();
    }

    // Load all active sessions
    loadSessions() {
        const stored = localStorage.getItem('multi_sessions');
        return stored ? JSON.parse(stored) : {};
    }

    // Save all sessions
    saveSessions() {
        localStorage.setItem('multi_sessions', JSON.stringify(this.sessions));
        
        // Trigger storage event for real-time sync across tabs
        window.dispatchEvent(new CustomEvent('sessionsUpdated', {
            detail: { sessions: this.sessions }
        }));
    }

    // Create a new session for a user
    createSession(user, sessionData) {
        const sessionId = this.generateSessionId();
        
        const session = {
            id: sessionId,
            user: {
                username: user.username,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                apiAccess: user.apiAccess,
                universalType: user.universalType || null,
                universalFeatures: user.universalFeatures || null,
                description: user.description || null
            },
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            expiresAt: sessionData.expiresAt,
            sessionDuration: sessionData.sessionDuration,
            browserInfo: this.getBrowserInfo(),
            isActive: true,
            tabId: this.generateTabId()
        };

        this.sessions[sessionId] = session;
        this.currentSessionId = sessionId;
        
        localStorage.setItem('current_session_id', sessionId);
        this.saveSessions();
        
        console.log(`🔐 New session created: ${sessionId} for ${user.username}`);
        return session;
    }

    // Switch to a different user session
    switchSession(sessionId) {
        if (this.sessions[sessionId] && this.isSessionValid(this.sessions[sessionId])) {
            this.currentSessionId = sessionId;
            localStorage.setItem('current_session_id', sessionId);
            
            // Update last activity
            this.sessions[sessionId].lastActivity = new Date().toISOString();
            this.saveSessions();
            
            // Reload the page to apply new user context
            window.location.reload();
            
            return this.sessions[sessionId];
        }
        return null;
    }

    // Get current active session
    getCurrentSession() {
        if (this.currentSessionId && this.sessions[this.currentSessionId]) {
            const session = this.sessions[this.currentSessionId];
            if (this.isSessionValid(session)) {
                // Update last activity
                session.lastActivity = new Date().toISOString();
                this.saveSessions();
                return session;
            } else {
                this.removeSession(this.currentSessionId);
            }
        }
        return null;
    }

    // Get all active sessions
    getActiveSessions() {
        return Object.values(this.sessions).filter(session => 
            this.isSessionValid(session) && session.isActive
        );
    }

    // Remove a session (logout)
    removeSession(sessionId) {
        if (this.sessions[sessionId]) {
            delete this.sessions[sessionId];
            
            if (this.currentSessionId === sessionId) {
                localStorage.removeItem('current_session_id');
                this.currentSessionId = null;
            }
            
            this.saveSessions();
            console.log(`🔐 Session removed: ${sessionId}`);
        }
    }

    // Check if session is valid
    isSessionValid(session) {
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        return now < expiresAt && session.isActive;
    }

    // Clean up expired sessions
    cleanupExpiredSessions() {
        let cleanedAny = false;
        
        Object.keys(this.sessions).forEach(sessionId => {
            const session = this.sessions[sessionId];
            if (!this.isSessionValid(session)) {
                delete this.sessions[sessionId];
                cleanedAny = true;
                
                if (this.currentSessionId === sessionId) {
                    localStorage.removeItem('current_session_id');
                    this.currentSessionId = null;
                }
            }
        });
        
        if (cleanedAny) {
            this.saveSessions();
        }
    }

    // Start monitoring for real-time updates
    startSyncMonitoring() {
        // Listen for storage events from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'multi_sessions') {
                this.sessions = JSON.parse(e.newValue || '{}');
                this.updateSessionUI();
            }
        });

        // Listen for custom session update events
        window.addEventListener('sessionsUpdated', (e) => {
            this.updateSessionUI();
        });

        // Cleanup expired sessions every 5 minutes
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 5 * 60 * 1000);
    }

    // Update session UI components
    updateSessionUI() {
        const event = new CustomEvent('sessionListUpdated', {
            detail: { 
                sessions: this.getActiveSessions(),
                currentSessionId: this.currentSessionId 
            }
        });
        window.dispatchEvent(event);
    }

    // Generate unique session ID
    generateSessionId() {
        return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Generate unique tab ID
    generateTabId() {
        return 'tab_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Get browser information
    getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timestamp: new Date().toISOString()
        };
    }

    // Get session statistics
    getSessionStats() {
        const sessions = this.getActiveSessions();
        const userStats = {};
        
        sessions.forEach(session => {
            const username = session.user.username;
            if (!userStats[username]) {
                userStats[username] = {
                    count: 0,
                    sessions: [],
                    lastActivity: null
                };
            }
            
            userStats[username].count++;
            userStats[username].sessions.push(session);
            
            const lastActivity = new Date(session.lastActivity);
            if (!userStats[username].lastActivity || lastActivity > new Date(userStats[username].lastActivity)) {
                userStats[username].lastActivity = session.lastActivity;
            }
        });
        
        return {
            totalSessions: sessions.length,
            uniqueUsers: Object.keys(userStats).length,
            userBreakdown: userStats
        };
    }

    // Force logout all sessions for a user
    logoutUser(username) {
        let loggedOut = 0;
        
        Object.keys(this.sessions).forEach(sessionId => {
            const session = this.sessions[sessionId];
            if (session.user.username === username) {
                delete this.sessions[sessionId];
                loggedOut++;
                
                if (this.currentSessionId === sessionId) {
                    localStorage.removeItem('current_session_id');
                    this.currentSessionId = null;
                }
            }
        });
        
        if (loggedOut > 0) {
            this.saveSessions();
        }
        
        return loggedOut;
    }

    // Get session by user
    getSessionsByUser(username) {
        return Object.values(this.sessions).filter(session => 
            session.user.username === username && this.isSessionValid(session)
        );
    }
}

// Enhanced AuthManager integration
if (typeof AuthManager !== 'undefined') {
    // Extend AuthManager with multi-session capabilities
    const originalCreateSession = AuthManager.prototype.createSession;
    
    AuthManager.prototype.createSession = function(user, rememberMe, selectedDuration = null) {
        // Call original method to get session data
        const sessionData = this.getSessionData(user, rememberMe, selectedDuration);
        
        // Create multi-session entry
        if (!window.multiSessionManager) {
            window.multiSessionManager = new MultiSessionManager();
        }
        
        const multiSession = window.multiSessionManager.createSession(user, sessionData);
        
        // Store session using original method but with multi-session ID
        if (rememberMe) {
            localStorage.setItem('godforever_session', JSON.stringify({
                ...sessionData,
                multiSessionId: multiSession.id
            }));
        } else {
            sessionStorage.setItem('godforever_session', JSON.stringify({
                ...sessionData,
                multiSessionId: multiSession.id
            }));
        }
        
        this.setSessionCookie(sessionData);
        
        console.log(`🔐 Multi-session created for ${user.username}:`, {
            sessionId: multiSession.id,
            duration: this.formatDuration(sessionData.sessionDuration),
            expires: new Date(sessionData.expiresAt).toLocaleString(),
            rememberMe: rememberMe
        });
    };
    
    // Helper method to get session data
    AuthManager.prototype.getSessionData = function(user, rememberMe, selectedDuration = null) {
        let sessionTimeout = this.defaultSessionTimeout;
        
        if (selectedDuration && user.sessionDurations && user.sessionDurations[selectedDuration]) {
            sessionTimeout = user.sessionDurations[selectedDuration];
        } else if (user.sessionDurations && user.defaultSessionDuration) {
            sessionTimeout = user.sessionDurations[user.defaultSessionDuration];
        }

        return {
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
    };
    
    // Enhanced session checking
    const originalCheckAuth = AuthManager.checkAuth;
    AuthManager.checkAuth = function() {
        if (!window.multiSessionManager) {
            window.multiSessionManager = new MultiSessionManager();
        }
        
        const multiSession = window.multiSessionManager.getCurrentSession();
        if (multiSession) {
            return multiSession.user;
        }
        
        // Fallback to original method
        return originalCheckAuth();
    };
}

// Initialize multi-session manager
document.addEventListener('DOMContentLoaded', () => {
    if (!window.multiSessionManager) {
        window.multiSessionManager = new MultiSessionManager();
    }
}); 