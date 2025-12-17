# Kurulum Rehberi

## Ön Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Supabase hesabı
- Git (opsiyonel)

## 1. Proje Kurulumu

```bash
# Projeyi klonla (veya ZIP indir)
git clone [repo-url]
cd po1

# Bağımlılıkları yükle
npm install
```

## 2. Supabase Kurulumu

### 2.1 Proje Oluştur

1. https://supabase.com adresine git
2. "New Project" oluştur
3. Proje adı: `po1` (veya istediğin isim)
4. Database password kaydet: `Behnan1196!`
5. Region seç (Europe West önerilir)

### 2.2 Environment Variables

`.env.local` dosyası oluştur:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
```

**Değerleri bul:**
- Supabase Dashboard → Settings → API
- URL ve anon key'i kopyala

### 2.3 Database Migration

**Yöntem 1: SQL Editor (Kolay)**

1. Supabase Dashboard → SQL Editor
2. `docs/02-DATABASE-SCHEMA.md` dosyasını aç
3. Migration SQL'ini kopyala
4. SQL Editor'a yapıştır
5. "Run" tıkla

**Yöntem 2: Supabase CLI**

```bash
# CLI kur
npm install -g supabase

# Access token al
# https://supabase.com/dashboard/account/tokens

# Projeyi link et
npx supabase link --project-ref [PROJECT_ID]

# Migration'ı push et
npx supabase db push
```

## 3. Test Kullanıcısı Oluştur

### 3.1 Auth User

1. Supabase Dashboard → Authentication → Users
2. "Add user" → "Create new user"
3. Email: `demo@example.com`
4. Password: `password123`
5. **Auto Confirm User:** ✅ İşaretle
6. "Create user" tıkla

### 3.2 Users Tablosuna Ekle

SQL Editor'de çalıştır:

```sql
INSERT INTO users (id, email, name, roles)
SELECT id, email, 'Demo Kullanıcı', ARRAY['student']::text[]
FROM auth.users 
WHERE email = 'demo@example.com'
ON CONFLICT (id) DO NOTHING;
```

## 4. Uygulamayı Çalıştır

```bash
# Development server
npm run dev
```

Tarayıcıda aç: http://localhost:3000

## 5. İlk Giriş

1. Login sayfası açılır
2. Email: `demo@example.com`
3. Password: `password123`
4. "Giriş Yap" tıkla

✅ Dashboard açılmalı!

## 6. Test Senaryoları

### Görev Ekleme
1. Dashboard → Program → Bugün
2. `+` butonuna tıkla
3. Görev tipi seç
4. Bilgileri doldur
5. "Kaydet"

### Görev Tamamlama
1. Görev kartında "Yaptım" tıkla
2. Görev tamamlandı olarak işaretlenir

### Görev Düzenleme
1. Görev kartında ⋮ menüsü aç
2. "Düzenle" tıkla
3. Bilgileri değiştir
4. "Güncelle"

### Aylık Takvim
1. Program → Aylık sekmesi
2. Farklı günlere görevler ekle
3. Takvimde görev sayılarını gör
4. Bir güne tıkla → Bugün sekmesine geçer

## 7. Production Deployment

### Vercel Deployment

```bash
# Vercel CLI kur
npm install -g vercel

# Deploy
vercel --prod
```

**Environment Variables Ekle:**
- Vercel Dashboard → Project → Settings → Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database Güvenlik

Production'da mutlaka RLS aktif olmalı (zaten aktif).

## Sorun Giderme

### "User not found" hatası
→ Users tablosuna kullanıcı eklemeyi unutmayın

### TypeScript hatası
→ VS Code restart edin veya `npm run dev` yeniden başlatın

### Migration çalışmıyor
→ `docs/02-DATABASE-SCHEMA.md` talimatlarını takip edin

### Login sonrası redirect etmiyor
→ `.env.local` dosyasını kontrol edin

## Ek Komutlar

```bash
# Build (production)
npm run build

# Build sonrası çalıştır
npm run start

# Lint kontrolü
npm run lint

# Type check
npx tsc --noEmit
```

---

**Son Güncelleme:** 5 Aralık 2025
