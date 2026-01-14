# Security Architecture Diagrams

## 1. Email Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│         INBOUND EMAIL RECEIVED FROM WEBHOOK                │
│  From: attacker@example.com                                │
│  To: admin@yourdomain.com                                   │
│  Subject: Spam or phishing attempt                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   SECURITY GATE #1             │
        │   Is domain registered?        │
        │   ✓ Check: email_domains       │
        └────────────┬───────────────────┘
                     │
            ┌────────┴─────────┐
            │                  │
          NO                   YES
            │                  │
            ▼                  ▼
        ┌────────┐      ┌────────────────────────┐
        │ REJECT │      │  SECURITY GATE #2      │
        │ ✗ NOOP │      │  Is address created?   │
        └────────┘      │  ✓ Check: local_part   │
                        └────────┬───────────────┘
                                 │
                        ┌────────┴─────────┐
                        │                  │
                      NO                   YES
                        │                  │
                        ▼                  ▼
                    ┌────────┐    ┌───────────────────────┐
                    │ REJECT │    │  SECURITY GATE #3     │
                    │ ✗ NOOP │    │  Not hard-deleted?    │
                    └────────┘    │  ✓ Check: is_deleted  │
                                  └────────┬──────────────┘
                                           │
                                  ┌────────┴─────────┐
                                  │                  │
                                YES                 NO
                                  │                  │
                                  ▼                  ▼
                            ┌──────────┐      ┌────────┐
                            │ ACCEPT   │      │ REJECT │
                            │ ✓ STORE  │      │ ✗ NOOP │
                            │ ✓ THREAD │      └────────┘
                            └──────────┘

RESULT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTHORIZED (all 3 gates pass)        UNAUTHORIZED (any gate fails)
┌──────────────────────────────┐    ┌─────────────────────────┐
│ ✓ Email stored in database   │    │ ✗ No database insert    │
│ ✓ Thread created             │    │ ✗ No processing         │
│ ✓ User can read              │    │ ✗ No storage allocated  │
│ ✓ Takes ~50-100ms            │    │ ✓ Takes ~5-10ms (fast!) │
└──────────────────────────────┘    └─────────────────────────┘
```

---

## 2. Database State Machine

```
CREATE ADDRESS
    │
    ▼
┌─────────────────────────────────┐
│ Email Address State             │
│                                 │
│ id: addr-123                    │
│ local_part: "support"           │
│ domain_id: domain-456           │
│ user_id: user-789               │
│ is_active: FALSE  ◄─ Awaiting 1st email
│ is_deleted: FALSE                │
│ created_at: 2026-01-14T10:00Z   │
└────────┬──────────────────────────┘
         │
    FIRST EMAIL
    ARRIVES
         │
         ▼
┌─────────────────────────────────┐
│ is_active: TRUE   ◄─ Activated  │
│ is_deleted: FALSE               │
└────────┬──────────────────────────┘
         │
    EMAIL FLOWS
    NORMALLY
         │
         ▼ (User hits DELETE)
┌─────────────────────────────────┐
│ HARD DELETE                     │
│ • Remove from DB completely     │
│ • Delete all associated emails  │
│ • No soft flag, no archive      │
│ • Total purge                   │
└────────┬──────────────────────────┘
         │
    ADDRESS GONE
         │
    USER WANTS
    TO RECREATE
         │
         ▼
┌─────────────────────────────────┐
│ NEW ADDRESS CREATED             │
│                                 │
│ id: addr-999 (different!)       │
│ local_part: "support" (same)    │
│ is_active: FALSE (fresh start)  │
│ is_deleted: FALSE               │
└─────────────────────────────────┘

EMAILS DURING DIFFERENT STATES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
is_active: TRUE  │ is_deleted: FALSE  → ✓ ACCEPT (store)
is_active: FALSE │ is_deleted: FALSE  → ✗ REJECT (not active yet)
is_active: TRUE  │ is_deleted: TRUE   → ✗ REJECT (hard deleted)
is_active: FALSE │ is_deleted: TRUE   → ✗ REJECT (deleted)
```

---

## 3. Query Performance

```
INBOUND EMAIL VALIDATION QUERY
═══════════════════════════════════════════════════════════════

SELECT * FROM email_addresses
WHERE 
  domain_id = $1              ◄─ Indexed (part of composite key)
  AND local_part = $2         ◄─ Indexed (part of composite key)
  AND is_active = TRUE        ◄─ Indexed (in WHERE clause)
  AND is_deleted = FALSE      ◄─ Indexed (in WHERE clause)
LIMIT 1;

INDEX STRUCTURE:
┌─────────────────────────────────────────────────────┐
│ idx_email_addresses_allowlist                       │
├─────────────────────────────────────────────────────┤
│ Columns: (domain_id, local_part)                    │
│ Filter: WHERE is_active=TRUE AND is_deleted=FALSE  │
│ Type: B-Tree (fast)                                 │
│ Est. Size: ~10-50MB                                 │
│ Lookup Time: < 1ms                                  │
└─────────────────────────────────────────────────────┘

PERFORMANCE SCALING:
┌──────────────────────┬──────────────┬───────────────┐
│ Number of Addresses  │ Index Size   │ Lookup Time   │
├──────────────────────┼──────────────┼───────────────┤
│ 1,000                │ ~1MB         │ < 0.5ms       │
│ 10,000               │ ~5MB         │ < 0.5ms       │
│ 100,000              │ ~50MB        │ < 1ms         │
│ 1,000,000            │ ~500MB       │ < 1ms         │
│ 10,000,000           │ ~5GB         │ < 1-2ms       │
└──────────────────────┴──────────────┴───────────────┘

LOOKUP EXAMPLE:
┌─────────────────────────────────────────────────────┐
│ Query: Is "support@company.com" allowed?            │
│ Parameters: domain_id='d-456', local_part='support'│
│ Index Lookup: INSTANT (< 1ms)                      │
│ Result: ✓ Found & is_deleted=FALSE → ACCEPT        │
└─────────────────────────────────────────────────────┘
```

---

## 4. Security Decision Tree

```
                    INBOUND EMAIL
                         │
                         ▼
            ┌─────────────────────────┐
            │ Extract: to_address     │
            │ Example: admin@co.com   │
            └────────────┬────────────┘
                         │
                         ▼
            ┌─────────────────────────┐
            │ Parse: local + domain   │
            │ local: "admin"          │
            │ domain: "co.com"        │
            └────────────┬────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
    [CHECK DOMAIN]              [CHECK DOMAIN]
    Lowercase: "co.com"         Query database
          │                             │
          ▼                             ▼
    ┌──────────────┐            ┌──────────────┐
    │ Domain valid?│◄───────────│ Found in DB? │
    └──┬───────┬───┘            └──┬───────┬───┘
       │       │                   │       │
      YES     NO                  YES     NO
       │       │                   │       │
       │       └──────┐            │       └──────┐
       │              ▼            │              │
       │         ┌────────┐        │         ┌────────┐
       │         │ REJECT │        │         │ REJECT │
       │         │ LOG:   │        │         │ LOG:   │
       │         │Domain  │        │         │Domain  │
       │         │invalid │        │         │missing │
       │         └────────┘        │         └────────┘
       │                           │
       └───────────────┬───────────┘
                       │
                       ▼
          ┌─────────────────────────┐
          │ [CHECK ADDRESS]         │
          │ Query: domain_id,       │
          │        local_part,      │
          │        is_active=TRUE,  │
          │        is_deleted=FALSE │
          └────────┬────────┬───────┘
                   │        │
                 FOUND    NOT FOUND
                   │        │
                   ▼        ▼
              ┌────────┐ ┌────────┐
              │ ACCEPT │ │ REJECT │
              │ STORE  │ │ LOG:   │
              │ EMAIL  │ │Address │
              │ IN DB  │ │invalid │
              └────────┘ └────────┘

ENDPOINT RESULTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACCEPT                      REJECT
├─ HTTP 200 ✓               ├─ HTTP 200 (but rejected)
├─ { status: 'accepted' }   ├─ { status: 'rejected', reason: '...' }
├─ Email stored in DB       ├─ NO database changes
├─ Thread created           ├─ NO processing triggered
├─ Webhook marked success   ├─ Webhook marked failed
└─ User can read immediately└─ User won't see anything
```

---

## 5. Data Flow Comparison

```
BEFORE (Vulnerable)          AFTER (Secured)
═════════════════════════════════════════════════════════════

1. Email Arrives             1. Email Arrives
        │                             │
        ▼                             ▼
   Check webhook sig          CHECK: Is address allowed?
        │                             │
        ▼                             ├─ Domain exists?
   Extract fields                     ├─ Address created?
        │                             ├─ Not deleted?
        ▼                             │
   Directly insert in DB      (Any check fails)
        │                             │
   EMAIL STORED ✗             REJECT & LOG ✓
   Database polluted          Database clean
   Resources wasted           No overhead


SECURITY IMPROVEMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEFORE          │ AFTER
────────────────┼─────────────────────────────────
Random emails   │ Random emails
get stored ✗    │ get rejected ✓
                │
Mailbox created │ No mailbox
for any addr ✗  │ created ✓
                │
Database grows  │ Database grows
with spam ✗     │ with legit only ✓
                │
Performance     │ Performance
degrades ✗      │ unaffected ✓
```

---

## 6. Webhook Integration

```
┌──────────────────────────────────────┐
│   Email Delivery Service             │
│   (Cloudflare, SendGrid, etc.)       │
└────────────┬─────────────────────────┘
             │
    Inbound email to yourdomain.com
             │
             ▼
┌──────────────────────────────────────┐
│   Webhook Callback                   │
│   POST /webhook/email                │
│   {                                  │
│     "from": "sender@example.com",    │
│     "to": "admin@yourdomain.com",    │
│     "subject": "...",                │
│     "html": "...",                   │
│     "text": "..."                    │
│   }                                  │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│   MailFlow Webhook Handler           │
│   api.handleWebhookEmail(data)       │
└────────────┬─────────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ SECURITY CHECK:        │
    │ isAddressAllowed()     │
    └────────┬───────────────┘
             │
        ┌────┴────┐
        │          │
      YES         NO
        │          │
        ▼          ▼
    ┌──────┐  ┌────────┐
    │STORE │  │ REJECT │
    └──────┘  └────────┘
        │          │
        ▼          ▼
    ┌──────────────────────┐
    │  HTTP Response       │
    │  {                   │
    │    success: true,    │ or   success: false,
    │    rejected: false   │      rejected: true
    │  }                   │      reason: "..."
    │  }                   │
    └──────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ Return to sender       │
    │ (status confirmed)     │
    └────────────────────────┘
```

---

## 7. Threat Model & Mitigation

```
THREAT: Random Email Attack
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ATTACKER GOAL:
├─ Pollute database with spam
├─ Exhaust storage quota
├─ Trigger background processing
├─ Cause performance degradation
└─ Bypass security

ATTACK VECTOR:
attacker@x.com → spam@yourdomain.com
attacker@y.com → phish@yourdomain.com
bot@spam.net → random123@yourdomain.com
...1000+ attempts/second...

BEFORE (Vulnerable):
├─ Each email: 1 DB write
├─ 1000 emails/sec: 1000 DB writes/sec
├─ Storage grows rapidly
├─ System degradation
└─ Attacker WINS ✗

AFTER (Protected):
├─ Check allowlist first
├─ Not in allowlist: REJECT (0 DB writes)
├─ 1000 emails/sec: 0 DB writes, just validation
├─ Storage unchanged
├─ System unaffected
└─ Attacker FAILS ✓

SECURITY TIMELINE:
┌─────────────────────────────────────┐
│ Request arrives                     │
│ ↓ 1ms (validation)                 │
├─────────────────────────────────────┤
│ Check allowlist index               │
│ ↓ 0.5ms                             │
├─────────────────────────────────────┤
│ Address NOT found                   │
│ ↓ REJECT                            │
├─────────────────────────────────────┤
│ Total time: ~1.5ms                  │
│ Resource cost: minimal              │
│ Database impact: ZERO ✓             │
└─────────────────────────────────────┘
```

---

## 8. Implementation Timeline

```
TODAY (Preparation)
├─ Review security docs
├─ Test in staging
└─ Prepare deployment

DAY 1 (Database)
├─ ALTER TABLE (add is_deleted column)
├─ CREATE INDEX (fast lookup)
├─ Verify migration
└─ Backup database

DAY 2 (Deployment)
├─ Deploy apiService.ts
├─ Deploy types.ts
├─ Deploy sqlBlueprint.ts
├─ Verify code changes
└─ Run 4 test cases

DAY 3 (Monitoring)
├─ Watch logs for [REJECTED_EMAIL]
├─ Monitor database performance
├─ Check error rates
└─ Verify no false rejects

DAY 4+ (Maintenance)
├─ Continuous monitoring
├─ Alert on anomalies
├─ Document learnings
└─ Scale as needed

ROLLBACK OPTION (if needed):
├─ Revert code to previous version
├─ Keep new column (no data loss)
├─ Restore old webhook handler
└─ Monitor for issues
```

---

**Last Updated:** January 2026
**Version:** 1.0 - Production Ready
