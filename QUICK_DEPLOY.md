# Quick Deploy Guide

## 🚀 Deploy in 5 Minutes

### Step 1: Prepare (1 min)
```bash
# Test build locally
npm run build
npm run preview

# Verify no errors
npm run type-check
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 3a: Deploy to Vercel (2 min)
```bash
# Via CLI
npm i -g vercel
vercel --prod

# Via Web: https://vercel.com → New Project → Select Repo
```

**Add Environment Variables in Vercel Dashboard:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
GEMINI_API_KEY=your-key-here (optional)
```

✅ Done! Your app is live at: `https://your-project.vercel.app`

---

### Step 3b: Deploy to Netlify (2 min)
```bash
# Via CLI
npm i -g netlify-cli
netlify deploy --prod

# Via Web: https://netlify.com → Add New Site → Select Repo
```

**Add Environment Variables in Netlify Dashboard:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
GEMINI_API_KEY=your-key-here (optional)
```

✅ Done! Your app is live at: `https://your-site.netlify.app`

---

## 📋 Configuration Files Included

✅ **vercel.json** - Vercel deployment config  
✅ **netlify.toml** - Netlify deployment config  
✅ **package.json** - Scripts and dependencies  
✅ **.gitignore** - Prevents committing sensitive files  
✅ **vite.config.ts** - Build configuration  
✅ **.env.example** - Environment variables template  

## 🔐 Important

1. **Never commit `.env.local`** - It contains secrets
2. **Add environment variables** in deployment platform dashboard
3. **Use `.env.example`** as template for team members

## 🌐 Connect Custom Domain

### Vercel
1. Dashboard → Project → Settings → Domains
2. Add your domain
3. Update DNS records (instructions provided)

### Netlify
1. Site settings → Domain management
2. Add your domain
3. Update DNS records (instructions provided)

## ❓ Troubleshooting

**Build fails?**
```bash
rm -rf node_modules
npm install
npm run build
```

**Environment variables not working?**
- Restart deployment after adding variables
- Check variable names start with `VITE_`

**Routes not working?**
- Both platforms configured with SPA rewrites
- Refresh should work on any route

## 📞 Support

- **Vercel**: https://vercel.com/support
- **Netlify**: https://netlify.com/support
- **Vite**: https://vitejs.dev/guide/troubleshooting.html

## 🎯 After Deployment

- [ ] Test all pages load
- [ ] Test email functionality
- [ ] Check browser console (no errors)
- [ ] Test on mobile
- [ ] Set up monitoring
- [ ] Share deployment URL with team

---

**Need help?** Check `DEPLOYMENT.md` for detailed instructions!
