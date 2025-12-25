# Proje Vizyonu ve Mimari Yol Haritası

Bu doküman, uygulamanın temel felsefesini, rol yapılarını ve gelecek vizyonunu tanımlar. Proje, sadece bir "koçluk uygulaması" değil, modüler bir gelişim ekosistemi olarak tasarlanmıştır.

## 1. Temel Kavramlar (Terminology)

- **Persona:** Uygulamanın temel kullanıcısı. Herkes bir Personadır. Kendi ajandasına, günlük planına ve kişisel gelişim araçlarına sahiptir.
- **Tutor (Eğitmen/Mentör):** Persona rolüne ek olarak, başkalarına rehberlik etme yetkisine sahip kullanıcı. Tutor, kendi ajandasına sahip olduğu gibi, yönettiği Personaların gelişimini izleme ve onlara görev atama yetkisine sahiptir.

## 2. Mimari Yapı: Core & Modules

Uygulama, merkezi bir çekirdek (Core) ve ona eklenen özelleşmiş modüllerden oluşur:

### Core (Çekirdek Planlayıcı)
- Kişisel Ajanda (Günlük/Haftalık/Aylık).
- Alışkanlık Takibi.
- Kişisel Notlar ve Hatırlatıcılar.
- **Lokal-First Yaklaşımı:** Çekirdek özelliklerin IndexedDB üzerinden çevrimdışı (offline) çalışabilmesi.

### Modüller (Plugins)
Her mentörlük türü birer modül olarak sisteme entegre edilir:
- **YKS/LGS Hazırlık Modülü:** Deneme takibi, sınav analizi, ders bazlı metrikler.
- **Spor/Sağlık Modülü (Gelecek):** Antrenman planları, diyet takibi.
- **Kurumsal Mentörlük (Gelecek):** Proje bazlı KPI takipleri.

*Her modülün detayları farklı olsa da, Persona için hepsi ortak ajandada birer **Görev** ve **Gelişim Metriği** olarak normalize edilir.*

## 3. Veri ve Depolama Stratejisi

- **Backend (Supabase):** Verilerin ana kopyasının tutulduğu, senkronizasyon ve yetkilendirme katmanı.
- **Private Cloud (User Google Drive):** Resim, PDF ve büyük medya dosyalarının depolanma maliyetini sıfıra indirmek ve veri sahipliğini kullanıcıya bırakmak için kullanıcının kendi bulut alanını kullanması.
- **Lokal Storage:** Hız ve çevrimdışı kullanım için mobil/PWA üzerinde verilerin anlık cache lenmesi.

## 4. Kullanıcı Deneyimi İlkeleri

- **Unified Dashboard:** Herkes için tanıdık, ama rollere göre genişleyen tek bir arayüz (Indigo/Purple tema ayrımı).
- **Offline Reliability:** "Metroda bile çalışır" sloganıyla pürüzsüz çevrimdışı deneyim.
- **Data Sovereignty:** Kullanıcının verisi üzerinde maksimum kontrol (Kendi bulutunu kullanma imkanı).
