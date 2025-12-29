/**
 * Nutrition Module Templates (Unified Format)
 */

import { UnifiedProgramTemplate, registerTemplate } from '../unified'

const weeklyBalanced: UnifiedProgramTemplate = {
    id: 'nutrition-weekly-balanced',
    name: '7 Günlük Dengeli Beslenme',
    description: 'Günlük 1850 kalori hedefli dengeli beslenme programı',
    module: 'nutrition',
    duration_days: 7,
    metadata: {
        difficulty: 'beginner',
        tags: ['Dengeli', 'Kilo Koruma']
    },
    tasks: [
        { day: 1, title: 'Pazartesi Kahvaltı', description: 'Yulaf, süt, meyve, fındık', duration_minutes: 30, task_type: 'nutrition', settings: { meal_type: 'breakfast', calories: 450, protein: 20, carbs: 60, fats: 15 } },
        { day: 1, title: 'Pazartesi Öğle', description: 'Izgara tavuk, bulgur, salata', duration_minutes: 45, task_type: 'nutrition', settings: { meal_type: 'lunch', calories: 600, protein: 40, carbs: 70, fats: 20 } },
        { day: 1, title: 'Pazartesi Akşam', description: 'Sebze yemeği, ekmek, salata', duration_minutes: 40, task_type: 'nutrition', settings: { meal_type: 'dinner', calories: 500, protein: 25, carbs: 65, fats: 15 } },

        { day: 2, title: 'Salı Kahvaltı', description: 'Yulaf, süt, meyve, badem', duration_minutes: 30, task_type: 'nutrition', settings: { meal_type: 'breakfast', calories: 450, protein: 20, carbs: 60, fats: 15 } },
        { day: 2, title: 'Salı Öğle', description: 'Izgara balık, pirinç, salata', duration_minutes: 45, task_type: 'nutrition', settings: { meal_type: 'lunch', calories: 600, protein: 40, carbs: 70, fats: 20 } },
        { day: 2, title: 'Salı Akşam', description: 'Sebze yemeği, ekmek, ayran', duration_minutes: 40, task_type: 'nutrition', settings: { meal_type: 'dinner', calories: 500, protein: 25, carbs: 65, fats: 15 } },

        // Days 3-7 similar pattern
        { day: 3, title: 'Çarşamba Kahvaltı', duration_minutes: 30, task_type: 'nutrition', settings: { meal_type: 'breakfast', calories: 450 } },
        { day: 3, title: 'Çarşamba Öğle', duration_minutes: 45, task_type: 'nutrition', settings: { meal_type: 'lunch', calories: 600 } },
        { day: 3, title: 'Çarşamba Akşam', duration_minutes: 40, task_type: 'nutrition', settings: { meal_type: 'dinner', calories: 500 } },

        { day: 4, title: 'Perşembe Kahvaltı', duration_minutes: 30, task_type: 'nutrition', settings: { meal_type: 'breakfast', calories: 450 } },
        { day: 4, title: 'Perşembe Öğle', duration_minutes: 45, task_type: 'nutrition', settings: { meal_type: 'lunch', calories: 600 } },
        { day: 4, title: 'Perşembe Akşam', duration_minutes: 40, task_type: 'nutrition', settings: { meal_type: 'dinner', calories: 500 } },

        { day: 5, title: 'Cuma Kahvaltı', duration_minutes: 30, task_type: 'nutrition', settings: { meal_type: 'breakfast', calories: 450 } },
        { day: 5, title: 'Cuma Öğle', duration_minutes: 45, task_type: 'nutrition', settings: { meal_type: 'lunch', calories: 600 } },
        { day: 5, title: 'Cuma Akşam', duration_minutes: 40, task_type: 'nutrition', settings: { meal_type: 'dinner', calories: 500 } },

        { day: 6, title: 'Cumartesi Kahvaltı', duration_minutes: 30, task_type: 'nutrition', settings: { meal_type: 'breakfast', calories: 450 } },
        { day: 6, title: 'Cumartesi Öğle', duration_minutes: 45, task_type: 'nutrition', settings: { meal_type: 'lunch', calories: 600 } },
        { day: 6, title: 'Cumartesi Akşam', duration_minutes: 40, task_type: 'nutrition', settings: { meal_type: 'dinner', calories: 500 } },

        { day: 7, title: 'Pazar Kahvaltı', duration_minutes: 30, task_type: 'nutrition', settings: { meal_type: 'breakfast', calories: 450 } },
        { day: 7, title: 'Pazar Öğle', duration_minutes: 45, task_type: 'nutrition', settings: { meal_type: 'lunch', calories: 600 } },
        { day: 7, title: 'Pazar Akşam', duration_minutes: 40, task_type: 'nutrition', settings: { meal_type: 'dinner', calories: 500 } }
    ]
}

registerTemplate(weeklyBalanced)

export { weeklyBalanced }
