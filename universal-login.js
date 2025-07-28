class UniversalLoginManager {
    constructor() {
        this.universalAccounts = this.loadUniversalAccounts();
        this.maxConcurrentSessions = {
            'testing': 10,
            'demo': 5,
            'giveaway': 50,
            'team': 20,
            'unlimited': 999
        };
        
        this.init();
    }

    init() {
        this.initDefaultUniversalAccounts();
        this.extendAuthManager();
        this.startSessionTracking();
    }

    initDefaultUniversalAccounts() {
        // Create default universal accounts if none exist
        if (Object.keys(this.universalAccounts).length === 0) {
            this.universalAccounts = {
                'test': {
                    password: 'test123',
                    email: 'test@godforever.ai',
                    role: 'user',
                    type: 'testing',
                    universalType: 'testing',
                    maxSessions: 10,
                    allowSimultaneous: true,
                    createdAt: new Date().toISOString(),
                    apiAccess: true,
                    permissions: ['chat_access', 'model_access', 'api_access'],
                    sessionDurations: {
                        '15min': 15 * 60 * 1000,
                        '1hour': 60 * 60 * 1000,
                        '4hours': 4 * 60 * 60 * 1000
                    },
                    defaultSessionDuration: '1hour',
                    maxSessionDuration: '4hours',
                    description: 'Universal testing account - up to 10 concurrent users',
                    features: ['Full chat access', 'All models', 'API access', 'Testing purpose']
                },
                'demo': {
                    password: 'demo2024',
                    email: 'demo@godforever.ai',
                    role: 'user',
                    type: 'demo',
                    universalType: 'demo',
                    maxSessions: 5,
                    allowSimultaneous: true,
                    createdAt: new Date().toISOString(),
                    apiAccess: true,
                    permissions: ['chat_access', 'model_access', 'api_access'],
                    sessionDurations: {
                        '30min': 30 * 60 * 1000,
                        '2hours': 2 * 60 * 60 * 1000,
                        '8hours': 8 * 60 * 60 * 1000
                    },
                    defaultSessionDuration: '2hours',
                    maxSessionDuration: '8hours',
                    description: 'Demo account for presentations - up to 5 concurrent users',
                    features: ['Full chat access', 'All models', 'API access', 'Demo presentations']
                },
                'giveaway': {
                    password: 'free2024',
                    email: 'giveaway@godforever.ai',
                    role: 'user',
                    type: 'giveaway',
                    universalType: 'giveaway',
                    maxSessions: 50,
                    allowSimultaneous: true,
                    createdAt: new Date().toISOString(),
                    apiAccess: true,
                    permissions: ['chat_access', 'model_access', 'api_access'],
                    sessionDurations: {
                        '15min': 15 * 60 * 1000,
                        '30min': 30 * 60 * 1000,
                        '1hour': 60 * 60 * 1000
                    },
                    defaultSessionDuration: '30min',
                    maxSessionDuration: '1hour',
                    description: 'Free giveaway account - up to 50 concurrent users',
                    features: ['Full chat access', 'All models', 'API access', 'Community access']
                },
                'team': {
                    password: 'team2024',
                    email: 'team@godforever.ai',
                    role: 'user',
                    type: 'team',
                    universalType: 'team',
                    maxSessions: 20,
                    allowSimultaneous: true,
                    createdAt: new Date().toISOString(),
                    apiAccess: true,
                    permissions: ['chat_access', 'model_access', 'api_access', 'team_features'],
                    sessionDurations: {
                        '1hour': 60 * 60 * 1000,
                        '8hours': 8 * 60 * 60 * 1000,
                        '24hours': 24 * 60 * 60 * 1000
                    },
                    defaultSessionDuration: '8hours',
                    maxSessionDuration: '24hours',
                    description: 'Team collaboration account - up to 20 concurrent users',
                    features: ['Team collaboration', 'Extended sessions', 'All models', 'API access']
                }
            };
            this.saveUniversalAccounts();
        }
    }

    extendAuthManager() {
        if (typeof AuthManager === 'undefined') return;

        // Store original authentication method
        const originalAuthenticateUser = AuthManager.prototype.authenticateUser;
        
        // Override authentication to handle universal accounts
        AuthManager.prototype.authenticateUser = (username, password) => {
            // Check if this is a universal account first
            const universalAccount = window.universalLoginManager?.getUniversalAccount(username);
            
            if (universalAccount) {
                return window.universalLoginManager?.authenticateUniversalUser(username, password) || {
                    success: false,
                    message: 'Universal authentication failed'
                };
            }

            // Fall back to regular authentication with exclusive login checks
            const authResult = originalAuthenticateUser.call(this, username, password);
            
            if (!authResult.success) {
                return authResult;
            }

            // Check for existing sessions only for non-universal accounts
            const existingSessions = window.exclusiveLoginManager?.getActiveSessionsForUser(username) || [];
            
            if (existingSessions.length > 0) {
                return window.exclusiveLoginManager?.handleSessionConflict(username, existingSessions, authResult) || authResult;
            }

            return authResult;
        };
    }

    getUniversalAccount(username) {
        return this.universalAccounts[username] || null;
    }

    authenticateUniversalUser(username, password) {
        const account = this.universalAccounts[username];
        
        if (!account) {
            return {
                success: false,
                message: 'Universal account not found'
            };
        }

        if (account.password !== password) {
            return {
                success: false,
                message: 'Invalid universal account credentials'
            };
        }

        // Check session limits
        const currentSessions = this.getActiveUniversalSessions(username);
        if (currentSessions >= account.maxSessions) {
            return {
                success: false,
                message: `Universal account "${username}" has reached its limit of ${account.maxSessions} concurrent users. Please try again later.`,
                errorType: 'session_limit_reached',
                sessionData: {
                    current: currentSessions,
                    max: account.maxSessions,
                    type: account.universalType
                }
            };
        }

        // Update last access
        account.lastAccess = new Date().toISOString();
        account.totalLogins = (account.totalLogins || 0) + 1;
        this.saveUniversalAccounts();

        return {
            success: true,
            isUniversal: true,
            user: {
                username,
                email: account.email,
                role: account.role,
                permissions: account.permissions,
                apiAccess: account.apiAccess,
                sessionDurations: account.sessionDurations,
                maxSessionDuration: account.maxSessionDuration,
                defaultSessionDuration: account.defaultSessionDuration,
                universalType: account.universalType,
                universalFeatures: account.features,
                description: account.description
            }
        };
    }

    getActiveUniversalSessions(username) {
        if (!window.multiSessionManager) return 0;
        
        const activeSessions = window.multiSessionManager.getActiveSessions();
        return activeSessions.filter(session => 
            session.user.username === username && 
            session.user.universalType
        ).length;
    }

    getAllUniversalSessionStats() {
        const stats = {};
        
        Object.keys(this.universalAccounts).forEach(username => {
            const account = this.universalAccounts[username];
            const activeSessions = this.getActiveUniversalSessions(username);
            
            stats[username] = {
                account: account,
                activeSessions: activeSessions,
                maxSessions: account.maxSessions,
                utilizationPercent: Math.round((activeSessions / account.maxSessions) * 100),
                isNearLimit: activeSessions >= (account.maxSessions * 0.8), // 80% threshold
                isAtLimit: activeSessions >= account.maxSessions
            };
        });
        
        return stats;
    }

    startSessionTracking() {
        // Update universal account stats every 30 seconds
        setInterval(() => {
            this.updateUniversalStats();
        }, 30000);
    }

    updateUniversalStats() {
        // Dispatch event for UI updates
        const stats = this.getAllUniversalSessionStats();
        window.dispatchEvent(new CustomEvent('universalStatsUpdated', {
            detail: { stats }
        }));
    }

    // Admin methods
    createUniversalAccount(accountData) {
        const {
            username,
            password,
            email,
            role,
            universalType,
            maxSessions,
            sessionDurations,
            defaultSessionDuration,
            maxSessionDuration,
            description,
            features
        } = accountData;

        if (this.universalAccounts[username]) {
            return {
                success: false,
                message: 'Universal account already exists'
            };
        }

        this.universalAccounts[username] = {
            password,
            email,
            role,
            type: universalType,
            universalType,
            maxSessions: maxSessions || this.maxConcurrentSessions[universalType] || 5,
            allowSimultaneous: true,
            createdAt: new Date().toISOString(),
            apiAccess: role !== 'guest',
            permissions: this.getRolePermissions(role),
            sessionDurations: sessionDurations || this.getDefaultSessionDurations(role),
            defaultSessionDuration: defaultSessionDuration || '1hour',
            maxSessionDuration: maxSessionDuration || '8hours',
            description: description || `Universal ${universalType} account`,
            features: features || [],
            totalLogins: 0
        };

        this.saveUniversalAccounts();
        
        return {
            success: true,
            message: `Universal account "${username}" created successfully`
        };
    }

    updateUniversalAccount(username, updates) {
        if (!this.universalAccounts[username]) {
            return {
                success: false,
                message: 'Universal account not found'
            };
        }

        // Merge updates
        this.universalAccounts[username] = {
            ...this.universalAccounts[username],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveUniversalAccounts();
        
        return {
            success: true,
            message: `Universal account "${username}" updated successfully`
        };
    }

    deleteUniversalAccount(username) {
        if (!this.universalAccounts[username]) {
            return {
                success: false,
                message: 'Universal account not found'
            };
        }

        // Terminate all active sessions for this universal account
        if (window.multiSessionManager) {
            const sessions = window.multiSessionManager.getActiveSessions();
            sessions.forEach(session => {
                if (session.user.username === username && session.user.universalType) {
                    window.multiSessionManager.removeSession(session.id);
                }
            });
        }

        delete this.universalAccounts[username];
        this.saveUniversalAccounts();
        
        return {
            success: true,
            message: `Universal account "${username}" deleted successfully`
        };
    }

    getRolePermissions(role) {
        const permissionsMap = {
            'administrator': ['full_access', 'api_management', 'user_management', 'chat_access', 'model_access', 'api_access'],
            'user': ['chat_access', 'model_access', 'api_access'],
            'guest': ['chat_access', 'model_access', 'api_access']
        };
        
        return permissionsMap[role] || permissionsMap['user'];
    }

    getDefaultSessionDurations(role) {
        const durationsMap = {
            'administrator': {
                '1hour': 60 * 60 * 1000,
                '8hours': 8 * 60 * 60 * 1000,
                '24hours': 24 * 60 * 60 * 1000
            },
            'user': {
                '30min': 30 * 60 * 1000,
                '2hours': 2 * 60 * 60 * 1000,
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

    // Storage methods
    loadUniversalAccounts() {
        const stored = localStorage.getItem('universal_accounts');
        return stored ? JSON.parse(stored) : {};
    }

    saveUniversalAccounts() {
        localStorage.setItem('universal_accounts', JSON.stringify(this.universalAccounts));
    }

    // Utility methods
    getUniversalAccountsList() {
        return Object.entries(this.universalAccounts).map(([username, account]) => ({
            username,
            ...account,
            activeSessions: this.getActiveUniversalSessions(username)
        }));
    }

    getUniversalAccountByType(type) {
        return Object.entries(this.universalAccounts)
            .filter(([username, account]) => account.universalType === type)
            .map(([username, account]) => ({ username, ...account }));
    }

    isUniversalAccount(username) {
        return !!this.universalAccounts[username];
    }

    getUniversalAccountInfo(username) {
        const account = this.universalAccounts[username];
        if (!account) return null;

        return {
            ...account,
            activeSessions: this.getActiveUniversalSessions(username),
            utilizationPercent: Math.round((this.getActiveUniversalSessions(username) / account.maxSessions) * 100)
        };
    }
}

// Initialize universal login manager
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.universalLoginManager) {
            window.universalLoginManager = new UniversalLoginManager();
        }
    }, 600);
}); 