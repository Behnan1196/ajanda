export const codingTemplates = [
    {
        id: 'coding-frontend-react',
        name: 'Modern Frontend (React+TS)',
        description: 'HTML5, CSS3, JavaScript temellerinden başlayıp React, TypeScript ve Tailwind CSS ile profesyonel bir seviyeye ulaşma programı.',
        duration_days: 90,
        tasks: [
            { id: 'c1', title: 'HTML & Semantic Web Temelleri', day: 1, duration: 120 },
            { id: 'c2', title: 'CSS Flexbox ve Grid Mastering', day: 3, duration: 120 },
            { id: 'c3', title: 'Modern JavaScript (ES6+) Özellikleri', day: 7, duration: 180 },
            { id: 'c4', title: 'React Hookları ve Bileşen Yapısı', day: 14, duration: 240 },
            { id: 'c5', title: 'State Management (Redux/Zustand)', day: 21, duration: 180 },
            { id: 'c6', title: 'API Integration & Fetching', day: 30, duration: 240 },
            { id: 'c7', title: 'TypeScript Integration', day: 45, duration: 180 },
            { id: 'c8', title: 'Bitirme Projesi: Portfolyo/Dashboard', day: 60, duration: 480 }
        ]
    },
    {
        id: 'coding-backend-node',
        name: 'Full-Stack Node.js & Express',
        description: 'Server-side geliştirme, REST API tasarımı, veritabanı yönetimi (PostgreSQL/MongoDB) ve güvenli kimlik doğrulama.',
        duration_days: 60,
        tasks: [
            { id: 'b1', title: 'Node.js Event Loop ve Runtime', day: 1, duration: 120 },
            { id: 'b2', title: 'Express.js Middleware ve Routing', day: 5, duration: 180 },
            { id: 'b3', title: 'SQL & Database Design (PostgreSQL)', day: 10, duration: 240 },
            { id: 'b4', title: 'Prisma/Mongoose ORM Kullanımı', day: 15, duration: 120 },
            { id: 'b5', title: 'Authentication (JWT & OAuth2)', day: 20, duration: 180 },
            { id: 'b6', title: 'Unit Testing (Jest/Mocha)', day: 30, duration: 240 },
            { id: 'b7', title: 'Docker & Deployment Temelleri', day: 45, duration: 180 }
        ]
    },
    {
        id: 'coding-basic-python',
        name: 'Python ile Algoritma ve Temeller',
        description: 'Yazılıma yeni başlayanlar için Python dili üzerinden programlama mantığı, veri yapıları ve temel algoritmalar.',
        duration_days: 30,
        tasks: [
            { id: 'p1', title: 'Python Kurulumu ve Degişkenler', day: 1, duration: 60 },
            { id: 'p2', title: 'Kontrol Yapıları (If/Else, Loops)', day: 3, duration: 120 },
            { id: 'p3', title: 'Fonksiyonlar ve Modüler Kod Yazımı', day: 7, duration: 90 },
            { id: 'p4', title: 'Listeler, Sözlükler ve Set Yapıları', day: 10, duration: 120 },
            { id: 'p5', title: 'Hata Yönetimi ve File I/O', day: 15, duration: 90 },
            { id: 'p6', title: 'OOP (Nesne Yönelimli Programlama) Giriş', day: 20, duration: 180 },
            { id: 'p7', title: 'Final Mini Projesi: Calculator/Todo', day: 25, duration: 240 }
        ]
    }
]

export function getCodingTemplate(id: string) {
    return codingTemplates.find(t => t.id === id)
}
