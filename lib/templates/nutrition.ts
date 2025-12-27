export interface MealTemplate {
    day: number
    type: 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner'
    title: string
    suggested_time: string
    calories: number
    foods: string[]
    duration: number // dakika
}

export interface NutritionTemplate {
    id: string
    name: string
    description: string
    duration_days: number
    target_calories: number
    meals: MealTemplate[]
}

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

// Helper: Tüm günler için öğün şablonları oluştur
function generateWeeklyMeals(): MealTemplate[] {
    const meals: MealTemplate[] = []

    for (let day = 1; day <= 7; day++) {
        const dayName = DAYS[day - 1]

        // Kahvaltı
        meals.push({
            day,
            type: 'breakfast',
            title: `${dayName} Kahvaltı`,
            suggested_time: '08:00',
            calories: 450,
            foods: [
                'Yulaf ezmesi (1 kase)',
                'Süt (1 bardak)',
                'Meyve (1 porsiyon)',
                'Fındık (10 adet)'
            ],
            duration: 30
        })

        // Ara Öğün 1
        meals.push({
            day,
            type: 'snack1',
            title: `${dayName} Ara Öğün`,
            suggested_time: '11:00',
            calories: 150,
            foods: [
                'Meyve (1 porsiyon)',
                'Badem (8-10 adet)'
            ],
            duration: 15
        })

        // Öğle Yemeği
        meals.push({
            day,
            type: 'lunch',
            title: `${dayName} Öğle Yemeği`,
            suggested_time: '13:00',
            calories: 600,
            foods: [
                'Izgara tavuk/balık (150g)',
                'Bulgur pilavı (1 kase)',
                'Salata (bol)',
                'Yoğurt (1 kase)'
            ],
            duration: 45
        })

        // Ara Öğün 2
        meals.push({
            day,
            type: 'snack2',
            title: `${dayName} İkindi Ara Öğün`,
            suggested_time: '16:00',
            calories: 150,
            foods: [
                'Tam tahıllı kraker (5-6 adet)',
                'Beyaz peynir (2 kibrit kutusu)'
            ],
            duration: 15
        })

        // Akşam Yemeği
        meals.push({
            day,
            type: 'dinner',
            title: `${dayName} Akşam Yemeği`,
            suggested_time: '19:00',
            calories: 500,
            foods: [
                'Sebze yemeği (1 porsiyon)',
                'Ekmek (1-2 dilim)',
                'Salata (bol)',
                'Ayran (1 bardak)'
            ],
            duration: 40
        })
    }

    return meals
}

export const nutritionTemplates: NutritionTemplate[] = [
    {
        id: 'weekly-balanced',
        name: '7 Günlük Dengeli Beslenme',
        description: 'Günlük 1850 kalori hedefli dengeli beslenme programı. 5 öğün sistemi ile metabolizmanızı hızlandırın.',
        duration_days: 7,
        target_calories: 1850,
        meals: generateWeeklyMeals()
    },
    {
        id: 'weekly-low-carb',
        name: '7 Günlük Düşük Karbonhidrat',
        description: 'Günlük 1600 kalori hedefli düşük karbonhidrat programı. Kilo verme odaklı.',
        duration_days: 7,
        target_calories: 1600,
        meals: generateWeeklyMeals().map(meal => ({
            ...meal,
            calories: Math.round(meal.calories * 0.85), // %15 kalori azaltma
            foods: meal.type === 'lunch' || meal.type === 'dinner'
                ? meal.foods.filter(f => !f.includes('pilavı') && !f.includes('Ekmek'))
                : meal.foods
        }))
    }
]

// Helper: Şablonu ID'ye göre bul
export function getNutritionTemplate(id: string): NutritionTemplate | undefined {
    return nutritionTemplates.find(t => t.id === id)
}
