# Push to GitHub Repository

## Quick Setup Commands

Run these commands in your terminal to push this project to your GitHub repository:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: TableTalk Radar - AI-Powered Restaurant Intelligence"

# Add your GitHub repository as origin
git remote add origin https://github.com/epkxnnnnn/tabletalkradar.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Important Notes

1. **Environment Variables**: The `.env.local` file is NOT included in the repository (it's in .gitignore for security). You'll need to:
   - Add these variables to Vercel when deploying
   - Share the `.env.example` file with collaborators

2. **API Keys Security**: Never commit API keys to GitHub. Always use environment variables.

3. **Next Steps After Push**:
   - Connect your GitHub repo to Vercel
   - Add all environment variables in Vercel dashboard
   - Deploy!

## Vercel Deployment

After pushing to GitHub:
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository: `epkxnnnnn/tabletalkradar`
4. Add environment variables from `.env.example`
5. Deploy!

Your app will be live at: `https://tabletalkradar.vercel.app` (or your custom domain)