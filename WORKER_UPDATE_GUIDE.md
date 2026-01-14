# 🚨 URGENT: Worker Code Security Update Required

## ⚠️ Problem Identified

আপনার current Cloudflare Worker code-এ **allowlist validation নেই**। এজন্যই `ordion100@ordion.dpdns.org` (যেটা create করা হয়নি) তেও email আসছে।

**Current Worker:** সব email accept করে (vulnerable ❌)  
**Updated Worker:** শুধু explicitly created addresses-এ email accept করে (secure ✅)

---

## ✅ Solution: Worker Code Update করুন

### Step 1: Database Migration (First Time Only)

Supabase-এ নিচের SQL run করুন:

```sql
-- Add is_deleted column (if not exists)
ALTER TABLE email_addresses ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Create fast-lookup index
CREATE INDEX IF NOT EXISTS idx_email_addresses_allowlist
  ON public.email_addresses(domain_id, local_part)
  WHERE is_active = TRUE AND is_deleted = FALSE;
```

**How to run:**
1. Supabase Dashboard → SQL Editor
2. Copy-paste above code
3. Click "Run"

---

### Step 2: Update Worker Code in Cloudflare

#### Option A: Auto-Generate (Recommended)

1. **MailFlow app-এ যান** → System Setup
2. আপনার domain select করুন
3. **"Copy Logic"** button click করুন
4. Cloudflare Worker-এ paste করুন
5. **Deploy** করুন

#### Option B: Manual Update

যদি auto-generate কাজ না করে, নিচের changes manually করুন:

**FIND THIS CODE (Old - line ~328):**
```javascript
// Auto-activate email address on first email received
const localPart = toParts[0];
console.log("🔍 Looking for address:", localPart);
const addressRes = await fetch(
  `${SUPABASE_URL}/rest/v1/email_addresses?domain_id=eq.${domainId}&local_part=eq.${encodeURIComponent(localPart)}`,
  // ... rest of code
);
```

**REPLACE WITH (New - with security):**
```javascript
// 🔒 SECURITY: Strict allowlist validation
const localPart = toParts[0];
console.log("🔍 Security check: Validating address:", localPart);

const addressRes = await fetch(
  `${SUPABASE_URL}/rest/v1/email_addresses?domain_id=eq.${domainId}&local_part=eq.${encodeURIComponent(localPart)}&is_active=eq.true&is_deleted=eq.false`,
  {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Accept": "application/json"
    }
  }
);

if (!addressRes.ok) {
  console.error("❌ SECURITY: Address validation failed:", addressRes.status);
  return;
}

const addresses = await addressRes.json();

// 🛑 REJECT: Address not in allowlist
if (!addresses || addresses.length === 0) {
  console.warn("🛑 REJECTED: Email to", to, "- Address not in allowlist (unauthorized)");
  console.warn("   From:", from);
  console.warn("   Reason: Address not explicitly created in app");
  return; // Stop processing - NO DB insert
}

const allowedAddress = addresses[0];
const addressUserId = allowedAddress.user_id;

console.log("✅ SECURITY: Address validated -", to, "is in allowlist");

// Auto-activate address on first email received
if (!allowedAddress.is_active) {
  console.log("✅ Activating address:", allowedAddress.id);
  await fetch(`${SUPABASE_URL}/rest/v1/email_addresses?id=eq.${allowedAddress.id}`, {
    method: "PATCH",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ is_active: true })
  });
}
```

**AND UPDATE user_id (line ~354):**

**OLD:**
```javascript
user_id: ownerId,
```

**NEW:**
```javascript
user_id: addressUserId, // Use validated address owner, not domain owner
```

---

### Step 3: Deploy & Test

#### Deploy
1. Cloudflare Worker → Quick Edit
2. Paste updated code
3. Click **"Save and Deploy"**

#### Test

**Test 1: Allowed Address ✅**
```
Send email to: ordion001@ordion.dpdns.org
Expected: ✅ Email delivered
Check logs: "✅ SECURITY: Address validated"
```

**Test 2: Unauthorized Address ✗**
```
Send email to: ordion100@ordion.dpdns.org (not created)
Expected: ❌ Email REJECTED
Check logs: "🛑 REJECTED: Email to ordion100@... - Address not in allowlist"
```

#### How to Check Logs
1. Cloudflare → Workers → Your Worker
2. Click **"Logs"** tab (real-time)
3. Send test email
4. Watch for log messages

---

## 🔍 What Changed?

### Before (Vulnerable):
```javascript
// Check if address exists (any address)
const addressRes = await fetch(
  `...email_addresses?domain_id=eq.${domainId}&local_part=eq.${localPart}`
);

// If address exists, activate it
if (addresses && addresses.length > 0) {
  // Activate and insert email
}

// Always insert email (PROBLEM!)
await fetch(`.../emails`, { method: "POST", ... });
```

**Problem:** If address doesn't exist, email still gets inserted!

---

### After (Secure):
```javascript
// Check if address is in ALLOWLIST (strict)
const addressRes = await fetch(
  `...email_addresses?domain_id=eq.${domainId}&local_part=eq.${localPart}&is_active=eq.true&is_deleted=eq.false`
);

// REJECT if not in allowlist
if (!addresses || addresses.length === 0) {
  console.warn("REJECTED: Address not in allowlist");
  return; // Stop here - NO DB insert
}

// Only insert if address is allowed
await fetch(`.../emails`, { method: "POST", ... });
```

**Solution:** Email only inserted if address is explicitly in allowlist!

---

## 📊 Security Validation Flow

```
Inbound Email arrives
    ↓
Extract: to_address (e.g., ordion100@ordion.dpdns.org)
    ↓
Query: Is address in allowlist?
    - domain_id matches? ✓
    - local_part matches? (ordion100)
    - is_active = true?
    - is_deleted = false?
    ↓
┌───────────┴───────────┐
│                       │
YES (all match)        NO (any fails)
│                       │
▼                       ▼
ACCEPT                 REJECT
- Log success          - Log rejection
- Activate if needed   - Return early
- Insert email         - NO DB insert
- Return 200           - Return (no error)
```

---

## 🧪 Verification Checklist

After updating Worker code:

- [ ] Database migration ran successfully
- [ ] Worker code updated in Cloudflare
- [ ] Worker deployed successfully
- [ ] Test email to `ordion001@ordion.dpdns.org` → ✅ **Delivered**
- [ ] Test email to `ordion100@ordion.dpdns.org` → ❌ **Rejected**
- [ ] Cloudflare logs show `"🛑 REJECTED"` message
- [ ] MailFlow inbox receives only allowed emails
- [ ] No unauthorized emails in database

---

## 🚨 Critical Notes

### ⚠️ Must Do BOTH:
1. **Database migration** (add `is_deleted` column + index)
2. **Worker code update** (add validation logic)

If you only do one, security won't work!

### ⚠️ Test Immediately:
After deploying, test with unauthorized email to verify rejection.

### ⚠️ Monitor Logs:
Watch Cloudflare Worker logs for `"🛑 REJECTED"` messages to confirm security is working.

---

## 📞 Troubleshooting

### Problem: Still receiving unauthorized emails

**Solution:**
1. Check Worker code has the new validation (search for `"🛑 REJECTED"`)
2. Verify database has `is_deleted` column
3. Check index was created: `idx_email_addresses_allowlist`
4. Re-deploy Worker code

### Problem: Worker showing errors

**Solution:**
1. Check Cloudflare Worker logs for error messages
2. Verify SUPABASE_URL and SUPABASE_KEY are correct
3. Test Supabase connection manually
4. Re-generate and re-deploy Worker code

### Problem: All emails being rejected (including allowed)

**Solution:**
1. Check `email_addresses` table has entries for your addresses
2. Verify `is_active = true` for your addresses
3. Verify `is_deleted = false` for your addresses
4. Run: `SELECT * FROM email_addresses WHERE local_part = 'ordion001'`

---

## 📅 Timeline

- **Now:** Update Worker code (5 minutes)
- **Test:** Verify rejection working (2 minutes)
- **Monitor:** Watch logs for 24 hours
- **Done:** System secured! ✅

---

## ✅ Success Confirmation

You'll know it's working when:

1. **Cloudflare logs show:**
   ```
   ✅ SECURITY: Address validated - ordion001@... is in allowlist
   🛑 REJECTED: Email to ordion100@... - Address not in allowlist
   ```

2. **MailFlow inbox:**
   - Only shows emails to created addresses
   - No random/unauthorized emails appear

3. **Supabase database:**
   - `emails` table only has emails to allowed addresses
   - No spam or unauthorized entries

---

**Status:** 🚨 **Action Required**  
**Priority:** 🔴 **High (Security)**  
**Time Needed:** ~10 minutes  
**Difficulty:** 🟢 Easy (copy-paste)

**Next Step:** [Go to System Setup](#) → Copy new Worker code → Deploy to Cloudflare
