# Cloudflare Email Routing Setup Guide

## Problems Found & Fixed

❌ **Problem 1**: Worker had "No fetch handler!" error  
✅ **Fixed**: Added fetch handler that returns 200 OK response

❌ **Problem 2**: Domain shows `is_verified=FALSE` in Supabase  
✅ **Fix**: Verify domain through TXT record in Cloudflare DNS

## Critical Setup Steps

### Step 1: Update Worker Code in Cloudflare
1. Go to **Cloudflare Dashboard** → **Workers & Pages** → `ordion-dpdns-org-rapid-union-a895`
2. Open the **worker.js** file
3. **DELETE ALL existing code**
4. Go back to MailFlow → **System Setup** tab
5. Find your domain (`ordion.dpdns.org`)
6. Click **"Copy Logic"** button to copy the updated Worker Bridge Code
7. Paste the entire code into Cloudflare Worker
8. Click **Deploy** button (top right)

### Step 2: Verify DNS Records in Cloudflare
Go to **Cloudflare Dashboard** → **DNS** → `ordion.dpdns.org`

You should have these MX records:
```
Type    Name                  Value                      Priority
MX      ordion.dpdns.org      route1.mx.cloudflare.net   10
MX      ordion.dpdns.org      route2.mx.cloudflare.net   20  
MX      ordion.dpdns.org      route3.mx.cloudflare.net   30
```

And SPF record:
```
Type    Name                  Value
TXT     ordion.dpdns.org      v=spf1 include:route.cloudflare.net ~all
```

### Step 3: Check Email Routing Configuration
Go to **Cloudflare** → **Domains** → **Email Routing**

Verify:
- ✓ Catch-All rule: `* → Send to Worker: ordion-dpdns-org-rapid-union-a895` (should be Active)
- ✓ Custom address: `ordion001@ordion.dpdns.org → Send to Worker: ordion-dpdns-org-rapid-union-a895` (should be Active)

### Step 4: Test the Worker
1. Check Cloudflare Worker **Console** for errors:
   - Go to **Workers** → **ordion-dpdns-org-rapid-union-a895** → **Logs** tab
   - Should see: `✓ Email received and stored: test@ordion.dpdns.org`

2. Send test email to: `test@ordion.dpdns.org`

3. Check MailFlow Inbox - email should appear within 1-2 minutes

### Step 5: Verify Domain in MailFlow
- Go to MailFlow → **System Setup**
- Your domain card should show: `Live` (green badge)
- If still showing `Pending`, wait 5-10 minutes for DNS propagation

## Troubleshooting

### ❌ Worker shows "No fetch handler!" error
**Solution**: Re-deploy the worker code with the fetch handler included

### ❌ Emails not appearing in Inbox
1. Check Cloudflare Worker logs for errors
2. Verify SUPABASE_URL and SUPABASE_KEY are correct in the worker code
3. Check Supabase RLS policies are set to "Public Access"
4. Test with "Simulate Email" button in MailFlow

### ❌ Domain still shows "PENDING"
1. Verify MX records are exactly correct in Cloudflare DNS
2. Wait 24-48 hours for DNS propagation (first time setup)
3. Manually click "Verify" button in MailFlow if available

### ❌ "Domain not found in database" error in logs
1. Go to MailFlow → System Setup
2. Make sure your domain is listed
3. Check Supabase: Go to `email_domains` table and verify domain exists

## Files Updated
- `App.tsx` - Worker code now includes fetch handler for Cloudflare compatibility

