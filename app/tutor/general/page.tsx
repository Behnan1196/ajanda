'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TemplateSelector from '@/components/tutor/TemplateSelector'

export default function GeneralCoachingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const studentIdParam = searchParams?.get('studentId')

    const [step, setStep] = useState<'intake' | 'template'>('intake')
    const [formData, setFormData] = useState({
        goal: '',
        duration: '30'
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
                        <span className="text-4xl">🎯</span>
                        Genel Koçluk
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Herhangi bir konuda özel gelişim programı oluşturun
                    </p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 ${step === 'intake' ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'intake' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                            1
                        </div>
                        <span className="font-bold">Hedefler</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-200"></div>
                    <div className={`flex items-center gap-2 ${step === 'template' ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'template' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                            2
                        </div>
                        <span className="font-bold">Şablon Seçimi</span>
                    </div>
                </div>

                {step === 'intake' ? (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 space-y-6 border border-gray-200">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Programın Amacı nedir?
                            </label>
                            <textarea
                                value={formData.goal}
                                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                placeholder="Örn: Yeni bir dil öğrenme, alışkanlık takibi..."
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                                rows={4}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Öngörülen Süre (Gün)
                            </label>
                            <input
                                type="number"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition text-lg"
                        >
                            Devam Et →
                        </button>
                    </form>
                ) : (
                    <div className="bg-white rounded-2xl p-8 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Şablon Seçimi</h3>
                        <p className="text-gray-600 mb-8">
                            Hedeflerinize en uygun temel yapıyı seçin:
                        </p>

                        <TemplateSelector
                            moduleType="general"
                            onSuccess={() => {
                                alert('✅ Program oluşturuldu!')
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
