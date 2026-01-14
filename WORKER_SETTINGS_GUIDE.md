# Dynamic Supabase Configuration Setup

## ✨ নতুন Feature: Worker Settings Page

এখন আপনি আপনার Supabase URL এবং Key dynamically update করতে পারবেন!

### কীভাবে কাজ করে:

1. **Sidebar-এ নতুন "Worker Settings" option দেখাবে**
2. এখানে আপনি enter করতে পারবেন:
   - Supabase Project URL
   - Supabase Anon Key

3. **Save করলেই Worker Code automatically update হয়ে যাবে**
4. System Setup-এ গিয়ে Copy Logic করে নতুন code Cloudflare-এ paste করুন

---

## ধাপে ধাপে:

### 1️⃣ Settings Page খুলুন
- Sidebar-এ **"Worker Settings"** ক্লিক করুন

### 2️⃣ Credentials এন্টার করুন
```
SUPABASE_URL: https://irmxzvuzbacyqkmsiudp.supabase.co
SUPABASE_KEY: eyJhbGciOiJIUzI1Ni... (আপনার key)
```

### 3️⃣ Save করুন
- **"Save Settings"** বাটন ক্লিক করুন
- সবুজ ✅ message দেখাবে

### 4️⃣ নতুন Worker Code পান
- **System Setup** tab-এ যান
- আপনার domain select করুন
- **"Copy Logic"** বাটন ক্লিক করুন (নতুন code এখানে থাকবে)

### 5️⃣ Cloudflare Worker আপডেট করুন
- নতুন code সম্পূর্ণভাবে copy করুন
- Cloudflare Worker-এ সব পুরানো code delete করুন
- নতুন code paste করুন
- **Deploy** করুন

---

## ডেটা Storage

আপনার settings localStorage-এ store হয় (browser-এ safe):
- `mailflow_supabase_url`
- `mailflow_supabase_key`

এগুলো auto-load হয় পরবর্তী সময় app খুললে।

---

## ⚠️ গুরুত্বপূর্ণ

- Settings change করলে **নতুন Worker Code generate হয়**
- পুরানো Worker Code কাজ করবে না
- প্রতিবার **নতুন code Cloudflare-এ deploy করতে হবে**
- URL এবং Key নিশ্চিত করুন - সঠিক হতে হবে

---

## সমাধান যদি কাজ না করে:

1. **পুরানো Worker Code delete করুন** (Cloudflare থেকে)
2. **নতুন URL/Key settings থেকে save করুন**
3. **System Setup থেকে নতুন code copy করুন**
4. **Cloudflare Worker-এ paste করুন এবং Deploy করুন**
5. **Test email পাঠান**

---

এখন আপনার ইমেইল receiver সম্পূর্ণভাবে কাস্টমাইজযোগ্য! 🎉
