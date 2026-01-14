# Production Configuration

## Environment Variables Required

### Required
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

### Optional
- `GEMINI_API_KEY` - For AI features (optional)

## Deployment Platform Specific

### Vercel
**Environment Variables Section:**
```
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = xxxxx
GEMINI_API_KEY = xxxxx (optional)
```

**Build & Output Settings:**
- Framework: Vite
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install
- Development Command: npm run dev

**Domain:**
- Project Settings → Domains
- Add your domain
- Update DNS records

### Netlify
**Environment Variables Section:**
```
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = xxxxx
GEMINI_API_KEY = xxxxx (optional)
```

**Build Settings:**
- Build command: npm run build
- Publish directory: dist
- Node version: 20 (auto from netlify.toml)

**Domain:**
- Site settings → Domain management
- Add your domain
- Update DNS records

## Node.js Version

- **Minimum**: 18.x
- **Recommended**: 20.x (configured in netlify.toml)
- **Vercel**: Uses latest LTS by default

## NPM Dependencies

### Production Dependencies
```json
{
  "@google/genai": "^1.35.0",
  "@supabase/supabase-js": "^2.45.0",
  "lucide-react": "^0.562.0",
  "react": "^19.2.3",
  "react-dom": "^19.2.3"
}
```

### Dev Dependencies
```json
{
  "@types/node": "^22.14.0",
  "@types/react": "^19.0.2",
  "@types/react-dom": "^19.0.2",
  "@vitejs/plugin-react": "^5.0.0",
  "typescript": "~5.8.2",
  "vite": "^6.2.0"
}
```

## Build Process

1. **Install**: `npm install`
2. **Build**: `npm run build`
3. **Output**: `dist/` directory
4. **Serve**: `npm run preview` or platform's CDN

## Security Headers

Both platforms configured with:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Performance

- **Vite**: Optimized builds with code splitting
- **React 19**: Latest performance improvements
- **CDN**: Both platforms use global CDN
- **Caching**: Configured appropriately

Build size: Approximately 500KB (gzipped ~150KB)

## Monitoring

### Vercel
- Dashboard: vercel.com/dashboard
- Real-time logs
- Analytics (Pro plan)
- Performance monitoring

### Netlify
- Dashboard: app.netlify.com
- Build logs
- Netlify Analytics (Paid)
- Monitoring tools

## Continuous Deployment

Both platforms support:
- ✅ Auto-deploy on Git push
- ✅ Deploy previews for pull requests
- ✅ Custom domain routing
- ✅ Environment management

Configure in platform dashboard:
- Select your repository
- Configure automatic deployments
- Deploy previews enabled

## Rollback Procedure

### Vercel
1. Dashboard → Deployments
2. Select previous deployment
3. Click "Redeploy"

### Netlify
1. Site settings → Deploys
2. Click "Restore deploy"
3. Select version to restore

## SSL/HTTPS

- **Automatic**: Both platforms auto-generate SSL
- **Custom Domain**: Auto-provisioned
- **Renewal**: Automatic

## Rate Limiting

Both platforms have rate limits:
- **Requests**: Generous free tier
- **Bandwidth**: Depends on plan
- **API Calls**: Supabase limits apply separately

## Backup Strategy

1. **Code**: GitHub/GitLab (Git history)
2. **Database**: Supabase automated backups
3. **Environment**: Documented in deployment platform

## Update Procedure

1. Update code locally
2. Run tests: `npm run type-check`
3. Build test: `npm run build`
4. Commit and push to Git
5. Platform auto-deploys (if configured)

## Debugging Production Issues

1. Check deployment logs in platform dashboard
2. Check browser DevTools Console
3. Check Supabase logs
4. Check platform error tracking
5. Review recent commits

## Cost Considerations

### Vercel Free Tier
- Unlimited deployments
- Analytics (basic)
- Custom domain
- Auto SSL

### Netlify Free Tier
- Unlimited deployments
- Deploy previews
- Custom domain
- Auto SSL

### Supabase
- First project free
- 500MB database
- 2GB bandwidth
- Upgrade as needed

## Support Resources

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Vite Docs: https://vitejs.dev
- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev

