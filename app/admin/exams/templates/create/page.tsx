'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createExamTemplate, Section } from '@/app/actions/exams'

export default function CreateTemplatePage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [sections, setSections] = useState<Section[]>([
        { key: 'math', name: 'Matematik', question_count: 40 },
        { key: 'science', name: 'Fen Bilimleri', question_count: 20 }
    ])
    const [loading, setLoading] = useState(false)

    const handleAddSection = () => {
        setSections([...sections, { key: '', name: '', question_count: 0 }])
    }

    const handleRemoveSection = (index: number) => {
        const newSections = [...sections]
        newSections.splice(index, 1)
        setSections(newSections)
    }

    const handleSectionChange = (index: number, field: keyof Section, value: string | number) => {
        const newSections = [...sections]
        newSections[index] = { ...newSections[index], [field]: value }

        // Auto-generate key from name if key is empty
        if (field === 'name' && !newSections[index].key) {
            newSections[index].key = (value as string).toLowerCase()
                .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
                .replace(/[^a-z0-9]/g, '')
        }

        setSections(newSections)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Validate
        if (!name || sections.some(s => !s.name || s.question_count <= 0)) {
            alert('Lütfen tüm alanları doldurun')
            setLoading(false)
            return
        }

        const result = await createExamTemplate({ name, sections })

        if (result.error) {
            alert('Hata: ' + result.error)
        } else {
            router.push('/admin/exams')
        }
        setLoading(false)
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/admin/exams" className="text-gray-500 hover:text-gray-700">
                    ← İptal
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Yeni Sınav Şablonu</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Şablon Adı
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Örn: TYT Standart, LGS Deneme"
                        required
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Sınav Bölümleri (Dersler)
                        </label>
                        <button
                            type="button"
                            onClick={handleAddSection}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            + Bölüm Ekle
                        </button>
                    </div>

                    <div className="space-y-3">
                        {sections.map((section, index) => (
                            <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">Ders Adı</label>
                                    <input
                                        type="text"
                                        value={section.name}
                                        onChange={(e) => handleSectionChange(index, 'name', e.target.value)}
                                        className="w-full px-3 py-2 rounded border border-gray-300 text-sm"
                                        placeholder="Örn: Matematik"
                                        required
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs text-gray-500 mb-1">Soru Sayısı</label>
                                    <input
                                        type="number"
                                        value={section.question_count}
                                        onChange={(e) => handleSectionChange(index, 'question_count', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 rounded border border-gray-300 text-sm"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="pt-6">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSection(index)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                        title="Sil"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Oluşturuluyor...' : 'Şablonu Oluştur'}
                    </button>
                </div>
            </form>
        </div>
    )
}
