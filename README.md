# Kişisel Yaşam Planlayıcı & Koçluk Sistemi

Next.js tabanlı kişisel gelişim ve görev takip uygulaması.

## 🚀 Hızlı Başlangıç

### 1. Supabase Migration'ı Çalıştırın

**En Kolay Yöntem:**
1. [Supabase Dashboard](https://supabase.com/dashboard/project/fanhamxbbnfydtzzwsls) → SQL Editor
2. `supabase/migrations/20251205_initial_schema.sql` dosyasını açın
3. Tüm içeriği kopyalayıp SQL Editor'a yapıştırın
4. "Run" tıklayın

Detaylı talimatlar için: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### 2. Environment Variables (✅ Tamamlandı)

`.env.local` dosyanız hazır:
```
NEXT_PUBLIC_SUPABASE_URL=https://fanhamxbbnfydtzzwsls.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Development Server (✅ Çalışıyor)

```bash
npm run dev
```

**Uygulama adresi:** http://localhost:3000

---

## 📦 Kurulum (İlk Sefer)

```bash
# Bağımlılıkları yükle
npm install

# Supabase CLI (opsiyonel)
npm install --save-dev supabase

# Dev server başlat
npm run dev
```

---

## 📁 Proje Yapısı

```
po1/
├── app/
│   ├── login/page.tsx          # Login sayfası
│   ├── page.tsx                # Dashboard
│   └── globals.css             # Global styles
├── components/
│   ├── DashboardTabs.tsx       # Ana tab navigasyonu
│   └── program/
│       ├── TodayView.tsx       # Bugün görünümü
│       ├── TaskCard.tsx        # Görev kartı
│       ├── AddTaskButton.tsx   # + butonu (FAB)
│       └── TaskFormModal.tsx   # Görev formu
├── lib/
│   ├── supabase/               # Supabase clients
│   └── database.types.ts       # TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
│       └── 20251205_initial_schema.sql
└── middleware.ts               # Auth middleware
```

---

## ✨ Özellikler

### ✅ Tamamlandı
- 🔐 **Authentication** - Email/password login with Supabase
- 📱 **Dashboard** - Tabbed navigation (Program, Gelişim, İletişim, Araçlar)
- 📅 **Task Management**
  - Create tasks (Video & To-Do types)
  - Edit & delete tasks
  - Mark as complete/incomplete
  - Daily navigation (previous/next day)
  - Monthly calendar view with task indicators
- 📚 **Structured Tasks** (NEW!)
  - Subject-based organization (e.g., Matematik, Tai Chi)
  - Topic-based categorization (e.g., Trigonometri, Yang Formu)
  - Visual badges on task cards
  - Cascade selection in task form
- 👨‍💼 **Admin Panel**
  - Subject management (CRUD)
  - Topic management (CRUD)
  - Resource management (CRUD)
  - Admin-only access control
- **Mobil Tasarım** - Mobil-first responsive UI

### 🔜 Yakında

- Haftalık/Aylık görünümler
- Hatırlatıcı bildirimleri
- Koç-öğrenci özellikleri
- Admin paneli
- PWA desteği
- React Native (Expo)

---

## 🎯 Test Senaryosu

### Migration Sonrası Test

1. **Test kullanıcısı oluşturun:**
   - Supabase Dashboard → Authentication → Add User
   - Email: `demo@example.com`
   - Password: `password123`
   - Auto Confirm: ✅

2. **Users tablosuna ekleyin:**
   ```sql
   INSERT INTO users (id, email, name, roles)
   SELECT id, 'demo@example.com', 'Demo Kullanıcı', '{"student"}'
   FROM auth.users 
   WHERE email = 'demo@example.com';
   ```

3. **Login testi:**
   - http://localhost:3000 → Login
   - Credentials: `demo@example.com` / `password123`

4. **Görev ekleme testi:**
   - Dashboard → + butonu
   - Video İzleme görevi oluştur
   - Yapılacak görevi oluştur

5. **Görev tamamlama:**
   - Herhangi bir görevde "Yaptım" butonuna tıkla
   - Görevin tamamlandı olarak işaretlendiğini kontrol et

---

## 🗄️ Veritabanı

### Ana Tablolar

| Tablo | Açıklama |
|-------|----------|
| `users` | Kullanıcılar (öğrenci, koç, admin) |
| `organizations` | Multi-tenant için organizasyonlar |
| `user_relationships` | Koç-öğrenci ilişkileri |
| `task_types` | Görev tipleri (Video, To-Do vb.) |
| `tasks` | Görevler |
| `reminders` | Hatırlatıcılar |

### Güvenlik

- ✅ Row Level Security (RLS) aktif
- ✅ Kullanıcılar sadece kendi verilerini görebilir
- ✅ Koçlar atandıkları öğrencileri görebilir
- ✅ Auth middleware ile korumalı route'lar

Detaylı şema: [veritabani_semasi.md](./.brain/veritabani_semasi.md)

---

## 🛠️ Teknolojiler

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL + Auth)
- **Supabase CLI** (Database migrations)

---

## 📚 Dokümantasyon

- [proje_gereksinimleri.md](./.brain/proje_gereksinimleri.md) - Detaylı gereksinimler
- [veritabani_semasi.md](./.brain/veritabani_semasi.md) - Veritabanı tasarımı
- [walkthrough.md](./.brain/walkthrough.md) - Proje walkthrough
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase kurulum talimatları

---

## 🐛 Sorun Giderme

### Migration çalışmıyor
→ [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) dosyasındaki adımları takip edin

### Login sonrası "User not found" hatası
→ Users tablosuna kullanıcı eklemeyi unutmayın (Yukarıdaki SQL)

### TypeScript hatası (Cannot find module)
→ VS Code'u restart edin veya TypeScript server'ı yeniden başlatın

### Dev server başlamıyor
→ `npm install` komutu ile bağımlılıkları tekrar yükleyin

---

## 🚀 Deployment

### Vercel (Önerilen)

```bash
# Build test
npm run build

# Vercel deploy
vercel --prod
```

Environment variables'ı Vercel dashboard'a ekleyin:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📧 İletişim

Bu proje hakkında sorularınız için proje sahibi ile iletişime geçin.

---

## 📝 Notlar

- Dev server port: **3000**
- Supabase Project: **fanhamxbbnfydtzzwsls**
- Database: **PostgreSQL** (Supabase managed)

**Son güncelleme:** 5 Aralık 2025
