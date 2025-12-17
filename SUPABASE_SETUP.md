# Supabase Migration Talimatları

## Yöntem 1: Supabase Dashboard (Önerilen - En Kolay)

1. **Supabase Dashboard'a gidin:**
   https://supabase.com/dashboard/project/fanhamxbbnfydtzzwsls

2. **SQL Editor'ı açın:**
   Sol menüden: SQL Editor

3. **Migration dosyasını kopyalayın:**
   `supabase/migrations/20251205_initial_schema.sql` dosyasının içeriğini kopyalayın

4. **SQL Editor'da çalıştırın:**
   - "New query" tıklayın
   - Kopyaladığınız SQL'i yapıştırın
   - "Run" butonuna tıklayın

5. **Sonucu kontrol edin:**
   - Tables sekmesinden tabloların oluştuğunu kontrol edin
   - Görmeniz gereken tablolar:
     - users
     - organizations
     - user_relationships
     - task_types (2 satır veri ile)
     - tasks
     - reminders

---

## Yöntem 2: Supabase CLI ile (İleri Seviye)

### Adım 1: Access Token Alın

1. https://supabase.com/dashboard/account/tokens adresine gidin
2. "Generate new token" tıklayın
3. Token'ı kopyalayın

### Adım 2: Projeyi Link Edin

```bash
npx supabase link --project-ref fanhamxbbnfydtzzwsls
# Access token soracak, yapıştırın
```

### Adım 3: Migration'ı Push Edin

```bash
npx supabase db push
```

---

## Yöntem 3: Manuel SQL Çalıştırma

Eğer migration dosyasını parça parça çalıştırmak isterseniz:

### 1. Extension ve Tablolar
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Then copy table creation statements
```

### 2. Indexes
```sql
-- Copy all CREATE INDEX statements
```

### 3. Triggers
```sql
-- Copy trigger function and trigger statements
```

### 4. Seed Data
```sql
-- Copy INSERT INTO task_types statement
```

### 5. RLS Policies
```sql
-- Enable RLS
-- Copy all CREATE POLICY statements
```

---

## Doğrulama

Migration başarılı olduysa, aşağıdaki SQL ile kontrol edin:

```sql
-- Tabloları listele
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Task type'ları kontrol et
SELECT * FROM task_types;
```

Görmeniz gereken:
- 6 tablo (users, organizations, user_relationships, task_types, tasks, reminders)
- 2 task type (Video İzleme, Yapılacak)

---

## Test Kullanıcısı Oluşturma

Migration tamamlandıktan sonra:

1. **Supabase Dashboard → Authentication → Users**
2. **"Add user" → "Create new user"**
3. Bilgileri girin:
   - Email: `demo@example.com`
   - Password: `password123`
   - Auto-confirm: ✅ İşaretleyin

4. **Users tablosuna ekleyin:**
```sql
-- Auth user ID'sini alın (yukarıdaki işlemden sonra)
-- Sonra users tablosuna ekleyin:
INSERT INTO users (id, email, name, roles)
VALUES (
  'auth-user-id-buraya', 
  'demo@example.com', 
  'Demo Kullanıcı', 
  '{"student"}'
);
```

---

## Sorun Giderme

### "permission denied" hatası
RLS politikaları aktif ancak henüz auth.uid() yok. Dashboard'dan test edin.

### "relation does not exist" hatası  
Migration henüz çalıştırılmamış. Yukarıdaki adımları tekrar kontrol edin.

### Task types görünmüyor
Seed data çalışmamış. INSERT statement'ı manuel çalıştırın.

---

## Sonraki Adım

Migration tamamlandıktan sonra:

```bash
# Uygulamayı başlatın (zaten çalışıyor)
npm run dev
```

Ardından http://localhost:3000 adresine gidin ve test kullanıcısı ile giriş yapın!
