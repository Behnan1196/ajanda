# Sınav Yönetimi ve AI Asistanı Modülü

Bu doküman, projeye Faz 7 ve Faz 8 kapsamında eklenen **Deneme Sınavı Yönetimi** ve **AI Öğrenci Analiz Asistanı** modüllerinin detaylarını içerir.

## 1. Deneme Sınavı Yönetimi

Amacı, kurumsal deneme sınavlarını (TYT, AYT vb.) sisteme tanımlamak, takvimlemek ve öğrencilerin sınav sonuçlarını detaylı bir şekilde takip etmektir.

### Özellikler

#### Admin Paneli
- **Şablon Yönetimi:** Sınav türlerini (şablonlarını) oluşturma. Her şablon için dinamik dersler (bölümler) ve soru sayıları tanımlanabilir.
  - Örn: TYT Şablonu -> Türkçe (40), Matematik (40), Fen (20), Sosyal (20).
- **Sınav Takvimi:** Şablonlardan spesifik sınavlar oluşturma. Tarih ve isim belirleyerek (Örn: "3 Aralık Kurumsal TYT Denemesi") sisteme sınav tanımlanır.

#### Koç & Öğrenci Paneli
- **Sonuç Giriş Sihirbazı:** Öğrenci veya Koç, tanımlı sınavlardan birini seçerek sonuç girebilir.
- **Otomatik Net Hesaplama:** Doğru ve yanlış sayıları girildiğinde, 4 yanlış 1 doğruyu götürür kuralına göre (veya standart net hesabı) netler otomatik hesaplanır.
- **Tarihsel Takip:** Öğrenci detay sayfasında "Sınavlar" sekmesi altında geçmiş tüm sınav sonuçları, toplam netler ve ders bazlı kırılımlar listelenir.

### Teknik Uygulama
- **Veritabanı:** `exam_templates`, `exams`, `exam_results` tabloları.
- **Server Actions:** `app/actions/exams.ts` altında bulunan `createExamTemplate`, `saveExamResult` vb. fonksiyonlar.
- **RLS:** Koçlar, sadece kendi öğrencileri için sonuç girebilir/düzenleyebilir.

---

## 2. AI Öğrenci Analiz Asistanı (Google Gemini)

Google'ın **Gemini 2.5 Flash** modeli kullanılarak geliştirilmiş, koçlara yardımcı olan akıllı bir asistandır.

### Özellikler

#### 1. Veri Analizi
AI, öğrencinin şu verilerini anlık olarak analiz eder:
- **Son Sınavlar:** Son 3 deneme sınavının sonuçları, net değişimleri ve ders bazlı başarı durumu.
- **Tamamlanan Görevler:** Son 14 gün içindeki görev tamamlama oranları ve konu dağılımı.

#### 2. Koç Yönlendirmesi (Coach in the Loop)
Koç, analiz öncesinde AI'ya özel bir not veya odak noktası verebilir.
- *Örn: "Öğrencinin geometri netleri düşük, bu hafta buna odaklanalım."*
AI, bu notu dikkate alarak oluşturduğu programı şekillendirir.

#### 3. Haftalık Program Önerisi
AI, öğrencinin verilerine ve koçun notuna göre **7 günlük, yapılandırılmış bir çalışma programı** oluşturur.
- Her gün için bir "Ana Odak" (Focus) belirler.
- Her gün için spesifik görevler (Konu anlatımı, soru çözümü vb.) önerir.

#### 4. Tek Tıkla Uygulama
Oluşturulan haftalık program, **"Programı Uygula (+)"** butonu ile tek seferde öğrencinin takvimine işlenir.
- Sistem, "Pazartesi" gibi gün isimlerini otomatik olarak önümüzdeki tarihlere dönüştürür.
- Görevler veritabanına kaydedilir ve öğrencinin panelinde görünür.

### Teknik Uygulama
- **Model:** `gemini-2.5-flash`
- **Entegrasyon:** `app/actions/ai.ts` üzerinden Google Generative AI SDK kullanımı.
- **Prompt Mühendisliği:** AI'ya JSON formatında çıktı vermesi için kesin talimatlar (System Instructions) verilmiştir. Çıktı, arayüzde doğrudan tablo ve kartlar olarak render edilir.

### Güvenlik & Konfigürasyon
- API anahtarı `.env.local` dosyasında `GOOGLE_GEMINI_API_KEY` olarak saklanır.
- Sunucu tarafında (Server Actions) çalıştığı için API anahtarı istemciye (browser) sızmaz.
