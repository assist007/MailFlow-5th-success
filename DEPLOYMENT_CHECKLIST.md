# Deployment Checklist

## Pre-Deployment ✅

### Code Preparation
- [ ] All features tested locally with `npm run dev`
- [ ] No console errors or warnings
- [ ] Build succeeds: `npm run build`
- [ ] Preview works: `npm run preview`
- [ ] TypeScript checks pass: `npm run type-check`
- [ ] Code committed to Git

### Environment Setup
- [ ] Supabase project created and configured
- [ ] Supabase URL copied
- [ ] Supabase Anon Key copied
- [ ] Environment variables documented in `.env.example`

### Repository Setup
- [ ] Repository pushed to GitHub/GitLab/Bitbucket
- [ ] `.env.local` is in `.gitignore` (sensitive data protected)
- [ ] `node_modules` is in `.gitignore`
- [ ] `dist` is in `.gitignore`

## Vercel Deployment 🚀

### Before Deploying
- [ ] Vercel account created at [vercel.com](https://vercel.com)
- [ ] GitHub account connected to Vercel
- [ ] Custom domain configured (optional)

### During Deployment
- [ ] Imported repository into Vercel
- [ ] Build command verified: `npm run build`
- [ ] Output directory verified: `dist`
- [ ] Added environment variables:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `GEMINI_API_KEY` (optional)
- [ ] Deployment initiated

### After Deployment
- [ ] Visit deployment URL
- [ ] Test all pages load correctly
- [ ] Test email functionality
- [ ] Check console for errors
- [ ] Verify Supabase connection works
- [ ] Test on mobile device

## Netlify Deployment 🚀

### Before Deploying
- [ ] Netlify account created at [netlify.com](https://netlify.com)
- [ ] GitHub account connected to Netlify
- [ ] Custom domain configured (optional)

### During Deployment
- [ ] Imported repository into Netlify
- [ ] Build command verified: `npm run build`
- [ ] Publish directory verified: `dist`
- [ ] Added environment variables:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `GEMINI_API_KEY` (optional)
- [ ] Build logs checked for warnings/errors
- [ ] Deployment completed successfully

### After Deployment
- [ ] Visit deployment URL
- [ ] Test all pages load correctly
- [ ] Test email functionality
- [ ] Check console for errors
- [ ] Verify Supabase connection works
- [ ] Test on mobile device

## Post-Deployment 📋

### Testing
- [ ] All routes working correctly
- [ ] Email sending/receiving works
- [ ] Dashboard displays all data
- [ ] Settings page functions properly
- [ ] Navigation between pages smooth
- [ ] No 404 errors on page refresh

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor deployment logs
- [ ] Check Supabase logs for errors
- [ ] Test email webhook handler
- [ ] Monitor performance metrics

### Maintenance
- [ ] Set up auto-deployment on Git push
- [ ] Configure deployment previews
- [ ] Set up status page monitoring
- [ ] Document deployment process
- [ ] Create rollback plan

## Domain Configuration 🌐

### DNS Setup (if using custom domain)
- [ ] Domain registered
- [ ] DNS records updated:
  - [ ] A record pointing to platform
  - [ ] CNAME record (if required)
- [ ] SSL certificate auto-generated
- [ ] Domain verification complete
- [ ] DNS propagation verified

### Email Forwarding (if needed)
- [ ] MX records configured
- [ ] SPF records added
- [ ] DKIM records configured
- [ ] Domain verified with email provider

## Security Checklist 🔒

- [ ] All secrets in environment variables (never in code)
- [ ] `.env` file never committed to Git
- [ ] HTTPS enabled (automatic)
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] API keys rotated after deployment
- [ ] Supabase RLS policies verified
- [ ] Database backups enabled

## Performance Verification ⚡

- [ ] Page load time < 3 seconds
- [ ] First Contentful Paint < 1.5 seconds
- [ ] Largest Contentful Paint < 2.5 seconds
- [ ] Cumulative Layout Shift < 0.1
- [ ] No unused dependencies
- [ ] Images optimized
- [ ] Code splitting working

## Final Checklist ✨

- [ ] Production URL working
- [ ] Team notified of deployment
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Users informed if needed
- [ ] Monitoring dashboards set up
- [ ] On-call rotation established

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Environment**: [ ] Vercel [ ] Netlify [ ] Both  
**Version**: _______________  
**Notes**: _______________________________________________

