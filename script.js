class AIChat {
    constructor() {
        // Check authentication first
        this.currentUser = AuthManager.checkAuth();
        if (!this.currentUser) {
            return; // Will redirect to login
        }
        
        // Load API key from config first, then localStorage
        this.apiKey = this.loadApiKey();
        this.currentModel = localStorage.getItem('current_model') || this.getDefaultModel();
        this.conversations = JSON.parse(localStorage.getItem('conversations')) || [];
        this.currentConversationId = null;
        this.messages = [];
        
        this.init();
    }

    loadApiKey() {
        // For backwards compatibility, try to load any available API key
        if (typeof window.CONFIG !== 'undefined') {
            if (window.CONFIG.GODFOREVER_API_KEY) {
                console.log('✅ Loaded GodForever API key from config.js');
                return window.CONFIG.GODFOREVER_API_KEY;
            }
            if (window.CONFIG.API_KEY) {
                console.log('✅ Loaded API key from config.js');
                return window.CONFIG.API_KEY;
            }
        }
        
        // Fall back to localStorage
        const storedKey = localStorage.getItem('godforever_api_key');
        if (storedKey) {
            console.log('✅ Loaded API key from localStorage');
            return storedKey;
        }
        
        console.log('⚠️ No API key found - please enter one');
        return '';
    }

    getApiKeyForModel(model) {
        // Determine which API key to use based on the model
        const openaiModels = [
            'gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini',
            'o1-preview', 'o1-mini', 'gpt-4-preview'
        ];
        
        const isOpenAIModel = openaiModels.some(openaiModel => model.includes(openaiModel));
        
        if (isOpenAIModel) {
            // Use OpenAI API key for OpenAI models
            if (typeof window.CONFIG !== 'undefined' && window.CONFIG.OPENAI_API_KEY) {
                return window.CONFIG.OPENAI_API_KEY;
            }
            return localStorage.getItem('openai_api_key') || this.apiKey;
        } else {
            // Use GodForever API key for other models
            if (typeof window.CONFIG !== 'undefined' && window.CONFIG.GODFOREVER_API_KEY) {
                return window.CONFIG.GODFOREVER_API_KEY;
            }
            return this.apiKey;
        }
    }

    getApiUrlForModel(model) {
        // Determine which API URL to use based on the model
        const openaiModels = [
            'gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini',
            'o1-preview', 'o1-mini', 'gpt-4-preview'
        ];
        
        const isOpenAIModel = openaiModels.some(openaiModel => model.includes(openaiModel));
        
        if (isOpenAIModel) {
            // Use OpenAI API for OpenAI models
            return (typeof window.CONFIG !== 'undefined' && window.CONFIG.OPENAI_API_URL) 
                ? window.CONFIG.OPENAI_API_URL 
                : 'https://api.openai.com/v1';
        } else {
            // Use GodForever API for other models
            return (typeof window.CONFIG !== 'undefined' && window.CONFIG.GODFOREVER_API_URL) 
                ? window.CONFIG.GODFOREVER_API_URL 
                : 'https://api.red-pill.ai/v1';
        }
    }

    getDefaultModel() {
        return (typeof window.CONFIG !== 'undefined' && window.CONFIG.DEFAULT_MODEL) 
            ? window.CONFIG.DEFAULT_MODEL 
            : 'gpt-4o-mini';
    }

    init() {
        this.initElements();
        this.bindEvents();
        this.loadState();
        this.updateUI();
    }

    initElements() {
        // Get all DOM elements
        this.apiKeyInput = document.getElementById('apiKey');
        this.saveApiKeyBtn = document.getElementById('saveApiKey');
        this.openaiApiKeyInput = document.getElementById('openaiApiKey');
        this.saveOpenaiApiKeyBtn = document.getElementById('saveOpenaiApiKey');
        this.modelSelect = document.getElementById('modelSelect');
        
        // User interface elements
        this.userNameEl = document.getElementById('userName');
        this.userRoleEl = document.getElementById('userRole');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.adminActions = document.getElementById('adminActions');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.conversationList = document.getElementById('conversationList');
        this.newChatBtn = document.getElementById('newChat');
        this.clearChatBtn = document.getElementById('clearChat');
        this.currentModelSpan = document.getElementById('currentModel');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    }

    bindEvents() {
        // API Key events
        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveApiKey();
        });
        
        // OpenAI API Key events
        this.saveOpenaiApiKeyBtn.addEventListener('click', () => this.saveOpenaiApiKey());
        this.openaiApiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveOpenaiApiKey();
        });

        // Model selection
        this.modelSelect.addEventListener('change', (e) => this.changeModel(e.target.value));

        // Message input events
        this.messageInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
        this.messageInput.addEventListener('input', () => this.autoResize());
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // Chat management
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        this.clearChatBtn.addEventListener('click', () => this.clearCurrentChat());

        // Sidebar toggles
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.mobileSidebarToggle.addEventListener('click', () => this.toggleSidebar());
        
        // User management
        this.logoutBtn.addEventListener('click', () => this.handleLogout());

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!this.sidebar.contains(e.target) && !this.mobileSidebarToggle.contains(e.target)) {
                    this.sidebar.classList.remove('open');
                }
            }
        });
    }

    loadState() {
        // Load user information
        this.loadUserInfo();
        
        // Load API keys
        if (this.apiKey) {
            this.apiKeyInput.value = this.apiKey;
        }
        
        // Load OpenAI API key
        const openaiKey = localStorage.getItem('openai_api_key') || 
            (typeof window.CONFIG !== 'undefined' && window.CONFIG.OPENAI_API_KEY ? window.CONFIG.OPENAI_API_KEY : '');
        if (openaiKey) {
            this.openaiApiKeyInput.value = openaiKey;
        }

        // Load model selection
        this.modelSelect.value = this.currentModel;

        // Load conversations
        this.renderConversations();

        // Load last conversation
        if (this.conversations.length > 0 && !this.currentConversationId) {
            this.loadConversation(this.conversations[0].id);
        }
    }

    updateUI() {
        // Update model display with provider info
        const modelOption = this.modelSelect.querySelector(`option[value="${this.currentModel}"]`);
        if (modelOption && this.currentModel) {
            const apiUrl = this.getApiUrlForModel(this.currentModel);
            const isOpenAI = apiUrl.includes('openai.com');
            const provider = isOpenAI ? 'OpenAI' : 'GodForever';
            const providerIcon = isOpenAI ? '🤖' : '✨';
            this.currentModelSpan.textContent = `${modelOption.textContent} ${providerIcon} (${provider})`;
        } else {
            this.currentModelSpan.textContent = 'No model selected';
        }

        // Enable/disable send button
        const hasApiKey = this.apiKey && this.apiKey.length > 0;
        const hasModel = this.currentModel && this.currentModel.length > 0;
        const hasMessage = this.messageInput.value.trim().length > 0;
        
        this.sendButton.disabled = !hasApiKey || !hasModel || !hasMessage;

        // Update input placeholder
        if (!hasApiKey) {
            this.messageInput.placeholder = 'Please enter your GodForever API key first...';
            this.messageInput.disabled = true;
        } else if (!hasModel) {
            this.messageInput.placeholder = 'Please select a model first...';
            this.messageInput.disabled = true;
        } else {
            this.messageInput.placeholder = 'Type your message here... (Press Enter to send, Shift+Enter for new line)';
            this.messageInput.disabled = false;
        }
    }

    saveApiKey() {
        const key = this.apiKeyInput.value.trim();
        if (key) {
            this.apiKey = key;
            localStorage.setItem('godforever_api_key', key);
            this.showNotification('GodForever API key saved successfully!', 'success');
        } else {
            this.showNotification('Please enter a valid API key', 'error');
        }
        this.updateUI();
    }

    saveOpenaiApiKey() {
        const key = this.openaiApiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('openai_api_key', key);
            this.showNotification('OpenAI API key saved successfully!', 'success');
        } else {
            localStorage.removeItem('openai_api_key');
            this.showNotification('OpenAI API key cleared', 'info');
        }
        this.updateUI();
    }

    changeModel(model) {
        this.currentModel = model;
        localStorage.setItem('current_model', model);
        this.updateUI();
        
        if (model) {
            const modelOption = this.modelSelect.querySelector(`option[value="${model}"]`);
            this.showNotification(`Switched to ${modelOption.textContent}`, 'info');
        }
    }

    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    autoResize() {
        const textarea = this.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        this.updateUI();
    }



    async callGodForeverAPI(messages) {
        // Format messages for the API
        const apiMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Get the appropriate API key and URL for this model
        const apiKey = this.getApiKeyForModel(this.currentModel);
        const apiBaseUrl = this.getApiUrlForModel(this.currentModel);
        
        // Get config values
        const maxTokens = (typeof window.CONFIG !== 'undefined' && window.CONFIG.MAX_TOKENS) 
            ? window.CONFIG.MAX_TOKENS 
            : 2048;
        const temperature = (typeof window.CONFIG !== 'undefined' && window.CONFIG.TEMPERATURE) 
            ? window.CONFIG.TEMPERATURE 
            : 0.7;

        // Determine API provider for logging
        const isOpenAI = apiBaseUrl.includes('openai.com');
        const provider = isOpenAI ? 'OpenAI' : 'GodForever';

        // Log API call if debug mode is enabled
        if (typeof window.CONFIG !== 'undefined' && window.CONFIG.LOG_API_CALLS) {
            console.log(`🔗 ${provider} API Call:`, {
                model: this.currentModel,
                messages: apiMessages.length,
                maxTokens,
                temperature,
                apiUrl: apiBaseUrl
            });
        }

        const response = await fetch(`${apiBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: this.currentModel,
                messages: apiMessages,
                max_tokens: maxTokens,
                temperature: temperature,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            return {
                content: data.choices[0].message.content
            };
        } else {
            throw new Error('No response from AI model');
        }
    }

    addMessage(role, content) {
        const message = {
            role,
            content,
            timestamp: new Date().toISOString()
        };

        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }

    renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = message.role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (message.role === 'assistant') {
            // Render markdown for assistant messages
            contentDiv.innerHTML = marked.parse(message.content);
        } else {
            contentDiv.textContent = message.content;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);

        // Remove welcome message if it exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        this.chatMessages.appendChild(messageDiv);
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    startNewChat() {
        const conversation = {
            id: this.generateId(),
            title: 'New Chat',
            model: this.currentModel,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.conversations.unshift(conversation);
        this.currentConversationId = conversation.id;
        this.messages = [];
        
        this.clearChatDisplay();
        this.renderConversations();
        this.saveConversations();
        
        this.showNotification('Started new chat', 'info');
    }

    loadConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        this.currentConversationId = conversationId;
        this.messages = [...conversation.messages];
        this.currentModel = conversation.model;
        
        this.modelSelect.value = this.currentModel;
        this.clearChatDisplay();
        
        if (this.messages.length === 0) {
            this.showWelcomeMessage();
        } else {
            this.messages.forEach(message => this.renderMessage(message));
        }
        
        this.updateUI();
        this.renderConversations();
    }

    clearCurrentChat() {
        if (this.currentConversationId) {
            this.conversations = this.conversations.filter(c => c.id !== this.currentConversationId);
            this.saveConversations();
        }
        
        this.currentConversationId = null;
        this.messages = [];
        this.clearChatDisplay();
        this.renderConversations();
        
        this.showNotification('Chat cleared', 'info');
    }

    clearChatDisplay() {
        this.chatMessages.innerHTML = '';
        this.showWelcomeMessage();
    }

    showWelcomeMessage() {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <div class="welcome-content">
                <h3><i class="fas fa-robot"></i> Welcome to AI Chat</h3>
                                        <p>Powered by GodForever - Your gateway to seamless, affordable AI access</p>
                <div class="welcome-steps">
                    <div class="step">
                        <i class="fas fa-key"></i>
                                                        <span>1. Enter your GodForever API key</span>
                    </div>
                    <div class="step">
                        <i class="fas fa-cog"></i>
                        <span>2. Choose from 200+ AI models</span>
                    </div>
                    <div class="step">
                        <i class="fas fa-comment"></i>
                        <span>3. Start chatting!</span>
                    </div>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(welcomeDiv);
    }

    updateConversation() {
        if (!this.currentConversationId) return;

        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (!conversation) return;

        conversation.messages = [...this.messages];
        conversation.updatedAt = new Date().toISOString();
        
        // Update title from first user message
        if (this.messages.length > 0) {
            const firstUserMessage = this.messages.find(m => m.role === 'user');
            if (firstUserMessage) {
                conversation.title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
            }
        }

        this.saveConversations();
        this.renderConversations();
    }

    renderConversations() {
        this.conversationList.innerHTML = '';
        
        this.conversations.forEach(conversation => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            if (conversation.id === this.currentConversationId) {
                item.classList.add('active');
            }

            const lastMessage = conversation.messages.length > 0 
                ? conversation.messages[conversation.messages.length - 1]
                : null;

            item.innerHTML = `
                <div class="title">${conversation.title}</div>
                <div class="preview">${lastMessage ? lastMessage.content.slice(0, 60) + '...' : 'No messages'}</div>
                <div class="date">${this.formatDate(conversation.updatedAt)}</div>
            `;

            item.addEventListener('click', () => this.loadConversation(conversation.id));
            this.conversationList.appendChild(item);
        });
    }

    saveConversations() {
        localStorage.setItem('conversations', JSON.stringify(this.conversations));
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('open');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;

        // Set colors based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#10a37f';
                break;
            case 'error':
                notification.style.backgroundColor = '#ff6b6b';
                break;
            case 'info':
            default:
                notification.style.backgroundColor = '#3b82f6';
                break;
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // User management methods
    loadUserInfo() {
        if (this.currentUser) {
            this.userNameEl.textContent = this.currentUser.username;
            
            // Show special indicator for universal users
            if (this.currentUser.universalType) {
                this.userRoleEl.innerHTML = `
                    <span style="color: #3b82f6;">🌐 ${this.currentUser.role}</span>
                    <span style="font-size: 10px; color: #888; margin-left: 4px;">(${this.currentUser.universalType})</span>
                `;
                this.userRoleEl.className = `user-role ${this.currentUser.role} universal-user`;
            } else {
                this.userRoleEl.textContent = this.currentUser.role;
                this.userRoleEl.className = `user-role ${this.currentUser.role}`;
            }
            
            // Show admin actions for administrators (but not for universal accounts)
            if (this.currentUser.permissions.includes('user_management') && !this.currentUser.universalType) {
                this.adminActions.style.display = 'block';
            } else {
                this.adminActions.style.display = 'none';
            }
            
            // Apply role-based restrictions
            this.applyRoleRestrictions();
            
            // Start session monitoring
            this.startSessionMonitoring();
        }
    }

    applyRoleRestrictions() {
        if (!this.currentUser) return;

        const isAdministrator = this.currentUser.role === 'administrator';
        const isUniversalUser = this.currentUser.universalType ? true : false;
        const isGuest = this.currentUser.role === 'guest';

        // Hide API key sections for ALL users except administrators
        if (!isAdministrator) {
            this.hideApiKeySection();
            
            // Show appropriate notice based on user type
            if (isUniversalUser) {
                this.showUniversalUserNotice();
            } else {
                this.showNonAdminNotice();
            }
        } else {
            // Show API key sections for administrators
            this.showApiKeySection();
        }

        // Hide advanced models for guests only
        if (isGuest) {
            this.filterModelsForRole();
        }

        // Show API access status
        if (!this.currentUser.apiAccess) {
            this.showNotification('Limited access: API features restricted for your account', 'info');
        }
    }

    hideApiKeySection() {
        // Hide API key input sections for non-administrators
        const apiKeySection = document.querySelector('.api-key-section');
        const openaiKeySection = document.querySelector('.openai-key-section');
        
        if (apiKeySection) {
            apiKeySection.style.display = 'none';
        }
        if (openaiKeySection) {
            openaiKeySection.style.display = 'none';
        }

        // Hide individual elements if sections don't exist
        if (this.apiKeyInput) this.apiKeyInput.parentElement.style.display = 'none';
        if (this.openaiApiKeyInput) this.openaiApiKeyInput.parentElement.style.display = 'none';
        if (this.saveApiKeyBtn) this.saveApiKeyBtn.style.display = 'none';
        if (this.saveOpenaiApiKeyBtn) this.saveOpenaiApiKeyBtn.style.display = 'none';
    }

    showApiKeySection() {
        // Show API key input sections for administrators
        const apiKeySection = document.querySelector('.api-key-section');
        const openaiKeySection = document.querySelector('.openai-key-section');
        
        if (apiKeySection) {
            apiKeySection.style.display = 'block';
        }
        if (openaiKeySection) {
            openaiKeySection.style.display = 'block';
        }

        // Show individual elements
        if (this.apiKeyInput) this.apiKeyInput.parentElement.style.display = 'block';
        if (this.openaiApiKeyInput) this.openaiApiKeyInput.parentElement.style.display = 'block';
        if (this.saveApiKeyBtn) this.saveApiKeyBtn.style.display = 'inline-block';
        if (this.saveOpenaiApiKeyBtn) this.saveOpenaiApiKeyBtn.style.display = 'inline-block';
        
        // Remove any existing notices
        this.removeNotices();
    }

    showNonAdminNotice() {
        // Show a notice that API keys are managed by administrators for regular users
        const notice = document.createElement('div');
        notice.className = 'non-admin-notice';
        notice.innerHTML = `
            <div style="
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid #3b82f6;
                border-radius: 8px;
                padding: 12px;
                margin: 10px 0;
                color: #3b82f6;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>🔐 Administrator Only</strong><br>
                    API key management is restricted to administrators. All models and features are pre-configured for your use.
                </div>
            </div>
        `;

        // Insert the notice where API key section would be
        const sidebar = document.querySelector('.sidebar-content');
        if (sidebar && !sidebar.querySelector('.non-admin-notice')) {
            const modelSection = sidebar.querySelector('.model-selection');
            if (modelSection) {
                modelSection.parentNode.insertBefore(notice, modelSection.nextSibling);
            } else {
                sidebar.appendChild(notice);
            }
        }
    }

    removeNotices() {
        // Remove any existing access notices
        const universalNotice = document.querySelector('.universal-user-notice');
        const nonAdminNotice = document.querySelector('.non-admin-notice');
        
        if (universalNotice) {
            universalNotice.remove();
        }
        if (nonAdminNotice) {
            nonAdminNotice.remove();
        }
    }

    showUniversalUserNotice() {
        // Show a notice that API keys are managed by administrators
        const notice = document.createElement('div');
        notice.className = 'universal-user-notice';
        notice.innerHTML = `
            <div style="
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid #3b82f6;
                border-radius: 8px;
                padding: 12px;
                margin: 10px 0;
                color: #3b82f6;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>🌐 Universal Account</strong><br>
                    API keys are pre-configured by administrators. You have full access to all features without managing keys.
                </div>
            </div>
        `;

        // Insert the notice where API key section would be
        const sidebar = document.querySelector('.sidebar-content');
        if (sidebar && !sidebar.querySelector('.universal-user-notice')) {
            const modelSection = sidebar.querySelector('.model-selection');
            if (modelSection) {
                modelSection.parentNode.insertBefore(notice, modelSection.nextSibling);
            } else {
                sidebar.appendChild(notice);
            }
        }
    }

    filterModelsForRole() {
        const modelSelect = this.modelSelect;
        const options = Array.from(modelSelect.options);
        
        if (this.currentUser.role === 'guest') {
            // Only show basic models for guests
            const allowedModels = ['gpt-3.5-turbo', 'gpt-4o-mini'];
            
            options.forEach(option => {
                if (option.value && !allowedModels.includes(option.value)) {
                    option.style.display = 'none';
                    option.disabled = true;
                }
            });
            
            // Reset to allowed model if current model is restricted
            if (!allowedModels.includes(this.currentModel)) {
                this.currentModel = 'gpt-4o-mini';
                modelSelect.value = this.currentModel;
                localStorage.setItem('current_model', this.currentModel);
            }
        }
    }

    handleLogout() {
        const confirmLogout = confirm('Are you sure you want to logout?');
        if (confirmLogout) {
            this.showNotification('Logging out...', 'info');
            setTimeout(() => {
                AuthManager.logout();
            }, 1000);
        }
    }

    // Override sendMessage to add permission checks
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || !this.apiKey || !this.currentModel) return;

        // Check user permissions
        if (!this.currentUser.apiAccess && this.currentUser.role === 'guest') {
            this.showNotification('API access restricted. Please contact administrator.', 'error');
            return;
        }

        // Check if user has permission for this action
        if (!this.currentUser.permissions.includes('chat_access') && 
            !this.currentUser.permissions.includes('full_access')) {
            this.showNotification('You do not have permission to use chat features.', 'error');
            return;
        }

        // Create conversation if none exists
        if (!this.currentConversationId) {
            this.startNewChat();
        }

        // Add user message
        this.addMessage('user', message);
        this.messageInput.value = '';
        this.autoResize();
        this.updateUI();

        // Show loading
        this.showLoading(true);

        try {
            // Log API usage for audit trail
            if (this.currentUser.role !== 'guest') {
                console.log(`🔍 API Call by ${this.currentUser.username} (${this.currentUser.role}):`, {
                    model: this.currentModel,
                    timestamp: new Date().toISOString(),
                    messageCount: this.messages.length
                });
            }

            // Call GodForever API
            const response = await this.callGodForeverAPI(this.messages);
            
            if (response && response.content) {
                this.addMessage('assistant', response.content);
                this.updateConversation();
            } else {
                throw new Error('Invalid response from API');
            }
        } catch (error) {
            console.error('Error calling API:', error);
            this.addMessage('assistant', `❌ Error: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    // Session management methods
    startSessionMonitoring() {
        // Check session validity every minute
        this.sessionInterval = setInterval(() => {
            this.checkSessionValidity();
        }, 60000); // 1 minute

        // Initial check
        this.checkSessionValidity();
        
        // Add session info to user details
        this.displaySessionInfo();
    }

    checkSessionValidity() {
        const session = AuthManager.getStoredSession();
        if (!session || !AuthManager.isSessionValid(session)) {
            this.handleSessionExpiry();
        } else {
            this.updateSessionCountdown(session);
        }
    }

    handleSessionExpiry() {
        clearInterval(this.sessionInterval);
        this.showNotification('Your session has expired. Please log in again.', 'warning');
        
        setTimeout(() => {
            AuthManager.logout();
        }, 3000);
    }

    updateSessionCountdown(session) {
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        const remainingTime = expiresAt - now;
        
        if (remainingTime > 0) {
            const hours = Math.floor(remainingTime / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            
            // Update session info display
            const sessionInfoEl = document.getElementById('sessionTimeRemaining');
            if (sessionInfoEl) {
                sessionInfoEl.textContent = `${hours}h ${minutes}m remaining`;
                
                // Change color based on remaining time
                if (remainingTime < 30 * 60 * 1000) { // Less than 30 minutes
                    sessionInfoEl.style.color = '#ff6b6b';
                } else if (remainingTime < 2 * 60 * 60 * 1000) { // Less than 2 hours
                    sessionInfoEl.style.color = '#f59e0b';
                } else {
                    sessionInfoEl.style.color = '#10a37f';
                }
            }
        }
    }

    displaySessionInfo() {
        const session = AuthManager.getStoredSession();
        if (session) {
            const sessionDuration = this.formatDuration(session.sessionDuration || 28800000);
            const loginTime = new Date(session.loginTime).toLocaleString();
            const expiresAt = new Date(session.expiresAt).toLocaleString();
            
            // Add session info to user details
            const userDetails = this.userRoleEl.parentElement;
            
            // Check if session info already exists
            let sessionInfoContainer = document.getElementById('sessionInfoContainer');
            if (!sessionInfoContainer) {
                sessionInfoContainer = document.createElement('div');
                sessionInfoContainer.id = 'sessionInfoContainer';
                sessionInfoContainer.style.cssText = `
                    margin-top: 8px;
                    font-size: 11px;
                    color: #888;
                    border-top: 1px solid #404040;
                    padding-top: 8px;
                `;
                
                sessionInfoContainer.innerHTML = `
                    <div>Session: ${sessionDuration}</div>
                    <div>Login: ${loginTime}</div>
                    <div id="sessionTimeRemaining" style="font-weight: 500;">Calculating...</div>
                `;
                
                userDetails.appendChild(sessionInfoContainer);
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

    // Override handleLogout to clear session monitoring
    handleLogout() {
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
        }
        
        const confirmLogout = confirm('Are you sure you want to logout?');
        if (confirmLogout) {
            this.showNotification('Logging out...', 'info');
            setTimeout(() => {
                AuthManager.logout();
            }, 1000);
        }
    }
}

// Add CSS for notifications
const notificationCSS = `
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

// Add the CSS to the document
const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiChat = new AIChat();
});

// Add some utility functions for better UX
window.addEventListener('beforeunload', (e) => {
    // Save current state before leaving
    if (window.aiChat) {
        window.aiChat.updateConversation();
    }
});

// Handle paste events for the message input
document.addEventListener('paste', (e) => {
    if (e.target === document.getElementById('messageInput')) {
        // Handle pasted content (could add image paste support here)
        setTimeout(() => {
            window.aiChat.autoResize();
            window.aiChat.updateUI();
        }, 10);
    }
}); 