# Dokümantasyon Rehberi

Bu klasör, projenin tüm dokümantasyonunu içerir. Bağlantı kesintisi veya bilgi kaybı durumunda bu dosyalar ile projeyi sıfırdan oluşturabilirsiniz.

## Dosya Yapısı

### 01-REQUIREMENTS.md
**Proje Gereksinimleri**
- Genel bakış ve teknik yığın
- Kullanıcı rolleri
- Ana modüller ve özellikleri
- Veritabanı yapısı özeti
- Güvenlik prensipler
- UI/UX kuralları
- Özellik durumu (tamamlanan/devam eden/planlanmış)
- Deployment senaryosu

### 02-DATABASE-SCHEMA.md
**Veritabanı Şeması**
- Detaylı tablo yapıları
- İlişkiler (Foreign Keys)
- İndeksler
- Row Level Security (RLS) politikaları
- Trigger'lar
- Migration SQL script'i
- Örnek sorgular

### 03-ARCHITECTURE.md
**Component Mimarisi**
- Tüm component'lerin detaylı açıklaması
- Props ve State yapıları
- Fonksiyonlar ve işlevleri
- Component arası ilişkiler
- Supabase utility fonksiyonları
- Animasyon tanımları

### 04-SETUP-GUIDE.md
**Kurulum Rehberi**
- Adım adım kurulum talimatları
- Supabase kurulumu
- Environment variables
- Database migration
- Test kullanıcısı oluşturma
- İlk test senaryoları
- Production deployment
- Sorun giderme

### 05-API-GUIDE.md
**API ve Veri Akışı**
- Supabase client kullanımı
- CRUD işlemleri
- Veri akışı örnekleri
- Authentication flow
- RLS policy örnekleri
- Error handling

## Kullanım Senaryoları

### Senaryo 1: Sıfırdan Kurulum

1. `04-SETUP-GUIDE.md` → Kurulum adımlarını takip et
2. `02-DATABASE-SCHEMA.md` → Migration'ı çalıştır
3. `01-REQUIREMENTS.md` → Özellikleri kontrol et
4. Test et

### Senaryo 2: Yeni Özellik Ekleme

1. `01-REQUIREMENTS.md` → Mevcut özellikleri gözden geçir
2. `03-ARCHITECTURE.md` → Component yapısını anla
3. `05-API-GUIDE.md` → Veri akışını planla
4. Kodu yaz
5. Dokümanları güncelle

### Senaryo 3: Bug Düzeltme

1. `03-ARCHITECTURE.md` → Component'i bul
2. `05-API-GUIDE.md` → Veri akışını kontrol et
3. `02-DATABASE-SCHEMA.md` → RLS politikalarını gözden geçir
4. Düzelt
5. Test et

### Senaryo 4: Bağlantı Kesildi / Bilgi Kaybı

1. Bu `README.md` dosyasını oku
2. `01-REQUIREMENTS.md` → Projeyi hatırla
3. `04-SETUP-GUIDE.md` → Kurulumu tekrar yap
4. `03-ARCHITECTURE.md` → Component'leri yeniden oluştur
5. `05-API-GUIDE.md` → Veri akışını implement et

## Güncelleme Kuralları

### Her Yeni Özellik Eklendiğinde:

1. `01-REQUIREMENTS.md` → Özellik durumunu güncelle
2. `03-ARCHITECTURE.md` → Yeni component'i dokümante et
3. `05-API-GUIDE.md` → Yeni API kullanımını ekle

### Database Değişikliği:

1. `02-DATABASE-SCHEMA.md` → Tablo/column ekle
2. Migration script'i güncelle
3. `05-API-GUIDE.md` → CRUD örneklerini güncelle

### UI/UX Değişikliği:

1. `01-REQUIREMENTS.md` → UI prensiplerini güncelle
2. `03-ARCHITECTURE.md` → Component yapısını güncelle

## Yedekleme Stratejisi

### Git ile

```bash
git add docs/*
git commit -m "docs: Updated documentation"
git push
```

### Manuel Yedek

```bash
# Tüm docs klasörünü kopyala
cp -r docs ~/Backups/po1-docs-$(date +%Y%m%d)
```

### Cloud Yedek

- Google Drive
- Dropbox
- OneDrive

## Önemli Notlar

⚠️ **Dokümantasyonu güncel tutun!**
- Her özellik eklendiğinde
- Her bug fix'ten sonra
- Önemli karar değişikliklerinde

✅ **Markdown formatını koruyun**
- Okunabilir başlıklar
- Kod blokları düzgün
- Listeler organize

📝 **Örnekler ekleyin**
- Kod örnekleri
- Veri akış diyagramları
- Screenshot'lar (gelecek)

## İletişim & Destek

Sorularınız için:
- GitHub Issues (gelecek)
- Proje sahibiyle iletişim

---

**Son Güncelleme:** 5 Aralık 2025
**Versiyon:** 0.1.0
