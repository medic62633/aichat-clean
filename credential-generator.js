class CredentialGenerator {
    constructor() {
        this.adjectives = [
            'Swift', 'Bright', 'Cool', 'Fast', 'Smart', 'Bold', 'Quick', 'Wise', 'Sharp', 'Strong',
            'Elite', 'Prime', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Mega', 'Ultra', 'Super',
            'Turbo', 'Hyper', 'Neo', 'Pro', 'Max', 'Ace', 'Star', 'Power', 'Fire', 'Storm',
            'Lightning', 'Thunder', 'Cosmic', 'Digital', 'Cyber', 'Quantum', 'Neural', 'Vector',
            'Matrix', 'Phoenix', 'Dragon', 'Tiger', 'Eagle', 'Wolf', 'Lion', 'Falcon', 'Hawk',
            'Shadow', 'Ghost', 'Ninja', 'Warrior', 'Knight', 'Guardian', 'Defender', 'Champion'
        ];

        this.nouns = [
            'User', 'Agent', 'Pilot', 'Hunter', 'Rider', 'Master', 'Expert', 'Genius', 'Hero', 'Legend',
            'Coder', 'Hacker', 'Developer', 'Engineer', 'Architect', 'Designer', 'Creator', 'Builder',
            'Tester', 'Analyst', 'Scientist', 'Researcher', 'Explorer', 'Pioneer', 'Innovator',
            'Leader', 'Manager', 'Director', 'Chief', 'Captain', 'Commander', 'Admiral', 'General',
            'Phoenix', 'Dragon', 'Tiger', 'Eagle', 'Wolf', 'Lion', 'Falcon', 'Hawk', 'Bear', 'Fox',
            'Shark', 'Panther', 'Cobra', 'Viper', 'Raven', 'Sparrow', 'Owl', 'Crane', 'Swan'
        ];

        this.universalPrefixes = [
            'demo', 'test', 'trial', 'guest', 'free', 'open', 'public', 'shared', 'common', 'global',
            'universal', 'general', 'basic', 'standard', 'lite', 'mini', 'quick', 'easy', 'simple'
        ];

        this.passwordChars = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        };
    }

    generateUsername(type = 'regular', customPrefix = '') {
        if (type === 'universal') {
            const prefix = customPrefix || this.getRandomElement(this.universalPrefixes);
            const suffix = this.getRandomElement(this.nouns).toLowerCase();
            const number = Math.floor(Math.random() * 9999) + 1;
            return `${prefix}${suffix}${number}`;
        } else {
            const adjective = this.getRandomElement(this.adjectives);
            const noun = this.getRandomElement(this.nouns);
            const number = Math.floor(Math.random() * 999) + 1;
            return `${adjective}${noun}${number}`;
        }
    }

    generatePassword(length = 12, options = {}) {
        const defaultOptions = {
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSymbols: false, // Default to false for easier sharing
            excludeSimilar: true // Exclude similar looking characters
        };

        const settings = { ...defaultOptions, ...options };
        let charset = '';

        if (settings.includeUppercase) charset += this.passwordChars.uppercase;
        if (settings.includeLowercase) charset += this.passwordChars.lowercase;
        if (settings.includeNumbers) charset += this.passwordChars.numbers;
        if (settings.includeSymbols) charset += this.passwordChars.symbols;

        if (settings.excludeSimilar) {
            // Remove similar looking characters
            charset = charset.replace(/[0O1lI]/g, '');
        }

        if (charset === '') {
            throw new Error('At least one character type must be selected');
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        // Ensure password meets requirements
        if (settings.includeUppercase && !/[A-Z]/.test(password)) {
            password = this.replaceRandomChar(password, this.passwordChars.uppercase);
        }
        if (settings.includeLowercase && !/[a-z]/.test(password)) {
            password = this.replaceRandomChar(password, this.passwordChars.lowercase);
        }
        if (settings.includeNumbers && !/[0-9]/.test(password)) {
            password = this.replaceRandomChar(password, this.passwordChars.numbers);
        }
        if (settings.includeSymbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
            password = this.replaceRandomChar(password, this.passwordChars.symbols);
        }

        return password;
    }

    generateSimplePassword(length = 8) {
        // Generate a simple, memorable password
        const words = ['cat', 'dog', 'sun', 'sky', 'car', 'fun', 'run', 'big', 'win', 'joy'];
        const word = this.getRandomElement(words);
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 99) + 1;
        
        return `${word}${year}${random}`;
    }

    generateUniversalPassword(type = 'demo') {
        const year = new Date().getFullYear();
        const patterns = {
            demo: `demo${year}`,
            test: `test${Math.floor(Math.random() * 999) + 100}`,
            free: `free${year}`,
            trial: `trial${year}`,
            guest: `guest${Math.floor(Math.random() * 9999) + 1000}`,
            public: `public${year}`,
            shared: `shared${Math.floor(Math.random() * 99) + 10}`
        };

        return patterns[type] || `${type}${year}`;
    }

    generateEmail(username, domain = 'godforever.ai') {
        return `${username.toLowerCase()}@${domain}`;
    }

    generateCredentialSet(type = 'regular', options = {}) {
        const username = this.generateUsername(type, options.customPrefix);
        const email = this.generateEmail(username, options.domain);
        
        let password;
        if (type === 'universal') {
            password = options.simplePassword ? 
                      this.generateUniversalPassword(options.customPrefix || 'demo') :
                      this.generatePassword(10, { includeSymbols: false });
        } else {
            password = options.simplePassword ? 
                      this.generateSimplePassword() :
                      this.generatePassword(12, options.passwordOptions || {});
        }

        return {
            username,
            email,
            password,
            generated: new Date().toISOString()
        };
    }

    validatePassword(password, requirements = {}) {
        const defaultRequirements = {
            minLength: 8,
            requireUppercase: false,
            requireLowercase: true,
            requireNumbers: false,
            requireSymbols: false
        };

        const reqs = { ...defaultRequirements, ...requirements };
        const issues = [];

        if (password.length < reqs.minLength) {
            issues.push(`Password must be at least ${reqs.minLength} characters long`);
        }

        if (reqs.requireUppercase && !/[A-Z]/.test(password)) {
            issues.push('Password must contain at least one uppercase letter');
        }

        if (reqs.requireLowercase && !/[a-z]/.test(password)) {
            issues.push('Password must contain at least one lowercase letter');
        }

        if (reqs.requireNumbers && !/[0-9]/.test(password)) {
            issues.push('Password must contain at least one number');
        }

        if (reqs.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
            issues.push('Password must contain at least one special character');
        }

        return {
            isValid: issues.length === 0,
            issues: issues,
            strength: this.calculatePasswordStrength(password)
        };
    }

    calculatePasswordStrength(password) {
        let score = 0;
        let feedback = [];

        // Length scoring
        if (password.length >= 8) score += 25;
        if (password.length >= 12) score += 25;
        if (password.length >= 16) score += 10;

        // Character type scoring
        if (/[a-z]/.test(password)) score += 10;
        if (/[A-Z]/.test(password)) score += 10;
        if (/[0-9]/.test(password)) score += 10;
        if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 10;

        // Complexity scoring
        const uniqueChars = new Set(password).size;
        if (uniqueChars >= password.length * 0.6) score += 10;

        // Determine strength level
        let level;
        if (score < 30) {
            level = 'weak';
            feedback.push('Consider using a longer password with mixed characters');
        } else if (score < 60) {
            level = 'fair';
            feedback.push('Good password, consider adding special characters');
        } else if (score < 80) {
            level = 'good';
            feedback.push('Strong password');
        } else {
            level = 'excellent';
            feedback.push('Excellent password strength');
        }

        return {
            score: Math.min(score, 100),
            level: level,
            feedback: feedback
        };
    }

    // Utility methods
    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    replaceRandomChar(str, charset) {
        const randomIndex = Math.floor(Math.random() * str.length);
        const randomChar = charset.charAt(Math.floor(Math.random() * charset.length));
        return str.substring(0, randomIndex) + randomChar + str.substring(randomIndex + 1);
    }

    // Preset generators for common scenarios
    generateDemoCredentials() {
        return this.generateCredentialSet('universal', {
            customPrefix: 'demo',
            simplePassword: true
        });
    }

    generateTestCredentials() {
        return this.generateCredentialSet('universal', {
            customPrefix: 'test',
            simplePassword: true
        });
    }

    generateSecureCredentials() {
        return this.generateCredentialSet('regular', {
            passwordOptions: {
                includeSymbols: true,
                length: 16
            }
        });
    }

    generateTeamCredentials() {
        return this.generateCredentialSet('universal', {
            customPrefix: 'team',
            simplePassword: false
        });
    }

    // Bulk generation
    generateMultipleCredentials(count, type = 'regular', options = {}) {
        const credentials = [];
        for (let i = 0; i < count; i++) {
            credentials.push(this.generateCredentialSet(type, options));
        }
        return credentials;
    }
}

// Initialize credential generator
window.credentialGenerator = new CredentialGenerator(); 