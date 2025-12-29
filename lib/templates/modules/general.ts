/**
 * General Module Templates (Unified Format)
 */

import { UnifiedProgramTemplate, registerTemplate } from '../unified'

const habit30Days: UnifiedProgramTemplate = {
    id: 'general-habit-30',
    name: 'Özel Alışkanlık - 30 Gün',
    description: 'Kişiselleştirilebilir 30 günlük alışkanlık programı',
    module: 'general',
    duration_days: 30,
    metadata: {
        difficulty: 'beginner',
        tags: ['Alışkanlık', 'Genel']
    },
    tasks: Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        title: `Gün ${i + 1} - Günlük Pratik`,
        description: 'Hedef alışkanlığını gerçekleştir',
        duration_minutes: 30,
        task_type: 'todo',
        settings: { custom_goal: true }
    }))
}

const weeklyGoals: UnifiedProgramTemplate = {
    id: 'general-weekly-goals',
    name: 'Haftalık Hedefler',
    description: '7 günlük basit hedef takibi',
    module: 'general',
    duration_days: 7,
    metadata: {
        difficulty: 'beginner',
        tags: ['Hedef', 'Kısa Vade']
    },
    tasks: Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        title: `Gün ${i + 1} Hedefi`,
        description: 'Günlük hedefini tamamla',
        duration_minutes: 45,
        task_type: 'todo',
        settings: { custom_goal: true }
    }))
}

registerTemplate(habit30Days)
registerTemplate(weeklyGoals)

export { habit30Days, weeklyGoals }
