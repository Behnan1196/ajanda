export interface ExamTaskTemplate {
    day: number
    title: string
    description: string
    duration: number // dakika
    subject: string
    topic?: string
    target_questions?: number
    task_type?: 'study' | 'practice' | 'test' | 'exam'
}

export interface ExamTemplate {
    id: string
    name: string
    description: string
    duration_days: number
    exam_type: 'TYT' | 'AYT' | 'YKS'
    tasks: ExamTaskTemplate[]
}

// 30 Günlük TYT Matematik Yoğun Program
export const tytMath30Days: ExamTemplate = {
    id: 'tyt-math-30',
    name: 'TYT Matematik - 30 Gün Yoğun',
    description: 'Temel matematik konularını 30 günde tamamlayan yoğun program',
    duration_days: 30,
    exam_type: 'TYT',
    tasks: [
        // Hafta 1: Temel Kavramlar
        { day: 1, title: 'Sayılar ve İşlemler', description: 'Temel sayı işlemleri, EBOB-EKOK. 30 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Sayılar', target_questions: 30, task_type: 'study' },
        { day: 2, title: 'Sayılar Test', description: 'Konu testi: 20 soru, hedef 16+ doğru', duration: 40, subject: 'Matematik', topic: 'Sayılar', target_questions: 20, task_type: 'test' },
        { day: 3, title: 'Kesirler ve Ondalıklar', description: 'Kesir işlemleri, ondalık sayılar. 25 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Kesirler', target_questions: 25, task_type: 'study' },
        { day: 4, title: 'Oran-Orantı', description: 'Oran-orantı problemleri. 30 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Oran-Orantı', target_questions: 30, task_type: 'study' },
        { day: 5, title: 'Problemler', description: 'Günlük hayat problemleri. 35 soru çöz.', duration: 75, subject: 'Matematik', topic: 'Problemler', target_questions: 35, task_type: 'practice' },
        { day: 6, title: 'Haftalık Deneme 1', description: 'İlk hafta konularından 40 soruluk deneme', duration: 90, subject: 'Matematik', target_questions: 40, task_type: 'exam' },
        { day: 7, title: 'Deneme Çözümü ve Eksik Tekrar', description: 'Yanlış soruları çöz, eksik konuları tekrar et', duration: 60, subject: 'Matematik', task_type: 'practice' },

        // Hafta 2: Denklemler
        { day: 8, title: 'Birinci Derece Denklemler', description: '1. derece denklem çözme. 25 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Denklemler', target_questions: 25, task_type: 'study' },
        { day: 9, title: 'İkinci Derece Denklemler', description: '2. derece denklem çözme. 20 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Denklemler', target_questions: 20, task_type: 'study' },
        { day: 10, title: 'Denklem Sistemleri', description: 'İki bilinmeyenli denklemler. 25 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Denklemler', target_questions: 25, task_type: 'study' },
        { day: 11, title: 'Denklem Test', description: 'Konu testi: 25 soru, hedef 20+ doğru', duration: 50, subject: 'Matematik', topic: 'Denklemler', target_questions: 25, task_type: 'test' },
        { day: 12, title: 'Eşitsizlikler', description: 'Eşitsizlik çözme. 20 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Eşitsizlikler', target_questions: 20, task_type: 'study' },
        { day: 13, title: 'Haftalık Deneme 2', description: 'İlk 2 hafta konularından 40 soruluk deneme', duration: 90, subject: 'Matematik', target_questions: 40, task_type: 'exam' },
        { day: 14, title: 'Deneme Çözümü', description: 'Yanlış analizi ve tekrar', duration: 60, subject: 'Matematik', task_type: 'practice' },

        // Hafta 3: Geometri
        { day: 15, title: 'Temel Geometri', description: 'Açılar, üçgenler. 25 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Geometri', target_questions: 25, task_type: 'study' },
        { day: 16, title: 'Dörtgenler', description: 'Kare, dikdörtgen, paralelkenar. 20 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Geometri', target_questions: 20, task_type: 'study' },
        { day: 17, title: 'Çevre ve Alan', description: 'Alan hesaplamaları. 30 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Geometri', target_questions: 30, task_type: 'study' },
        { day: 18, title: 'Geometri Test', description: 'Konu testi: 20 soru, hedef 15+ doğru', duration: 40, subject: 'Matematik', topic: 'Geometri', target_questions: 20, task_type: 'test' },
        { day: 19, title: 'Analitik Geometri', description: 'Koordinat sistemi, doğru denklemi. 25 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Analitik Geometri', target_questions: 25, task_type: 'study' },
        { day: 20, title: 'Haftalık Deneme 3', description: '3 haftalık konulardan 40 soruluk deneme', duration: 90, subject: 'Matematik', target_questions: 40, task_type: 'exam' },
        { day: 21, title: 'Deneme Çözümü', description: 'Yanlış analizi ve tekrar', duration: 60, subject: 'Matematik', task_type: 'practice' },

        // Hafta 4: Fonksiyonlar ve Olasılık
        { day: 22, title: 'Fonksiyonlar', description: 'Fonksiyon kavramı, grafik. 25 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Fonksiyonlar', target_questions: 25, task_type: 'study' },
        { day: 23, title: 'Permütasyon-Kombinasyon', description: 'Permütasyon ve kombinasyon. 20 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Olasılık', target_questions: 20, task_type: 'study' },
        { day: 24, title: 'Olasılık', description: 'Olasılık hesaplama. 25 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Olasılık', target_questions: 25, task_type: 'study' },
        { day: 25, title: 'Olasılık Test', description: 'Konu testi: 15 soru, hedef 12+ doğru', duration: 30, subject: 'Matematik', topic: 'Olasılık', target_questions: 15, task_type: 'test' },
        { day: 26, title: 'Karma Problemler', description: 'Tüm konulardan karma sorular. 40 soru çöz.', duration: 90, subject: 'Matematik', target_questions: 40, task_type: 'practice' },
        { day: 27, title: 'Haftalık Deneme 4', description: 'Tüm konulardan 40 soruluk deneme', duration: 90, subject: 'Matematik', target_questions: 40, task_type: 'exam' },
        { day: 28, title: 'Deneme Çözümü', description: 'Yanlış analizi ve tekrar', duration: 60, subject: 'Matematik', task_type: 'practice' },
        { day: 29, title: 'Genel Tekrar', description: 'Zayıf konuları tekrar et. 50 soru çöz.', duration: 90, subject: 'Matematik', target_questions: 50, task_type: 'practice' },
        { day: 30, title: 'Final Deneme', description: 'Son deneme sınavı - 40 soru', duration: 90, subject: 'Matematik', target_questions: 40, task_type: 'exam' }
    ]
}

// 5 Günlük Hızlı TYT Matematik (Basit)
export const tytMath5Days: ExamTemplate = {
    id: 'tyt-math-5',
    name: 'TYT Matematik - 5 Gün Hızlı',
    description: 'Temel matematik konularını 5 günde gözden geçirme',
    duration_days: 5,
    exam_type: 'TYT',
    tasks: [
        { day: 1, title: 'Sayılar ve İşlemler', description: 'Temel konular. 20 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Sayılar', target_questions: 20, task_type: 'study' },
        { day: 2, title: 'Denklemler', description: 'Denklem çözme. 25 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Denklemler', target_questions: 25, task_type: 'study' },
        { day: 3, title: 'Geometri', description: 'Temel geometri. 20 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Geometri', target_questions: 20, task_type: 'study' },
        { day: 4, title: 'Problemler', description: 'Günlük hayat problemleri. 30 soru çöz.', duration: 60, subject: 'Matematik', topic: 'Problemler', target_questions: 30, task_type: 'practice' },
        { day: 5, title: 'Deneme Sınavı', description: 'Tüm konulardan 40 soruluk deneme', duration: 90, subject: 'Matematik', target_questions: 40, task_type: 'exam' }
    ]
}

export const examTemplates: ExamTemplate[] = [
    tytMath5Days,
    tytMath30Days
]

export function getExamTemplate(id: string): ExamTemplate | undefined {
    return examTemplates.find(t => t.id === id)
}
