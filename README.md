# BusinessScope AI - Universal Business Intelligence Platform

## 📊 5-AI Business Intelligence That Never Sleeps

BusinessScope AI is an enterprise-grade, AI-powered business intelligence platform designed for all types of businesses across every industry. The platform provides comprehensive auditing, monitoring, and optimization recommendations for any business's online presence across all digital touchpoints.

## 🚀 Features

- **5-AI Analysis Engine**: Perplexity, Kimi, Claude, OpenAI, and Gemini working together
- **Universal Business Support**: Works with any business type across all industries
- **Industry-Specific Analysis**: Dynamic analysis tailored to your specific business type
- **Real-time Performance Monitoring**: Continuous tracking across all platforms
- **Automated Email & SMS Reporting**: Professional reports and critical alerts
- **Multi-Client Management**: Perfect for marketing agencies and consultants
- **Professional Design**: Clean, universal business-focused UI

## 🏢 Supported Industries

- **Professional Services**: Law firms, consulting, accounting, marketing agencies
- **Healthcare & Wellness**: Medical practices, dental offices, spas, fitness centers
- **Technology**: Software companies, SaaS platforms, web development, cybersecurity
- **Retail & E-commerce**: Online stores, physical retail, fashion, electronics
- **Financial Services**: Banking, investment firms, insurance, wealth management
- **Manufacturing**: Consumer goods, industrial equipment, pharmaceuticals
- **Education**: Schools, universities, online learning, corporate training
- **Food & Hospitality**: Restaurants, cafes, hotels, catering services
- **Non-Profit**: Charities, foundations, community organizations
- **And Many More**: Startups, family businesses, cooperatives, government agencies

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with industry selection
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
```bash
git clone https://github.com/your-username/businessscope-ai.git
cd businessscope-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your API keys in `.env.local`

5. Set up Supabase database by running the SQL from `supabase-setup.sql`:
   - Create all tables with universal business support
   - Enable Row Level Security
   - Set up authentication with industry fields

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
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
```

### Supabase Database Schema

The application uses a comprehensive universal business schema. Run the complete `supabase-setup.sql` file in your Supabase SQL editor to create all required tables with universal business support including:

- Profiles with industry and business_type fields
- Clients with universal categorization
- Audits with industry-specific data
- Reports with dynamic templates
- Action items and team management
- And more...

## 🚀 Deployment

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Add these to your Vercel dashboard:
- All API keys from `.env.local`
- Set `NEXTAUTH_URL` to your production domain
- Set `NODE_ENV=production`

## 📝 Usage

### Running a Universal Business Audit

1. Sign up and select your industry and business type
2. Fill in business information (name, website, location details)
3. Click "Start Comprehensive 5-AI Audit"
4. Wait for all AI analyses to complete with industry-specific context
5. Review results tailored to your business type
6. Get actionable recommendations specific to your industry

### Managing Multiple Clients (Agency Mode)

1. Create client profiles with their specific industries
2. Run audits for multiple business types
3. Track historical performance across different industries
4. Send automated reports customized per business type

## 🎨 Design System

The application uses a professional business color scheme:
- Primary: #8B0000 (Business Red)
- Light: #DC143C (Accent Red)  
- Dark: #0F172A (Slate Dark)
- Text: Clean whites and grays for professional appearance

## 🤖 AI Integration

### Supported AI Providers

- **Perplexity**: Market research and competitor analysis with industry context
- **Kimi (Moonshot)**: Technical SEO and website analysis for any business type
- **Claude (Anthropic)**: Industry-specific expertise across all sectors
- **OpenAI**: Customer sentiment analysis adapted to business type
- **Google Gemini**: Google ecosystem optimization for any industry

### Dynamic Industry Analysis

Each AI provider receives contextual business information including:
- Industry classification
- Business type specifics
- Target market focus
- Business size and location type
- Industry-specific metrics and KPIs

## 📊 Reporting

### Email Reports
- Audit completion notifications
- Industry-specific performance summaries
- Critical alerts tailored to business type

### SMS Alerts
- Critical issues requiring immediate attention
- Performance improvements
- Industry-relevant notifications

## 🔐 Security

- Row Level Security enabled in Supabase
- API keys stored as environment variables
- Rate limiting on API endpoints
- Input validation and sanitization
- Industry-specific data protection

## 🧪 Testing

Run tests:
```bash
npm run test:unit
npm run test:integration
npm run test:coverage
```

Run linting:
```bash
npm run lint
npm run type-check
```

## 📈 Performance

- Optimized for Core Web Vitals
- Image optimization with Next.js
- API response caching
- Database query optimization
- Universal scoring algorithms for all business types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@businessscope.ai or create an issue in this repository.

## 🗺️ Roadmap

- [x] Universal business intelligence platform
- [x] 10+ industry support with 60+ business types
- [x] Dynamic AI analysis with business context
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] White-label customization
- [ ] API access for enterprise clients
- [ ] Predictive analytics
- [ ] Multi-language support
- [ ] Industry-specific integrations

---

Built with ❤️ for businesses of all types by the BusinessScope AI team.