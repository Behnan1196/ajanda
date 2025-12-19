import { useState } from 'react'
import QuickTodoModal from './QuickTodoModal'

interface AddQuickTodoButtonProps {
    initialDate?: Date
    onTaskAdded?: () => void
}

export default function AddQuickTodoButton({ initialDate, onTaskAdded }: AddQuickTodoButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 left-4 w-12 h-12 bg-white text-amber-500 rounded-full shadow-lg border border-amber-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 group"
                title="Hızlı Not Ekle"
            >
                <span className="text-xl group-hover:rotate-12 transition-transform">⚡</span>
            </button>

            {isOpen && <QuickTodoModal onClose={() => setIsOpen(false)} initialDate={initialDate} onTaskAdded={onTaskAdded} />}
        </>
    )
}
