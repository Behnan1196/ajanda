# Kişisel Yaşam Planlayıcı & Koçluk Sistemi

## Planlama Aşaması
- [x] Proje gereksinimlerini dokümante et
- [x] Veritabanı şemasını tasarla
- [x] Teknik mimariyi planla

## Geliştirme - Faz 1: Temel Yapı
- [x] Next.js projesini oluştur (App Router)
- [x] Supabase kurulumu ve konfigürasyonu
- [x] Kimlik doğrulama sistemi (Login)
- [x] Rol yönetimi (Öğrenci, Koç, Admin)

## Geliştirme - Faz 2: Program Modülü
### Bugün Sekmesi
- [x] Ana tab navigasyonu (Program, Gelişim, İletişim, Araçlar)
- [x] Alt sekme yapısı (Bugün, Haftalık, Aylık)
- [x] Görev ekleme formu (+butonu)
- [x] Görev tipleri:
  - [x] Video İzleme (YouTube link, açıklama, süre)
  - [x] Yapılacak/To-do (açıklama, tarih, saat, hatırlatıcı)
- [x] Görev kartı bileşeni
- [x] "Yaptım" işaretleme özelliği
- [x] Günlük navigasyon (Önceki/Sonraki gün)

### Yapısal Görev Sistemi (YENİ)
- [x] Subject/Topic veritabanı yapısı
- [x] Admin panelinde Subject/Topic yönetimi
- [x] Görevlere Subject/Topic ekleme
- [x] Görev kartlarında badge gösterimi

### Alışkanlık Takibi (YENİ)
- [x] Habits veritabanı yapısı
- [x] Alışkanlıklar sekmesi UI
- [x] Alışkanlık kartı ve streak takibi
- [x] Günlük tamamlama sistemi

## Geliştirme - Faz 3: Diğer Modüller
- [x] Haftalık görünüm (Weekly View)
- [x] Aylık görünüm (Takvim)
- [x] Gelişim/Performans modülü
  - [x] Tamamlanma oranları grafiği (Haftalık/Aylık)
  - [x] Konu bazlı analiz (Hangi konuda ne kadar çalışıldı)
  - [x] Alışkanlık takibi analizi
- [ ] İletişim modülü
- [ ] Araçlar modülü

## Geliştirme - Faz 4: Admin Paneli
- [x] Web tabanlı admin arayüzü (Layout & Dashboard)
- [x] Konu yönetimi (Subjects & Topics)
- [x] Kaynak yönetimi (Resources)
- [x] Kullanıcı yönetimi (CRUD)
  - [x] Listeleme
  - [x] Ekleme
  - [x] Düzenleme
  - [x] Silme
- [x] Koç-Öğrenci İlişkisi (Atama)
- [ ] Raporlama

## Geliştirme - Faz 6: Koç Paneli
- [x] Dashboard (Öğrenci Listesi)
- [x] Öğrenci Detay/Program Görünümü
- [x] Toplantı/Görüşme Görev Tipi (Meeting)

## Geliştirme - Faz 7: Sınav ve Analiz (YENİ)
- [x] Deneme Sınavı Yönetimi (Exam Module)
- [x] Sınav Sonuç Girişi
- [x] Detaylı Sınav Analizi (Görüntüleme)

## Geliştirme - Faz 8: AI Asistanı (YENİ)
- [x] Öğrenci verisi toplama (Sınavlar, Görevler)
- [x] AI tabanlı program önerisi
- [x] Eksik konu tespiti

- [x] Koç tarafından tanımlanabilir görevler
- [x] Hatırlatıcı/bildirim sistemi
- [ ] Multi-tenant yapıya geçiş

## Deployment
- [ ] React Native (Expo) dönüşümü
- [ ] EAS build konfigürasyonu
- [ ] iOS ve Android test
- [ ] Production deployment
