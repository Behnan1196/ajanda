'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createExam, getExamTemplates } from '@/app/actions/exams'

export default function CreateExamPage() {
    const router = useRouter()
    const [templates, setTemplates] = useState<any[]>([])
    const [name, setName] = useState('')
    const [templateId, setTemplateId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        const data = await getExamTemplates()
        setTemplates(data)
        if (data.length > 0) setTemplateId(data[0].id)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!name || !templateId || !date) {
            alert('Lütfen tüm alanları doldurun')
            setLoading(false)
            return
        }

        const result = await createExam({ name, date, template_id: templateId })

        if (result.error) {
            alert('Hata: ' + result.error)
        } else {
            router.push('/admin/exams')
        }
        setLoading(false)
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/admin/exams" className="text-gray-500 hover:text-gray-700">
                    ← İptal
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Sınav Takvimle</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sınav Adı
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Örn: Özdebir Türkiye Geneli - 1"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sınav Şablonu (Tür)
                    </label>
                    <select
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                    >
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    {templates.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">Önce bir sınav şablonu oluşturmalısınız.</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tarih
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                    />
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || templates.length === 0}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Kaydediliyor...' : 'Sınavı Takvimle'}
                    </button>
                </div>
            </form>
        </div>
    )
}
