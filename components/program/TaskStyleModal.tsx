'use client'

import { useState } from 'react'

interface TaskStyleModalProps {
    currentStyle?: {
        color?: string
        border?: string
    }
    onSave: (style: { color: string; border: string }) => void
    onClose: () => void
}

const COLORS = [
    { id: 'white', bg: 'bg-white', border: 'border-gray-200', label: 'Beyaz' },
    { id: 'red', bg: 'bg-red-50', border: 'border-red-200', label: 'Kırmızı' },
    { id: 'green', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Yeşil' },
    { id: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Mavi' },
    { id: 'yellow', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Sarı' },
    { id: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Mor' },
]

const BORDERS = [
    { id: 'solid', class: 'border-solid', label: 'Düz' },
    { id: 'dashed', class: 'border-dashed', label: 'Kesik' },
    { id: 'thick', class: 'border-l-4', label: 'Kalın Sol' },
]

export default function TaskStyleModal({ currentStyle, onSave, onClose }: TaskStyleModalProps) {
    const [selectedColor, setSelectedColor] = useState(currentStyle?.color || 'white')
    const [selectedBorder, setSelectedBorder] = useState(currentStyle?.border || 'solid')

    const activeColor = COLORS.find(c => c.id === selectedColor) || COLORS[0]

    const handleSave = () => {
        onSave({
            color: selectedColor,
            border: selectedBorder
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">Kart Görünümü</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Preview */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Önizleme</label>
                        <div className={`p-4 rounded-xl shadow-sm border transition-all duration-300 transform
                            ${activeColor.bg} 
                            ${activeColor.border}
                            ${selectedBorder === 'dashed' ? 'border-dashed' : 'border-solid'}
                            ${selectedBorder === 'thick' ? 'border-l-4' : 'border'}
                        `}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-white/50 flex items-center justify-center text-xl">📝</div>
                                <div className="flex-1">
                                    <div className="h-2 w-24 bg-gray-900/10 rounded mb-2"></div>
                                    <div className="h-1.5 w-16 bg-gray-900/10 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Arkaplan Rengi</label>
                        <div className="grid grid-cols-6 gap-2">
                            {COLORS.map(color => (
                                <button
                                    key={color.id}
                                    onClick={() => setSelectedColor(color.id)}
                                    className={`w-full aspect-square rounded-full border-2 transition-all ${color.bg} ${color.border} 
                                        ${selectedColor === color.id ? 'ring-2 ring-indigo-500 scale-110 shadow-md' : 'border-transparent hover:scale-105'}
                                    `}
                                    title={color.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Borders */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Çerçeve Stili</label>
                        <div className="grid grid-cols-3 gap-3">
                            {BORDERS.map(border => (
                                <button
                                    key={border.id}
                                    onClick={() => setSelectedBorder(border.id)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all
                                        ${selectedBorder === border.id
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    {border.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                    >
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    )
}
