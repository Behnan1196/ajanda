interface AddHabitButtonProps {
    onClick: () => void
}

export default function AddHabitButton({ onClick }: AddHabitButtonProps) {
    return (
        <button
            onClick={onClick}
            className="fixed right-6 bottom-24 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center justify-center z-10"
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        </button>
    )
}
