'use client'

interface CompactDailyPracticeProps {
    tasks: any[]
}

export default function CompactDailyPractice({ tasks }: CompactDailyPracticeProps) {
    if (!tasks || tasks.length === 0) return null

    const totalDuration = tasks.reduce((sum, t) => sum + (t.metadata?.duration || 0), 0)

    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 rounded-lg border border-purple-100 mb-2 truncate" title="Günlük Çalışma Özeti">
            <span className="text-xs">🎸</span>
            <div className="flex flex-col">
                <span className="text-[9px] font-bold text-purple-700 uppercase leading-none">PRATİK</span>
                <span className="text-[10px] font-medium text-purple-600 leading-tight">
                    {totalDuration} dk çalışma
                </span>
            </div>
        </div>
    )
}
