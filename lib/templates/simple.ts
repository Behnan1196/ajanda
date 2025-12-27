export interface TaskTemplate {
    day: number
    title: string
    description: string
    duration: number // dakika
    category?: string
}

export interface SimpleTemplate {
    id: string
    name: string
    description: string
    duration_days: number
    tasks: TaskTemplate[]
}

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

// Haftalık Temizlik Rutini Şablonu
export const weeklyCleaningTemplate: SimpleTemplate = {
    id: 'weekly-cleaning',
    name: 'Haftalık Ev Temizliği',
    description: 'Haftanın her günü için farklı bir temizlik görevi',
    duration_days: 7,
    tasks: [
        {
            day: 1,
            title: 'Pazartesi - Mutfak Temizliği',
            description: 'Tezgahları sil, bulaşık makinesini çalıştır, çöpleri at',
            duration: 30,
            category: 'Mutfak'
        },
        {
            day: 2,
            title: 'Salı - Banyo Temizliği',
            description: 'Lavabo, duş, tuvalet temizliği. Ayna ve muslukları parlatma',
            duration: 25,
            category: 'Banyo'
        },
        {
            day: 3,
            title: 'Çarşamba - Oturma Odası',
            description: 'Toz alma, süpürme, koltukları toplama',
            duration: 20,
            category: 'Oturma Odası'
        },
        {
            day: 4,
            title: 'Perşembe - Yatak Odası',
            description: 'Çarşaf değiştirme, toz alma, dolap düzenleme',
            duration: 30,
            category: 'Yatak Odası'
        },
        {
            day: 5,
            title: 'Cuma - Genel Süpürme',
            description: 'Tüm odaları süpür/elektrik süpürgesi ile temizle',
            duration: 35,
            category: 'Genel'
        },
        {
            day: 6,
            title: 'Cumartesi - Cam Silme',
            description: 'Pencere ve ayna temizliği',
            duration: 40,
            category: 'Genel'
        },
        {
            day: 7,
            title: 'Pazar - Çamaşır Günü',
            description: 'Çamaşırları yıka, kat, yerleştir',
            duration: 45,
            category: 'Çamaşır'
        }
    ]
}

// Basit TYT Çalışma Programı (Örnek)
export const simpleStudyTemplate: SimpleTemplate = {
    id: 'simple-study',
    name: '5 Günlük TYT Matematik',
    description: 'Temel matematik konuları için 5 günlük çalışma programı',
    duration_days: 5,
    tasks: [
        {
            day: 1,
            title: 'Gün 1 - Sayılar',
            description: 'Temel sayı işlemleri ve özellikleri. 20 soru çöz.',
            duration: 60,
            category: 'Matematik'
        },
        {
            day: 2,
            title: 'Gün 2 - Denklemler',
            description: 'Birinci derece denklemler. 25 soru çöz.',
            duration: 60,
            category: 'Matematik'
        },
        {
            day: 3,
            title: 'Gün 3 - Geometri',
            description: 'Temel geometri şekilleri ve alan hesaplama. 20 soru çöz.',
            duration: 60,
            category: 'Matematik'
        },
        {
            day: 4,
            title: 'Gün 4 - Problemler',
            description: 'Günlük hayat problemleri. 30 soru çöz.',
            duration: 60,
            category: 'Matematik'
        },
        {
            day: 5,
            title: 'Gün 5 - Deneme Sınavı',
            description: 'Tüm konulardan 40 soruluk deneme sınavı',
            duration: 90,
            category: 'Matematik'
        }
    ]
}

export const simpleTemplates: SimpleTemplate[] = [
    weeklyCleaningTemplate,
    simpleStudyTemplate
]

export function getSimpleTemplate(id: string): SimpleTemplate | undefined {
    return simpleTemplates.find(t => t.id === id)
}
