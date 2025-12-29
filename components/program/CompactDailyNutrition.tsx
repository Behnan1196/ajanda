'use client'

interface CompactDailyNutritionProps {
    tasks: any[]
}

export default function CompactDailyNutrition({ tasks }: CompactDailyNutritionProps) {
    if (!tasks || tasks.length === 0) return null

    const totalCalories = tasks.reduce((sum, t) => {
        if (t.is_completed) {
            return sum + (t.settings?.calories || 0)
        }
        return sum
    }, 0)

    const totalTarget = tasks.reduce((sum, t) => sum + (t.settings?.calories || 0), 0)

    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg border border-green-100 mb-2 truncate" title="Günlük Beslenme Özeti">
            <span className="text-xs">🍏</span>
            <div className="flex flex-col">
                <span className="text-[9px] font-bold text-green-700 uppercase leading-none">BESLENME</span>
                <span className="text-[10px] font-medium text-green-600 leading-tight">
                    {totalCalories} / {totalTarget} kcal
                </span>
            </div>
        </div>
    )
}
