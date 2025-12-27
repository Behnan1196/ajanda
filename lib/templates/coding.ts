export const codingTemplates = [
    {
        id: 'coding-frontend-react',
        name: 'Modern Frontend (React+TS)',
        description: 'HTML5, CSS3, JavaScript temellerinden başlayıp React, TypeScript ve Tailwind CSS ile profesyonel bir seviyeye ulaşma programı.',
        duration_days: 90,
        tasks: [
            { id: 'c1', title: 'HTML & Semantic Web Temelleri', description: 'HTML5 etiketleri, semantik yapı ve erişilebilirlik temelleri.', day: 1, duration: 120, category: 'Frontend' },
            { id: 'c2', title: 'CSS Flexbox ve Grid Mastering', description: 'Modern yerleşim düzenleri üzerinde pratik çalışmalar.', day: 3, duration: 120, category: 'Frontend' },
            { id: 'c3', title: 'Modern JavaScript (ES6+) Özellikleri', description: 'Arrow functions, destructuring, promises ve async/await.', day: 7, duration: 180, category: 'Frontend' },
            { id: 'c4', title: 'React Hookları ve Bileşen Yapısı', description: 'useState, useEffect ve custom hook mimarisi.', day: 14, duration: 240, category: 'React' },
            { id: 'c5', title: 'State Management (Redux/Zustand)', description: 'Global state yönetimi ve veri akışı prensipleri.', day: 21, duration: 180, category: 'React' },
            { id: 'c6', title: 'API Integration & Fetching', description: 'Axios ve TanStack Query ile veri çekme ve yönetme.', day: 30, duration: 240, category: 'Frontend' },
            { id: 'c7', title: 'TypeScript Integration', description: 'React ile TypeScript kullanımı, interface ve tip tanımlamaları.', day: 45, duration: 180, category: 'TypeScript' },
            { id: 'c8', title: 'Bitirme Projesi: Portfolyo/Dashboard', description: 'Öğrenilen tüm teknolojileri içeren kapsamlı final projesi.', day: 60, duration: 480, category: 'Proje' }
        ]
    },
    {
        id: 'coding-backend-node',
        name: 'Full-Stack Node.js & Express',
        description: 'Server-side geliştirme, REST API tasarımı, veritabanı yönetimi (PostgreSQL/MongoDB) ve güvenli kimlik doğrulama.',
        duration_days: 60,
        tasks: [
            { id: 'b1', title: 'Node.js Event Loop ve Runtime', description: 'Node.js çalışma mantığı, modül sistemi ve core modüller.', day: 1, duration: 120, category: 'Backend' },
            { id: 'b2', title: 'Express.js Middleware ve Routing', description: 'Server oluşturma, yönlendirme ve ara yazılım mimarisi.', day: 5, duration: 180, category: 'Backend' },
            { id: 'b3', title: 'SQL & Database Design (PostgreSQL)', description: 'İlişkisel veritabanı tasarımı, normalizasyon ve SQL sorguları.', day: 10, duration: 240, category: 'Database' },
            { id: 'b4', title: 'Prisma/Mongoose ORM Kullanımı', description: 'Veritabanı erişim katmanı ve şemaların yönetimi.', day: 15, duration: 120, category: 'Database' },
            { id: 'b5', title: 'Authentication (JWT & OAuth2)', description: 'Güvenli kullanıcı girişi, yetkilendirme ve token yönetimi.', day: 20, duration: 180, category: 'Security' },
            { id: 'b6', title: 'Unit Testing (Jest/Mocha)', description: 'Kod kalitesi için birim testleri ve TDD yaklaşımı.', day: 30, duration: 240, category: 'QA' },
            { id: 'b7', title: 'Docker & Deployment Temelleri', description: 'Uygulamayı containerize etme ve bulut ortamına taşıma.', day: 45, duration: 180, category: 'DevOps' }
        ]
    },
    {
        id: 'coding-basic-python',
        name: 'Python ile Algoritma ve Temeller',
        description: 'Yazılıma yeni başlayanlar için Python dili üzerinden programlama mantığı, veri yapıları ve temel algoritmalar.',
        duration_days: 30,
        tasks: [
            { id: 'p1', title: 'Python Kurulumu ve Değişkenler', description: 'Geliştirme ortamı kurulumu ve temel veri tipleri.', day: 1, duration: 60, category: 'Temeller' },
            { id: 'p2', title: 'Kontrol Yapıları (If/Else, Loops)', description: 'Koşullu durumlar ve döngülerle akış yönetimi.', day: 3, duration: 120, category: 'Temeller' },
            { id: 'p3', title: 'Fonksiyonlar ve Modüler Kod Yazımı', description: 'Yeniden kullanılabilir kod blokları ve modül importları.', day: 7, duration: 90, category: 'Temeller' },
            { id: 'p4', title: 'Listeler, Sözlükler ve Set Yapıları', description: 'Python’ın güçlü veri yapıları ve kullanım alanları.', day: 10, duration: 120, category: 'Veri Yapıları' },
            { id: 'p5', title: 'Hata Yönetimi ve File I/O', description: 'Try/except blokları ve dosya okuma/yazma işlemleri.', day: 15, duration: 90, category: 'İleri Seviye' },
            { id: 'p6', title: 'OOP (Nesne Yönelimli Programlama) Giriş', description: 'Class, object, inheritance ve encapsulation kavramları.', day: 20, duration: 180, category: 'İleri Seviye' },
            { id: 'p7', title: 'Final Mini Projesi', description: 'Öğrenilenleri pekiştiren küçük ölçekli bir uygulama.', day: 25, duration: 240, category: 'Proje' }
        ]
    }
]

export function getCodingTemplate(id: string) {
    return codingTemplates.find(t => t.id === id)
}
