# Proje Gereksinimleri

## Genel Bakış

Kişisel yaşam planlayıcı ve koçluk sistemi - Next.js tabanlı web uygulaması (PWA) ve gelecekte React Native (Expo) mobil uygulama.

## Teknik Yığın

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **State Management:** React Hooks (useState, useEffect)
- **UI Approach:** Mobil-first, responsive design

### Backend & Database
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **API:** Supabase PostgREST (auto-generated)
- **Security:** Row Level Security (RLS)

### Deployment
- **Web:** Vercel (önerilen)
- **Mobile:** Expo Application Services (EAS) - gelecek
- **Database:** Supabase Cloud

## Kullanıcı Rolleri

### 1. Öğrenci (Student)
- Kendi görevlerini yönetir
- Koçunun atadığı görevleri görür
- Özel (Private) görevler oluşturabilir
- İlerleme kaydeder
- **Erişim:** Web + Mobil

### 2. Koç (Coach)
- Öğrencilerine görev atar
- Öğrenci ilerlemesini takip eder
- Raporları görüntüler
- **Erişim:** Web + Mobil

### 3. Yönetici (Admin)
- Sistemdeki tüm verileri görür
- Kullanıcı yönetimi
- Konu ve İçerik Yönetimi (Subjects/Topics)
- Kaynak Yönetimi
- Sistem ayarları
- **Erişim:** Sadece Web

## Ana Modüller

### 1. Program (Görev Yönetimi)
**Durum:** ✅ Tamamlandı (v1)

**Alt Sekmeler:**
- **Bugün:** Günlük görev listesi
  - Önceki/Sonraki gün navigasyonu
  - Bugüne dön butonu
  - Görev ekleme/düzenleme/silme
  - Görev tamamlama/geri alma
  
- **Haftalık:** Haftalık görünüm
  - **Durum:** ⏳ Gelecek

- **Aylık:** Takvim görünümü
  - Aylık takvim grid'i
  - Görev sayısı göstergeleri (2/5 formatı)
  - Tarih seçimi → Bugün sekmesine geçiş

**Görev Tipleri:**
1. **Video İzleme**
   - YouTube URL
   - Süre (dakika)
   - Açıklama

2. **Yapılacak (To-Do)**
   - Başlık
   - Açıklama/Notlar
   - Tarih & Saat
   - Tarih & Saat
   - Hatırlatıcı

### 2. Yapısal Görev Sistemi (v0.2 - YENİ)
**Durum:** ✅ Tamamlandı

**Özellikler:**
- **Ana Konular (Subjects):** Matematik, Fizik, Tai Chi vb.
- **Alt Konular (Topics):** Türev, İntegral, Yang Formu vb.
- **Admin Yönetimi:** Konu ve alt konuların yönetimi
- **Entegrasyon:** Görevlerin konu ve alt konularla ilişkilendirilmesi

### 3. Alışkanlık Takibi (v0.3 - YENİ)
**Durum:** ✅ Tamamlandı

**Özellikler:**
- **Alışkanlık Oluşturma:** Sıklık (günlük/haftalık), hedef (sayı/süre)
- **Streak Takibi:** Zinciri kırma mantığı (🔥)
- **Rozetler:** 7 gün, 30 gün, 100 gün başarı rozetleri
- **Günlük Loglama:** Tamamlama durumunu kaydetme
- **Entegrasyon:** Konu bazlı alışkanlıklar

### 2. Gelişim (Development)
**Durum:** ⏳ Planlanmış

- İlerleme grafikleri
- Performans metrikleri
- Başarı rozetleri
- Hedef takibi

### 3. İletişim (Communication)
**Durum:** ⏳ Planlanmış

- Koç-öğrenci mesajlaşma
- Bildirimler
- Geri bildirim sistemi

### 4. Araçlar (Tools)
**Durum:** ⏳ Planlanmış

- Zamanlayıcı (Pomodoro)
- Not defteri
- Kaynak kütüphanesi
- Zamanlayıcı (Pomodoro)
- Not defteri
- Kaynak kütüphanesi

## Veritabanı Yapısı

### Ana Tablolar

#### users
```sql
- id (UUID, PK)
- email (TEXT, UNIQUE)
- name (TEXT)
- avatar_url (TEXT)
- roles (TEXT[]) - ['student', 'coach', 'admin']
- organization_id (UUID, FK)
- preferences (JSONB)
```

#### task_types
```sql
- id (UUID, PK)
- name (TEXT) - 'Video İzleme', 'Yapılacak'
- slug (TEXT, UNIQUE) - 'video', 'todo'
- icon (TEXT)
- schema (JSONB) - Dinamik form alanları
- is_system (BOOLEAN)
- is_active (BOOLEAN)
```

#### tasks
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- task_type_id (UUID, FK)
- title (TEXT)
- description (TEXT)
- metadata (JSONB) - Görev tipine özel data
- due_date (DATE)
- due_time (TIME)
- is_completed (BOOLEAN)
- completed_at (TIMESTAMP)
- created_by (UUID, FK)
- assigned_by (UUID, FK) - Koç ataması için
- is_private (BOOLEAN) - Özel görev

```

#### reminders
```sql
- id (UUID, PK)
- task_id (UUID, FK)
- remind_at (TIMESTAMP)
- notification_type (TEXT) - 'push', 'email'
- is_sent (BOOLEAN)
```

#### user_relationships
```sql
- id (UUID, PK)
- coach_id (UUID, FK)
- student_id (UUID, FK)
- is_active (BOOLEAN)
- notes (TEXT)
```

## Güvenlik

### Row Level Security (RLS)

**Users:**
- Kullanıcılar kendi profillerini görür/günceller
- Koçlar öğrencilerinin profillerini görür

**Tasks:**
- Kullanıcılar kendi görevlerini CRUD yapabilir
- Koçlar öğrencilerine görev oluşturabilir
- Koçlar öğrenci görevlerini görüntüleyebilir

**Task Types:**
- Herkes aktif görev tiplerini görebilir
- Sadece admin oluşturabilir/düzenleyebilir

## UI/UX Prensipleri

### Mobil-First Tasarım
- Tüm componentler önce mobil için tasarlanır
- Responsive breakpoints kullanılır
- Touch-friendly butonlar (min 44x44px)

### Navigasyon
- **Alt Tab Bar:** 4 ana modül (Program, Gelişim, İletişim, Araçlar)
- **Üst Tab Bar:** Alt sekmeler (Bugün, Haftalık, Aylık)
- **FAB (Floating Action Button):** Hızlı görev ekleme

### Renk Paleti
- **Primary:** Indigo (#4F46E5)
- **Success:** Green (#10B981)
- **Warning:** Yellow (#F59E0B)
- **Danger:** Red (#EF4444)
- **Neutral:** Gray scale

### Animasyonlar
- Modal açılış: fadeIn + slideUp
- Hover efektleri: subtle transitions
- Loading states: spinner

## Özellik Durumu

### ✅ Tamamlanan
- [x] Next.js projesi kurulumu
- [x] Supabase entegrasyonu
- [x] Database migration
- [x] Login sistemi
- [x] Dashboard & navigasyon
- [x] Görev ekleme (Video & To-Do)
- [x] Görev düzenleme
- [x] Görev silme
- [x] Görev tamamlama/geri alma
- [x] Günlük navigasyon
- [x] Aylık takvim görünümü
- [x] Takvimden tarih seçimi
- [x] Yapısal görev sistemi (Subject/Topic)
- [x] Admin paneli (Konu/Kaynak yönetimi)
- [x] Alışkanlık takibi (Habit Tracker)

### 🔄 Devam Eden
- [ ] Gün hesaplama bug fix (takvim)

### ⏳ Planlanmış
- [ ] Haftalık görünüm
- [x] Hatırlatıcı bildirimleri (PWA)
- [x] Koç Paneli Mobil Uyumluluğu (Responsive Sidebar)
- [x] Görev tamamla/geri al toggle UI iyileştirmesi
- [ ] Gelişim modülü
- [ ] İletişim modülü
- [ ] Araçlar modülü
- [ ] Admin paneli
- [ ] PWA manifest & service worker
- [ ] React Native dönüşümü

## Deployment Senaryosu

### Faz 1: Web MVP (Mevcut)
- Vercel deployment
- Supabase production database
- Custom domain (opsiyonel)

### Faz 2: PWA
- Service worker ekleme
- Offline destek
- Push notifications
- Install prompt

### Faz 3: Native Mobile
- React Native (Expo) migration
- EAS Build & Submit
- App Store & Google Play

## Performans Hedefleri

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Lighthouse Score:** > 90

## Erişilebilirlik

- WCAG 2.1 AA uyumlu
- Keyboard navigasyon
- Screen reader desteği
- Color contrast ratios

## Test Stratejisi

- **Unit Tests:** Component testing (gelecek)
- **Integration Tests:** API testing (gelecek)
- **E2E Tests:** User flows (gelecek)
- **Manual Testing:** Her özellik için test senaryosu

## Versiyon Notları

### v0.1.0 (Mevcut)
- İlk MVP
- Temel görev yönetimi
- Günlük ve aylık görünümler

---

**Son Güncelleme:** 5 Aralık 2025
