# MailFlow Deployment Guide

Complete guide to deploy MailFlow on Vercel and Netlify.

## Prerequisites

- Node.js 18+ installed
- Git repository initialized
- GitHub, GitLab, or Bitbucket account
- Supabase project created
- Domain name (optional)

## Environment Variables

Create a `.env.local` file with these variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here (optional)
```

## Deploy to Vercel

### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub/GitLab/Bitbucket repository
4. Set Framework: "Vite"
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (optional)
6. Click "Deploy"

### Vercel Configuration

The `vercel.json` file includes:
- ✅ Vite framework configuration
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Environment variables setup
- ✅ Security headers
- ✅ SPA rewrites

## Deploy to Netlify

### Option 1: Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Option 2: Using Netlify Dashboard

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider
4. Select your repository
5. Build settings should auto-detect:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (optional)
7. Click "Deploy site"

### Netlify Configuration

The `netlify.toml` file includes:
- ✅ Build configuration
- ✅ Development server setup
- ✅ SPA routing (redirects)
- ✅ Node.js 20 environment
- ✅ Security headers
- ✅ Cache management

## Build Locally

Before deploying, test the build locally:

```bash
# Install dependencies
npm install

# Build
npm run build

# Preview build
npm run preview
```

## Troubleshooting

### Build Fails

1. Check Node.js version: `node --version` (should be 18+)
2. Clear cache: `npm cache clean --force`
3. Reinstall: `rm -rf node_modules && npm install`
4. Check build logs in deployment dashboard

### Missing Environment Variables

1. Verify `.env.local` has all required variables
2. Check deployment platform's environment variables section
3. Restart deployment after adding variables

### SPA Routing Issues

- Vercel: Uses `vercel.json` rewrites (auto-configured)
- Netlify: Uses `netlify.toml` redirects (auto-configured)

Both platforms redirect all routes to `index.html` for client-side routing.

### API Connection Issues

1. Check Supabase URL and key are correct
2. Verify Supabase project is live
3. Check browser console for CORS errors
4. Ensure RLS policies allow API access

## Monitoring

### Vercel
- Dashboard: vercel.com/dashboard
- Logs: Click deployment → Logs tab
- Analytics: Real-time monitoring

### Netlify
- Dashboard: app.netlify.com
- Logs: Click deploy → Logs tab
- Analytics: Netlify Analytics (premium)

## Domain Setup

### Vercel
1. Dashboard → Project Settings → Domains
2. Add your domain
3. Update DNS records as shown

### Netlify
1. Site settings → Domain management
2. Add your domain
3. Update DNS records as shown

## Performance Optimization

- ✅ Vite provides optimized builds
- ✅ React 19 for latest performance
- ✅ Code splitting automatically handled
- ✅ CDN distribution by both platforms

## Security

- ✅ HTTPS enabled by default
- ✅ Security headers configured
- ✅ CORS protection
- ✅ Environment variables protected

## Support

- Vercel: [vercel.com/support](https://vercel.com/support)
- Netlify: [netlify.com/support](https://netlify.com/support)
- Vite: [vitejs.dev](https://vitejs.dev)
