/**
 * Music Module Templates (Unified Format)
 */

import { UnifiedProgramTemplate, registerTemplate } from '../unified'

const guitarBeginner: UnifiedProgramTemplate = {
    id: 'music-guitar-beginner',
    name: 'Gitar Başlangıç - 30 Gün',
    description: 'Temel gitar teknikleri ve ilk eserler',
    module: 'music',
    duration_days: 30,
    metadata: {
        difficulty: 'beginner',
        tags: ['Gitar', 'Başlangıç']
    },
    tasks: [
        { day: 1, title: 'Gitar Tanıma', description: 'Enstrüman tanıma, tuşe, akort', duration_minutes: 30, task_type: 'music', settings: { instrument: 'gitar', technique: 'temel', practice_type: 'theory' } },
        { day: 2, title: 'İlk Akortlar (E, A, D)', description: 'Temel akortları öğren ve geçiş yap', duration_minutes: 45, task_type: 'music', settings: { instrument: 'gitar', technique: 'akort', chords: ['E', 'A', 'D'] } },
        { day: 3, title: 'Ritim Çalışması', description: 'Basit ritim kalıpları', duration_minutes: 40, task_type: 'music', settings: { instrument: 'gitar', technique: 'ritim' } },
        { day: 4, title: 'Parmak Egzersizleri', description: 'Parmak güçlendirme', duration_minutes: 30, task_type: 'music', settings: { instrument: 'gitar', technique: 'teknik' } },
        { day: 5, title: 'İlk Şarkı (Temel)', description: 'Basit bir şarkı ile pratik', duration_minutes: 60, task_type: 'music', settings: { instrument: 'gitar', piece: 'Basit Şarkı', technique: 'repertuar' } },

        // Week 2-4: More practice (simplified)
        ...Array.from({ length: 25 }, (_, i) => ({
            day: i + 6,
            title: `Gün ${i + 6} - Pratik`,
            description: 'Düzenli pratik',
            duration_minutes: 45,
            task_type: 'music',
            settings: { instrument: 'gitar', practice_type: 'daily' }
        }))
    ]
}

registerTemplate(guitarBeginner)

export { guitarBeginner }
