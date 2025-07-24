# TableTalk Radar - Complete MCP Setup Guide

## 🚀 Quick Installation

```bash
# Make setup script executable
chmod +x setup-mcp.sh

# Run installation
./setup-mcp.sh
```

## 📋 Step-by-Step Setup

### 1. Install All MCP Servers
```bash
npm install -g @context7/craft-seomatic-mcp
npm install -g @context7/magic-mcp  
npm install -g @context7/magicui-mcp
npm install -g @context7/googleapis-mcp
npm install -g @context7/google-my-business-samples-mcp
npm install -g @context7/php-analytics-admin-mcp
npm install -g @context7/supabase-mcp
npm install -g @context7/oauth2-server-mcp
npm install -g @context7/vercel-mcp
```

### 2. Configure Environment Variables

**Option A: System Environment**
```bash
# Add to ~/.bashrc or ~/.zshrc
export GOOGLE_API_KEY="your-api-key"
export SUPABASE_URL="https://pwscfkrouagstuyakfjj.supabase.co"
# ... (add all variables from .env.mcp)
```

**Option B: Claude Code Settings**
```bash
# Copy the mcp-config.json to Claude settings
cp mcp-config.json ~/.claude/settings.json
```

### 3. Configure Claude Code Settings

**Manual Configuration:**
```bash
# Edit Claude Code settings
code ~/.claude/settings.json
```

**Or copy our pre-configured template:**
```bash
# Use our complete configuration
cp mcp-config.json ~/.claude/settings.json
```

### 4. API Keys You'll Need

#### 🔑 Google Services
- **Google API Key**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **OAuth Client ID/Secret**: Google Cloud Console > OAuth 2.0 Client IDs
- **Google My Business**: Enable Google My Business API

#### 🗄️ Supabase (Already Configured)
- **URL**: `https://pwscfkrouagstuyakfjj.supabase.co`  
- **Anon Key**: Already in your `.env.local`
- **Service Role Key**: Already in your `.env.local`

#### 🚀 Vercel
- **API Token**: [Vercel Dashboard](https://vercel.com/account/tokens)
- **Team ID**: Found in Vercel team settings
- **Project ID**: From your project settings

#### 🤖 AI Services (Optional)
- **OpenAI API Key**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Anthropic API Key**: [Anthropic Console](https://console.anthropic.com/)

### 5. Test Installation

```bash
# Restart Claude Code
claude-code --restart

# Test MCP servers
claude-code --test-mcp

# Or check if servers are running
claude-code --mcp-status
```

## 🎯 What Each MCP Server Does

### **googleapis-mcp**
- Google Analytics data
- Search Console integration  
- Google Drive file management
- Gmail API access
- Calendar integration

### **google-my-business-mcp**
- GMB location management
- Review responses
- Post creation and management
- Q&A handling
- Business profile updates

### **supabase-mcp**  
- Database queries and updates
- Real-time subscriptions
- Authentication management
- Edge function deployment
- Storage operations

### **vercel-mcp**
- Deployment management
- Environment variable updates
- Domain configuration
- Build monitoring
- Analytics data

### **oauth2-server-mcp**
- OAuth flow management
- Token refresh handling
- User authentication
- Permission scoping

### **magic-mcp**
- AI-powered code generation
- Intelligent refactoring
- Smart suggestions
- Automated testing

### **magicui-mcp**
- UI component generation
- Design system integration
- Responsive layout creation
- Accessibility improvements

### **php-analytics-admin-mcp**
- Google Analytics Admin API
- Custom reporting
- Goal tracking
- Audience management

### **craft-seomatic-mcp**
- SEO optimization
- Meta tag management
- Schema markup
- Site performance analysis

## 🔧 Troubleshooting

### Common Issues:

**1. MCP Server Not Starting**
```bash
# Check if server is installed
npm list -g @context7/googleapis-mcp

# Reinstall if needed
npm install -g @context7/googleapis-mcp --force
```

**2. Environment Variables Not Loading**
```bash
# Check Claude Code can access env vars
claude-code --env-check

# Or set them directly in settings.json
```

**3. Permission Errors**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

**4. API Authentication Issues**
- Verify API keys are correct
- Check API quotas and limits
- Ensure APIs are enabled in Google Cloud Console

## 🎉 Usage Examples

Once configured, you can use MCP servers directly in Claude Code:

```bash
# Query Supabase data
@supabase SELECT * FROM clients WHERE status = 'active'

# Update Google My Business post
@google-my-business create-post "New location opening soon!"

# Deploy to Vercel
@vercel deploy --production

# Generate UI components
@magicui create-dashboard-widget "client-overview"
```

## 📚 Additional Resources

- [Context7 MCP Documentation](https://context7.com/docs/mcp)
- [Claude Code MCP Guide](https://docs.anthropic.com/claude-code/mcp)
- [Google My Business API Reference](https://developers.google.com/my-business)
- [Supabase API Documentation](https://supabase.com/docs/reference)
- [Vercel API Reference](https://vercel.com/docs/rest-api)

---

🚀 **Your TableTalk Radar project now has supercharged MCP capabilities!**