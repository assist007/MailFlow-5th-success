# Implementation Checklist: Strict Address Allowlist

## Phase 1: Database Setup ✅

### Step 1: Add `is_deleted` Column
```sql
ALTER TABLE email_addresses ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
```

**Why:** Enables hard delete support without losing address history if needed.

---

### Step 2: Create Fast-Lookup Index
```sql
CREATE INDEX IF NOT EXISTS idx_email_addresses_allowlist
  ON public.email_addresses(domain_id, local_part)
  WHERE is_active = TRUE AND is_deleted = FALSE;
```

**Why:** O(1) validation lookups during inbound email processing.

---

## Phase 2: Code Implementation ✅

### Step 3: Update Type Definition
**File:** [types.ts](types.ts)

```typescript
export interface EmailAddress {
  id: string;
  local_part: string;
  domain_id: string;
  user_id: string;
  is_catch_all: boolean;
  is_active: boolean;
  is_deleted: boolean;  // ← NEW
  created_at: string;
}
```

---

### Step 4: Add Validation Methods to `apiService.ts`
**File:** [services/apiService.ts](services/apiService.ts)

#### Method 1: `isAddressAllowed()`
Performs strict 3-step validation:
1. Domain exists and is active
2. Address exists in allowlist (is_active=true)
3. Address is NOT hard-deleted (is_deleted=false)

```typescript
private async isAddressAllowed(toAddress: string): Promise<{
  allowed: boolean;
  address: EmailAddress | null;
  domain: EmailDomain | null;
}> {
  // Implementation in apiService.ts
}
```

#### Method 2: `logRejectedEmail()`
Logs unauthorized access attempts for monitoring.

```typescript
private async logRejectedEmail(
  toAddress: string,
  fromAddress: string,
  reason: string
): Promise<void> {
  // Implementation in apiService.ts
}
```

---

### Step 5: Update `handleWebhookEmail()`
**File:** [services/apiService.ts](services/apiService.ts)

**OLD:** No validation, accepts all emails
```typescript
async handleWebhookEmail(webhookData: any): Promise<void> {
  // Directly insert without checking
  await supabase.from('emails').insert([...]);
}
```

**NEW:** Strict validation with rejection
```typescript
async handleWebhookEmail(webhookData: any): Promise<{
  success: boolean;
  rejected: boolean;
  reason?: string;
}> {
  const validation = await this.isAddressAllowed(to_address);
  
  if (!validation.allowed) {
    // REJECT immediately - no DB operations
    await this.logRejectedEmail(to_address, from_address, '...');
    return { success: false, rejected: true, reason: '...' };
  }
  
  // ACCEPT - safe to store
  await supabase.from('emails').insert([...]);
  return { success: true, rejected: false };
}
```

---

### Step 6: Update `deleteAddress()` for Hard Delete
**File:** [services/apiService.ts](services/apiService.ts)

**BEFORE:** Soft reference only
```typescript
await supabase.from('email_addresses').delete().eq('id', addressId);
```

**AFTER:** True hard delete with data cleanup
```typescript
// 1. Delete all emails for this address
await supabase.from('emails').delete().or(`to_address.eq.${fullEmail},from_address.eq.${fullEmail}`);

// 2. Hard delete the address (no soft flag)
const { error } = await supabase.from('email_addresses').delete().eq('id', addressId);
```

---

## Phase 3: Webhook Integration

### Step 7: Update Webhook Endpoint Handler

If using Cloudflare or custom webhook handler, ensure it calls:

```typescript
const result = await api.handleWebhookEmail({
  from_address: req.body.from,
  to_address: req.body.to,
  subject: req.body.subject,
  body_text: req.body.text,
  body_html: req.body.html,
  domain_id: req.body.domain_id,  // Note: NOT used if validation fails
  user_id: req.body.user_id       // Note: NOT used if validation fails
});

if (result.rejected) {
  console.log(`Rejected: ${result.reason}`);
  return res.json({ status: 'rejected', reason: result.reason });
}

return res.json({ status: 'accepted' });
```

---

## Phase 4: Testing & Validation

### Test Case 1: Valid Address ✓
```bash
# Create address in app
POST /api/addresses
{
  "domain_id": "domain-123",
  "local_part": "support",
  "user_id": "user-456"
}
# Response: { id: "addr-789", is_active: false, is_deleted: false }

# Send email to valid address
POST /webhook/email
{
  "from": "customer@example.com",
  "to": "support@yourdomain.com",
  "subject": "Help needed",
  "text": "..."
}
# Expected: { status: 'accepted' }
# Check: Email stored in database ✓
```

---

### Test Case 2: Invalid Address (Never Created) ✗
```bash
# Try to send to non-existent address
POST /webhook/email
{
  "from": "attacker@x.com",
  "to": "admin@yourdomain.com",  # Never created!
  "subject": "Trying to spam",
  "text": "..."
}
# Expected: { status: 'rejected', reason: 'Address not authorized...' }
# Check: NO email in database ✓
# Check: Log shows [REJECTED_EMAIL] ✓
```

---

### Test Case 3: Deleted Address ✗
```bash
# Create and then delete address
POST /api/addresses
{ "local_part": "temp", "domain_id": "d-123", "user_id": "u-456" }
# Response: addr-xyz

DELETE /api/addresses/addr-xyz

# Try to send email to deleted address
POST /webhook/email
{
  "from": "sender@example.com",
  "to": "temp@yourdomain.com",
  "subject": "Test",
  "text": "..."
}
# Expected: { status: 'rejected' }
# Check: NO email stored ✓
# Check: is_deleted=true verified ✓

# Re-create address should work
POST /api/addresses
{ "local_part": "temp", "domain_id": "d-123", "user_id": "u-456" }
# Expected: New address created successfully ✓

# Now email should be accepted
POST /webhook/email { "to": "temp@yourdomain.com", ... }
# Expected: { status: 'accepted' }
# Check: Email stored ✓
```

---

### Test Case 4: Domain Not Registered ✗
```bash
# Try sending to unregistered domain
POST /webhook/email
{
  "from": "attacker@x.com",
  "to": "anyone@notregistered.com",  # Domain not in system
  "subject": "Spam",
  "text": "..."
}
# Expected: { status: 'rejected' }
# Check: NO database impact ✓
```

---

## Phase 5: Monitoring & Alerts

### Step 8: Set Up Rejection Monitoring

**Log Pattern:** `[REJECTED_EMAIL]`

```bash
# In your logging system (CloudFlare, Datadog, etc.)
# Search for rejected emails
filter:"[REJECTED_EMAIL]"

# Monitor high rejection rates (possible attack)
alert: if (rejection_rate > 100/hour) send_alert()
```

---

### Step 9: Database Metrics

```sql
-- Monitor allowlist size
SELECT 
  domain,
  COUNT(*) as active_addresses,
  COUNT(CASE WHEN is_deleted THEN 1 END) as deleted_addresses
FROM email_addresses
LEFT JOIN email_domains ON email_addresses.domain_id = email_domains.id
WHERE email_addresses.is_active = TRUE
GROUP BY domain
ORDER BY active_addresses DESC;

-- Monitor email storage efficiency (no spam)
SELECT 
  COUNT(*) as total_emails,
  COUNT(CASE WHEN folder != 'trash' THEN 1 END) as active_emails
FROM emails;
```

---

## Phase 6: Deployment

### Step 10: Deployment Checklist

- [ ] Database migration script tested (add `is_deleted` column)
- [ ] Index created and verified
- [ ] Updated `types.ts` with `is_deleted` field
- [ ] Updated `apiService.ts` with validation methods
- [ ] Updated `handleWebhookEmail()` with strict logic
- [ ] Updated `deleteAddress()` for hard delete
- [ ] Webhook endpoint updated to handle rejection response
- [ ] Test cases executed successfully (all 4 pass)
- [ ] Monitoring/logging configured
- [ ] Deployment to staging environment
- [ ] Integration test with real webhook
- [ ] Monitoring dashboard live
- [ ] Production deployment
- [ ] Alert systems active

---

### Deployment Steps

```bash
# 1. Run database migration
psql -h YOUR_DB_HOST -d YOUR_DB_NAME << EOF
ALTER TABLE email_addresses ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_email_addresses_allowlist
  ON public.email_addresses(domain_id, local_part)
  WHERE is_active = TRUE AND is_deleted = FALSE;
EOF

# 2. Deploy updated code
git add services/apiService.ts types.ts
git commit -m "feat: strict address allowlist security"
git push origin main

# 3. Verify logs
grep "[REJECTED_EMAIL]" /var/log/mailflow.log
```

---

## Rollback Plan

If issues arise:

```bash
# 1. Revert code to previous version
git revert HEAD

# 2. Keep column (no data loss)
# ALTER TABLE email_addresses DROP COLUMN is_deleted;
# (Optional - keeping column is safe)

# 3. Restore old webhook handler
# Edit handleWebhookEmail() to not validate
```

---

## Performance Metrics (Expected)

| Metric | Value | Impact |
|--------|-------|--------|
| Validation lookup time | < 1ms | Minimal |
| Rejected email overhead | ~5-10ms | Negligible |
| Storage per address | ~500 bytes | ~1KB per user |
| Index size | ~10-50MB | Manageable |
| Query cost (AWS RDS) | < 1¢/1000 | Negligible |

---

## Success Criteria

✅ **All test cases pass**
✅ **No unauthorized emails stored**
✅ **Zero impact from random inbound attempts**
✅ **Hard delete works correctly**
✅ **Re-creation after delete works**
✅ **Monitoring shows rejection logs**
✅ **Database storage optimized**

---

## Support & Questions

For issues or questions:
1. Check [SECURITY_ALLOWLIST.md](SECURITY_ALLOWLIST.md) for architecture details
2. Review logs for `[REJECTED_EMAIL]` patterns
3. Test with provided test cases
4. Monitor database metrics for anomalies

---

**Status:** Ready for implementation
**Last Updated:** January 2026
