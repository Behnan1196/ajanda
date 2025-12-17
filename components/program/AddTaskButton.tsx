interface AddTaskButtonProps {
    onClick: () => void
}

export default function AddTaskButton({ onClick }: AddTaskButtonProps) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center z-10"
            aria-label="Görev ekle"
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
        </button>
    )
}
