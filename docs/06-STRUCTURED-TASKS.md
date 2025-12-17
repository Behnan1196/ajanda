# Yapısal Görev Sistemi - Uygulama Planı

## Genel Bakış

Görevlerin ana konu (subject) ve alt konu (topic) altında organize edilmesi için yeni bir sistem.

## Veritabanı Değişiklikleri

### Yeni Tablolar

#### 1. subjects (Ana Konular)
```sql
- id (UUID)
- organization_id (UUID, FK) - Multi-tenant
- name (TEXT) - "Matematik", "Tai Chi"
- description (TEXT)
- icon (TEXT) - Emoji veya icon class
- color (TEXT) - Hex color (#3B82F6)
- is_active (BOOLEAN)
- is_system (BOOLEAN) - Sistem konusu
- created_by (UUID, FK)
```

**Örnek Data:**
- Matematik (📐, Mavi)
- Tai Chi (☯️, Yeşil)
- İngilizce (🇬🇧, Kırmızı)

#### 2. topics (Alt Konular)
```sql
- id (UUID)
- subject_id (UUID, FK) - Ana konu
- name (TEXT) - "Trigonometri", "Yang Formu"
- description (TEXT)
- order_index (INTEGER) - Sıralama
- is_active (BOOLEAN)
- is_system (BOOLEAN) - Sistem alt konusu
- created_by (UUID, FK)
```

**Örnek Data:**
- Matematik > Trigonometri
- Matematik > Geometri
- Tai Chi > Yang Formu
- Tai Chi > Chen Formu

#### 3. resources (Kaynaklar)
```sql
- id (UUID)
- subject_id (UUID, FK) - Hangi konuya ait
- topic_id (UUID, FK, nullable) - Alt konu (opsiyonel)
- name (TEXT) - "Trigonometri Video Serisi"
- type (TEXT) - 'video', 'document', 'link', 'book'
- url (TEXT)
- description (TEXT)
- metadata (JSONB) - Ek bilgiler
- is_active (BOOLEAN)
- created_by (UUID, FK)
```

### Tasks Tablosu Güncellemesi

```sql
ALTER TABLE tasks 
  ADD COLUMN subject_id UUID REFERENCES subjects(id),
  ADD COLUMN topic_id UUID REFERENCES topics(id);
```

## Güvenlik (RLS)

### Subjects & Topics & Resources
- **SELECT:** Herkes aktif olanları görebilir
- **ALL (INSERT/UPDATE/DELETE):** Sadece adminler

## UI Değişiklikleri

### 1. TaskFormModal Güncellemesi (v2 - Roller)

**Öğrenci Görünümü:**
- Basitleştirilmiş form
- "Ne yapacaksın?" (Başlık)
- Tarih / Saat
- "Özel Görev" checkbox (Koçtan gizle)
- Konu seçimi opsiyonel (Advanced toggle)

**Koç Görünümü:**
- Detaylı form
- Konu/Alt Konu seçimi
- Görev Tipi seçimi

### 2. TaskCard Güncellemesi

**Badge Ekleme:**
```tsx
{task.subject && (
  <div className="flex items-center gap-1 mb-2">
    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
      {task.subject.icon} {task.subject.name}
    </span>
    {task.topic && (
      <span className="text-xs text-gray-500">
        › {task.topic.name}
      </span>
    )}
  </div>
)}
```

**Görsel:**
```
┌─────────────────────────────┐
│ 📐 Matematik › Trigonometri │ ← Badge
│ Sin ve Cos fonksiyonları    │ ← Başlık
│ Video izle: ...             │
│ [Yaptım] [⋮]               │
└─────────────────────────────┘
```

### 3. TodayView & MonthlyView

**Filtreleme (Gelecek):**
```tsx
<select onChange={(e) => setFilterSubject(e.target.value)}>
  <option value="">Tüm Konular</option>
  {subjects.map(s => ...)}
</select>
```

## Admin Modülü

### Route Yapısı
```
/admin
  ├── /admin/users         # Kullanıcı yönetimi
  ├── /admin/subjects      # Ana konu yönetimi
  ├── /admin/topics        # Alt konu yönetimi
  └── /admin/resources     # Kaynak yönetimi
```

### Admin Dashboard Layout
```tsx
<AdminLayout>
  <Sidebar>
    - Dashboard
    - Kullanıcılar
    - Konular
      ↳ Ana Konular
      ↳ Alt Konular
    - Kaynaklar
  </Sidebar>
  
  <Main>
    {children}
  </Main>
</AdminLayout>
```

### Özellikler

#### Kullanıcı Yönetimi
- ✅ Liste görünümü (tablo)
- ✅ Arama ve filtreleme
- ✅ Yeni kullanıcı ekleme
- ✅ Rol güncelleme
- ✅ Koç atama
- ✅ Aktif/Pasif toggle

#### Konu Yönetimi
- ✅ Ana konu CRUD
- ✅ Alt konu CRUD
- ✅ Sürükle-bırak sıralama
- ✅ Renk ve ikon seçimi
- ✅ Aktif/Pasif toggle

#### Kaynak Yönetimi
- ✅ Kaynak CRUD
- ✅ Konuya bağlama
- ✅ Tip seçimi (video/document/link)
- ✅ URL validasyonu
- ✅ Metadata ekleme

## Uygulama Sırası

### Faz 1: Database ✅
1. Migration scripti oluştur
2. Supabase'e uygula
3. Test data ekle

### Faz 2: Admin Modülü
1. Admin layout oluştur
2. Subjects yönetimi
3. Topics yönetimi
4. Resources yönetimi
5. User yönetimi

### Faz 3: Görev Formu
1. TaskFormModal güncelle
2. Subject/Topic seçimi ekle
3. Cascade dropdown
4. TaskCard badge ekle

### Faz 4: TypeScript Types
1. database.types.ts güncelle
2. Interface'leri ekle

## Örnek Kullanım Senaryoları

### Senaryo 1: Matematik Dersi
```
1. Admin: "Matematik" konusu ekler
2. Admin: "Trigonometri" alt konusunu ekler
3. Öğrenci: Yeni görev ekler
   - Ana Konu: Matematik
   - Alt Konu: Trigonometri
   - Görev: "Sin cos video izle"
```

### Senaryo 2: Tai Chi Antrenmanı
```
1. Admin: "Tai Chi" konusu ekler
2. Admin: "Yang Formu" alt konusu ekler
3. Koç: Öğrenciye görev atar
   - Ana Konu: Tai Chi
   - Alt Konu: Yang Formu
   - Görev: "İlk 8 hareketi tekrarla"
```

## Gelecek Geliştirmeler

- [ ] İstatistikler (konulara göre ilerleme)
- [ ] Kaynak önerileri (konuya göre)
- [ ] Konu bazlı badge sistemi
- [ ] Gantt chart (konu timeline)
- [ ] Export/Import (konular)

---

**Hazırlayan:** AI Assistant  
**Tarih:** 5 Aralık 2025  
**Versiyon:** 1.0
