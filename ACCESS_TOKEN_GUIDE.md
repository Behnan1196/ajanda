# Supabase Access Token Nasıl Bulunur

## Adım Adım

### 1. Supabase Dashboard'a Gidin
https://supabase.com/dashboard

### 2. Account Settings
- Sağ üstteki profil ikonuna tıklayın
- **"Account Settings"** seçin

### 3. Access Tokens Sayfası
- Sol menüden **"Access Tokens"** seçin
- Veya direkt: https://supabase.com/dashboard/account/tokens

### 4. Token Oluşturun
- **"Generate New Token"** butonuna tıklayın
- Token'a bir isim verin (örn: "Local Development")
- **"Generate Token"** tıklayın

### 5. Token'ı Kopyalayın
- ⚠️ **ÖNEMLİ:** Token sadece bir kez gösterilir!
- Token'ı hemen kopyalayın
- Güvenli bir yere kaydedin

### 6. Token'ı Kullanın

```bash
# Projeyi link edin
npx supabase link --project-ref fanhamxbbnfydtzzwsls

# Token soracak, yapıştırın
```

## Alternatif: Database Password Kullanın

Eğer access token oluşturmak istemezseniz, database password da kullanabilirsiniz:

```bash
npx supabase link --project-ref fanhamxbbnfydtzzwsls --password "Behnan1196!"
```

## Migration Çalıştırma

Link işlemi başarılı olduktan sonra:

```bash
# Migration dosyalarını remote'a push et
npx supabase db push
```

---

**Not:** Database password ile link etmeyi denedim ama "access control" hatası aldık. Access token daha güvenilir bir yöntem.
