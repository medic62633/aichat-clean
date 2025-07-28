# AI Chat - Powered by GodForever

A modern, ChatGPT-like web interface that provides access to over 200 AI models through GodForever's unified API. This application offers a sleek, responsive design with support for multiple AI providers including OpenAI, Anthropic, Google, Meta, DeepSeek, Mistral, and xAI.

![AI Chat Interface](https://via.placeholder.com/800x400/212121/ffffff?text=AI+Chat+Interface)

## ✨ Features

### 🤖 Multiple AI Models with Smart API Routing
- **200+ AI Models** from leading providers
- **Intelligent API Selection**: Automatically uses OpenAI API for OpenAI models, GodForever for others
- **OpenAI Direct**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, o1 Preview, o1 Mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Google**: Gemini 2.0 Flash, Gemini 2.0 Flash Experimental
- **Meta**: Llama 3.3 70B, Llama 3.2 90B Vision
- **DeepSeek**: DeepSeek V3, DeepSeek R1
- **Mistral**: Mixtral 8x7B, Mistral Nemo
- **xAI**: Grok 3 Beta, Grok 3 Mini

### 💬 Chat Features
- **Real-time messaging** with streaming responses
- **Markdown rendering** for formatted text, code blocks, and lists
- **Message history** with persistent storage
- **Multiple conversations** management
- **Auto-resizing input** for comfortable typing
- **Copy and share** conversations

### 🎨 Modern UI/UX
- **Dark theme** optimized for extended use
- **Responsive design** works on desktop, tablet, and mobile
- **Smooth animations** and transitions
- **ChatGPT-like interface** for familiar experience
- **Sidebar navigation** with collapsible design
- **Loading indicators** and status updates

### 🔐 Authentication & Security
- **User authentication** with role-based access control
- **Multi-user support**: Administrator, User, and Guest roles
- **Universal login** for shared access scenarios (testing, demos, giveaways)
- **Session management** with automatic timeout and remember-me option
- **Rate limiting** protection against brute force attacks
- **Account lockout** after failed login attempts
- **Audit logging** for API usage tracking

#### 🌐 Universal Login System
Universal accounts allow **multiple users to share the same login credentials simultaneously**. Perfect for:

- **Testing & Development**: Shared QA accounts
- **Demos & Presentations**: Multiple presenters using same account
- **Giveaways & Community**: Free access accounts for events
- **Team Collaboration**: Shared project accounts

**Pre-configured Universal Accounts:**
- **test** - Testing account (10 concurrent users)
- **demo** - Demo account (5 concurrent users) 
- **giveaway** - Free community account (50 concurrent users)
- **team** - Team collaboration account (20 concurrent users)

*Note: Universal accounts are available but not displayed on the login page for security. Contact your administrator for access credentials.*

**🔒 Security Features:**
- **API Key Protection**: Only administrators can view or modify API keys
- **Role-Based Access**: API key management restricted to administrator accounts
- **Admin Restrictions**: User management and system settings for administrators only
- **Pre-configured Access**: API keys are centrally managed by administrators
- **Secure Login**: Universal accounts are not exposed on the login interface
- **Visual Indicators**: Clear UI showing account type and access level

### 🔒 Privacy & Security
- **Local storage** for API keys and conversations
- **No data sent to external servers** (except GodForever API)
- **Secure API key handling** with masked input and config file support
- **Client-side processing** for maximum privacy
- **Config file approach** keeps API keys out of version control
- **Automatic gitignore** for sensitive configuration files

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A GodForever API key
- Basic understanding of the demo user accounts (see User Accounts section)

### Installation

#### Quick Setup (Recommended)
```bash
# Clone or download the repository
git clone <repository-url>
cd ai-chat-godforever

# Run setup script (Unix/Linux/Mac)
./setup.sh

# OR manually copy config (All platforms)
cp config.example.js config.js
# Edit config.js with your API key
```

#### Manual Installation
1. **Download or clone** this repository
2. **Set up your API key**:
   - Copy `config.example.js` to `config.js`
   - Edit `config.js` and add your GodForever API key
   - Or enter it manually in the sidebar later
3. **Open `index.html`** in your web browser
4. **Select an AI model** from the dropdown
5. **Start chatting!**

### No Server Required
This is a purely client-side application - no server setup needed! Just open the HTML file in your browser and you're ready to go.

## 👥 User Accounts & Authentication

The application includes a complete authentication system with role-based access control. You must log in to access the chat interface.

### Default User Accounts

#### 🔑 Administrator Account
- **Username**: `admin`
- **Password**: `admin123`
- **Permissions**: Full access to all features, API management, user management
- **Features**: All models, API key configuration, audit logs

#### 👤 Demo User Account
- **Username**: `demo`
- **Password**: `demo123`
- **Permissions**: Standard user access
- **Features**: Most models, chat functionality, conversation history

#### 🔓 Guest Account
- **Username**: `guest`
- **Password**: `guest123`
- **Permissions**: Limited access
- **Features**: Basic models only (GPT-3.5 Turbo, GPT-4o Mini), no API key modification

### Authentication Features

- **Secure Sessions**: 24-hour session timeout with remember-me option
- **Rate Limiting**: Protection against brute force attacks (5 attempts, 15-minute lockout)
- **Role-Based Access**: Different features available based on user role
- **Audit Logging**: Track API usage and user activities
- **Account Security**: Automatic session cleanup and secure logout

### First Time Setup

1. **Open the application** and you'll see the login page
2. **Use the "Try Demo Login"** button to automatically fill admin credentials
3. **Or enter credentials manually** from the accounts listed above
4. **Configure your API keys** once logged in (if you have admin/user role)
5. **Start chatting** with your preferred AI model

> **Security Note**: In a production environment, change these default passwords immediately and implement proper user management with secure password hashing.

## 🔧 Configuration

### API Key Setup

#### Option 1: Using Config File (Recommended for Development)
1. **Copy the example config**: `cp config.example.js config.js`
2. **Edit config.js** and add your API keys:
   - Replace `'your-godforever-api-key-here'` with your GodForever API key
   - Replace `'your-openai-api-key-here'` with your OpenAI API key (optional)
3. **The application will automatically load** your API keys from the config file
4. **config.js is gitignored** for security

#### Option 2: Using the UI (Recommended for Production)
1. Visit GodForever and create an account
2. Generate an API key from your dashboard
3. Enter the API key in the sidebar of the application
4. Click "Save" to store it locally

### Model Selection & Multi-Provider Support
Choose from over 200 available models with **automatic API routing**:

#### **OpenAI Models** (Direct OpenAI API) 🤖
- **GPT-4o, GPT-4o Mini** - Latest and most capable
- **GPT-4 Turbo, GPT-4** - Previous generation
- **o1 Preview, o1 Mini** - Advanced reasoning models

#### **Other Models** (GodForever API) ✨
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Google**: Gemini 2.0 Flash, Gemini 2.0 Flash Experimental
- **Meta**: Llama 3.3 70B, Llama 3.2 90B Vision
- **DeepSeek**: DeepSeek V3, DeepSeek R1
- **Mistral**: Mixtral 8x7B, Mistral Nemo
- **xAI**: Grok 3 Beta, Grok 3 Mini

The application **automatically chooses the right API** based on your model selection!

## 📱 Usage

### Starting a Conversation
1. **Enter your API key** and select a model
2. **Type your message** in the input field at the bottom
3. **Press Enter** to send (Shift+Enter for new lines)
4. **Wait for the AI response** with animated loading indicator

### Managing Conversations
- **New Chat**: Click the "+" button in the sidebar
- **Switch Chats**: Click on any conversation in the sidebar
- **Clear Chat**: Click the trash icon in the chat header
- **Auto-save**: All conversations are automatically saved locally

### Keyboard Shortcuts
- **Enter**: Send message
- **Shift + Enter**: New line in message
- **Escape**: Close any open modals

## 🔌 API Integration

This application uses the GodForever unified API, which provides:

### Endpoint
```
POST https://api.red-pill.ai/v1/chat/completions
```

### Request Format
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "max_tokens": 2048,
  "temperature": 0.7
}
```

### Authentication
```javascript
Headers: {
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

## 💰 Pricing

GodForever offers competitive pricing with the same rates as official providers, plus:
- **Discounted credit packages** available
- **No subscription fees** - pay per use
- **Transparent pricing** - see costs upfront
- **Free tier** available for testing

Contact GodForever for current rates.

## 🛠️ Technical Details

### Technologies Used
- **HTML5** for structure
- **CSS3** with Flexbox and Grid for styling
- **Vanilla JavaScript** for functionality
- **Marked.js** for markdown rendering
- **Font Awesome** for icons
- **Inter font** for typography

### Browser Support
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

### Performance
- **Fast loading** - minimal dependencies
- **Efficient rendering** - optimized DOM updates
- **Memory management** - automatic cleanup
- **Responsive** - smooth on all devices

## 🔧 Customization

### Styling
The CSS is modular and easy to customize:
- **Colors**: Modify the CSS variables at the top of `styles.css`
- **Fonts**: Change the font family in the body selector
- **Layout**: Adjust the sidebar width and responsive breakpoints

### Models
Add new models by updating the `modelSelect` options in `index.html`:
```html
<option value="new-model-id">New Model Name</option>
```

### API Endpoint
To use a different API provider, modify the `callGodForeverAPI` method in `script.js`:
```javascript
const response = await fetch('https://your-api-endpoint.com/chat', {
  // ... configuration
});
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup
1. Clone the repository
2. Open `index.html` in your browser
3. Make changes and refresh to test
4. Use browser developer tools for debugging

## 📋 Todo / Roadmap

- [ ] **Image uploads** for vision models
- [ ] **File attachments** support
- [ ] **Export conversations** to various formats
- [ ] **Search** within conversation history
- [ ] **Themes** (light mode, custom themes)
- [ ] **Plugins** system for extensions
- [ ] **Voice input/output** support
- [ ] **Collaboration** features

## 🐛 Troubleshooting

### Common Issues

**API Key Not Working**
- Ensure you've entered the correct API key
- Check that your GodForever account has sufficient credits
- Verify the API key has the necessary permissions

**Model Not Responding**
- Try switching to a different model
- Check your internet connection
- Verify the model is available in your region

**UI Not Loading Properly**
- Ensure JavaScript is enabled in your browser
- Try hard refreshing the page (Ctrl+Shift+R)
- Clear browser cache and local storage

**Mobile Issues**
- Ensure you're using a modern mobile browser
- Try rotating your device for better experience
- Check that JavaScript is enabled

### Getting Help
- Check the GodForever documentation
- Open an issue on this repository
- Contact GodForever support for API-related issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **GodForever** for providing the unified AI API
- **Marked.js** for markdown rendering
- **Font Awesome** for beautiful icons
- **OpenAI, Anthropic, Google, Meta, and other AI providers** for their amazing models

## 📧 Contact

- **Project**: AI Chat Interface
- **Powered by**: GodForever
- **Issues**: Open a GitHub issue
- **Website**: GodForever

---

**Made with ❤️ for the AI community**

Enjoy seamless access to the world's best AI models with this modern, responsive chat interface! 