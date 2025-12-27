'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TemplateSelector from '@/components/tutor/TemplateSelector'

export default function MusicCoachingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const studentIdParam = searchParams?.get('studentId')

    const [step, setStep] = useState<'intake' | 'template'>('intake')
    const [formData, setFormData] = useState({
        instrument: '',
        level: 'beginner',
        focus: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setStep('template')
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 hover:text-gray-900 mb-4"
                    >
                        ← Geri
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="text-4xl">🎸</span>
                        Müzik Koçluğu
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Enstrüman ve gelişim odaklı çalışma planı oluşturun
                    </p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 ${step === 'intake' ? 'text-purple-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'intake' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                            1
                        </div>
                        <span className="font-bold">Enstrüman</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-200"></div>
                    <div className={`flex items-center gap-2 ${step === 'template' ? 'text-purple-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'template' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                            2
                        </div>
                        <span className="font-bold">Şablon Seçimi</span>
                    </div>
                </div>

                {step === 'intake' ? (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 space-y-6 border border-gray-200">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Enstrüman
                                </label>
                                <input
                                    type="text"
                                    value={formData.instrument}
                                    onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                                    placeholder="Örn: Gitar, Piyano..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Seviye
                                </label>
                                <select
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                >
                                    <option value="beginner">Başlangıç</option>
                                    <option value="intermediate">Orta</option>
                                    <option value="advanced">İleri</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Odaklanmak İstediğiniz Konular
                            </label>
                            <textarea
                                value={formData.focus}
                                onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                                placeholder="Örn: Bare basma, solo teknikleri, müzik teorisi..."
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                rows={3}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full px-6 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition text-lg"
                        >
                            Devam Et →
                        </button>
                    </form>
                ) : (
                    <div className="bg-white rounded-2xl p-8 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">🎸 Pratik Şablonları</h3>
                        <p className="text-gray-600 mb-8">
                            {formData.instrument} için {formData.level} seviyesine uygun programlar:
                        </p>

                        <TemplateSelector
                            moduleType="music"
                            onSuccess={() => {
                                alert('✅ Müzik programı başarıyla oluşturuldu!')
                                router.push('/tutor')
                            }}
                            defaultStudentId={studentIdParam || undefined}
                        />

                        <button
                            onClick={() => setStep('intake')}
                            className="mt-8 text-gray-400 hover:text-gray-600 font-bold transition flex items-center gap-2"
                        >
                            ← Bilgilere Geri Dön
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
