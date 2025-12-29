import { User } from '@supabase/supabase-js'

interface FamilySummaryCardProps {
    student: any
    onClick: () => void
    isSelected: boolean
}

export default function FamilySummaryCard({ student, onClick, isSelected }: FamilySummaryCardProps) {
    // Mock progress for now, eventually this will come from realtime data
    const progress = student.progress || 0
    const pendingTasks = student.pending_tasks || 0

    return (
        <button
            onClick={onClick}
            className={`relative flex flex-col p-4 rounded-2xl border-2 transition-all w-full text-left group ${isSelected
                    ? 'bg-purple-50 border-purple-500 shadow-md transform scale-[1.02]'
                    : 'bg-white border-gray-100 hover:border-purple-200 hover:shadow-lg'
                }`}
        >
            <div className="flex items-center gap-4 mb-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold shadow-sm ${isSelected ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600'
                    }`}>
                    {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className={`font-bold text-lg ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                        {student.name}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                        {student.role || 'Öğrenci'}
                    </p>
                </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2 w-full">
                <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${isSelected ? 'bg-purple-500' : 'bg-gray-400 group-hover:bg-purple-400'}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <span className="text-xs font-bold text-gray-500">{progress}%</span>
            </div>

            <div className="mt-3 flex gap-2">
                <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${pendingTasks > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                    }`}>
                    {pendingTasks > 0 ? `${pendingTasks} Görev Bekliyor` : 'Her şey tamam!'}
                </span>
            </div>
        </button>
    )
}
