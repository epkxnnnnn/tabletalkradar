# TableTalk Radar - AI-Powered Restaurant Intelligence

## 🍜 5-AI Restaurant Intelligence That Never Sleeps

TableTalk Radar is an enterprise-grade, AI-powered business intelligence platform specifically designed for restaurant owners and marketing agencies managing restaurant clients. The platform provides comprehensive auditing, monitoring, and optimization recommendations for restaurants' online presence across all digital touchpoints.

## 🚀 Features

- **5-AI Analysis Engine**: Perplexity, Kimi, Claude, OpenAI, and Gemini working together
- **Restaurant-Specific Analysis**: Menu optimization, delivery platforms, local SEO
- **Real-time Review Monitoring**: Continuous tracking across all platforms
- **Automated Email & SMS Reporting**: Professional reports and critical alerts
- **Multi-Client Management**: Perfect for marketing agencies
- **Dark Red Brand Design**: Professional, restaurant-focused UI

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI APIs**: Perplexity, Kimi, Claude, OpenAI, Gemini
- **Communications**: Resend (email), Twilio (SMS)
- **Deployment**: Vercel

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- AI API keys (Perplexity, Kimi, Claude, OpenAI, Gemini)
- Resend account (for emails)
- Twilio account (for SMS)

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/your-username/tabletalk-radar.git
cd tabletalk-radar
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Fill in your API keys in \`.env.local\`

5. Set up Supabase database:
   - Create tables: \`profiles\`, \`clients\`, \`audits\`
   - Enable Row Level Security
   - Set up authentication

6. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Configuration

### Environment Variables

Create a \`.env.local\` file with the following variables:

\`\`\`env
# AI APIs
PERPLEXITY_API_KEY=your_perplexity_key
KIMI_API_KEY=your_kimi_key
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
GOOGLE_GEMINI_API_KEY=your_gemini_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Communications
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=your_sender_email
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
\`\`\`

### Supabase Database Schema

The application requires these tables in your Supabase database:

\`\`\`sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  email TEXT,
  company_name TEXT,
  role TEXT,
  avatar_url TEXT,
  PRIMARY KEY (id)
);

-- Clients table  
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_name TEXT NOT NULL,
  website TEXT,
  address TEXT,
  phone TEXT,
  category TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active'
);

-- Audits table
CREATE TABLE audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  website TEXT,
  category TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  audit_data JSONB NOT NULL,
  status TEXT DEFAULT 'completed'
);
\`\`\`

## 🚀 Deployment

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Add these to your Vercel dashboard:
- All API keys from \`.env.local\`
- Set \`NEXTAUTH_URL\` to your production domain
- Set \`NODE_ENV=production\`

## 📝 Usage

### Running an Audit

1. Fill in business information (name, website, address, phone)
2. Select business category
3. Click "Start Comprehensive 5-AI Audit"
4. Wait for all AI analyses to complete
5. Review results in the dashboard

### Managing Multiple Clients (Agency Mode)

1. Create client profiles in the system
2. Run audits for multiple clients
3. Track historical performance
4. Send automated reports

## 🎨 Design System

The application uses a dark red brand color scheme:
- Primary: #8B0000 (Dark Red)
- Light: #DC143C (Light Red)  
- Deep: #660000 (Deep Red)
- Accent: #FF6B6B (Accent Red)

## 🤖 AI Integration

### Supported AI Providers

- **Perplexity**: Market research and competitor analysis
- **Kimi (Moonshot)**: Technical SEO and website analysis
- **Claude (Anthropic)**: Restaurant industry expertise
- **OpenAI**: Customer sentiment analysis
- **Google Gemini**: Google ecosystem optimization

## 📊 Reporting

### Email Reports
- Audit completion notifications
- Weekly performance summaries
- Critical alerts

### SMS Alerts
- Critical issues requiring immediate attention
- Score improvements
- New review notifications

## 🔐 Security

- Row Level Security enabled in Supabase
- API keys stored as environment variables
- Rate limiting on API endpoints
- Input validation and sanitization

## 🧪 Testing

Run tests:
\`\`\`bash
npm run test
\`\`\`

Run linting:
\`\`\`bash
npm run lint
\`\`\`

## 📈 Performance

- Optimized for Core Web Vitals
- Image optimization with Next.js
- API response caching
- Database query optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@tabletalkradar.com or create an issue in this repository.

## 🗺️ Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] White-label customization
- [ ] API access for enterprise clients
- [ ] Predictive analytics
- [ ] Multi-language support

---

Built with ❤️ for the restaurant industry by the TableTalk Radar team.