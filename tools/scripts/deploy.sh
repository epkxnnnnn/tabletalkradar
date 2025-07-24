#!/bin/bash

# TableTalk Radar Deployment Script
set -e

echo "🚀 TableTalk Radar Deployment Script"
echo "======================================"

# Check if this is a production deployment
if [ "$1" = "prod" ]; then
    echo "📦 Deploying to Production (Vercel)..."
    
    # Ensure we're on the main branch
    git checkout main
    git pull origin main
    
    # Build and deploy to Vercel
    npm run build
    npx vercel --prod
    
    echo "✅ Production deployment complete!"
    echo "🌐 Your app should be live at: https://tabletalkradar.com"
    
elif [ "$1" = "docker" ]; then
    echo "🐳 Starting Docker Development Environment..."
    
    # Start Supabase local development
    echo "Starting Supabase..."
    npx supabase start
    
    # Start Docker Compose
    echo "Starting Docker containers..."
    docker-compose up -d
    
    echo "✅ Docker environment started!"
    echo "🌐 App: http://localhost:3000"
    echo "🗄️  Supabase Studio: http://localhost:54323"
    echo "📧 Inbucket (Email): http://localhost:54324"
    
else
    echo "Usage: ./deploy.sh [prod|docker]"
    echo ""
    echo "Options:"
    echo "  prod   - Deploy to production (Vercel)"
    echo "  docker - Start local Docker development environment"
    exit 1
fi