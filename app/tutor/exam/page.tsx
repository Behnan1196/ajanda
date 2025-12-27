'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TemplateSelector from '@/components/tutor/TemplateSelector'

interface ExamIntakeData {
    currentScore: string
    targetScore: string
    targetDepartment: string
    examDate: string
    weakSubjects: string[]
    studyHoursPerDay: string
}

export default function ExamCoachingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const studentIdParam = searchParams?.get('studentId')

    const [step, setStep] = useState<'intake' | 'analysis' | 'template'>('intake')
    const [formData, setFormData] = useState<ExamIntakeData>({
        currentScore: '',
        targetScore: '',
        targetDepartment: '',
        examDate: '',
        weakSubjects: [],
        studyHoursPerDay: '4'
    })
    const [analysis, setAnalysis] = useState<any>(null)

    const subjects = ['Matematik', 'Türkçe', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya']

    const toggleSubject = (subject: string) => {
        setFormData(prev => ({
            ...prev,
            weakSubjects: prev.weakSubjects.includes(subject)
                ? prev.weakSubjects.filter(s => s !== subject)
                : [...prev.weakSubjects, subject]
        }))
    }

    const handleAnalyze = (e: React.FormEvent) => {
        e.preventDefault()
        const current = parseFloat(formData.currentScore)
        const target = parseFloat(formData.targetScore)
        const scoreDiff = target - current
        const examDate = new Date(formData.examDate)
        const diffDays = Math.max(1, Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))

        // Intensity logic: 8 hours per score point gap
        const estimatedHoursNeeded = scoreDiff * 8
        const recommendedHoursPerDay = Math.round((estimatedHoursNeeded / diffDays) * 10) / 10
        const finalHours = Math.max(1, Math.min(14, recommendedHoursPerDay))

        let difficulty: 'low' | 'medium' | 'high' = 'low'
        if (finalHours > 6) difficulty = 'high'
        else if (finalHours > 3) difficulty = 'medium'

        let advice = ''
        if (difficulty === 'high') {
            advice = `Hedefinize ulaşmak oldukça zorlayıcı bir tempo gerektiriyor. Günlük ortalama ${finalHours} saat odaklanmış çalışma hedeflemelisiniz.`
            if (formData.weakSubjects.length > 0) {
                advice += ` Özellikle ${formData.weakSubjects.join(', ')} konularına ağırlık vererek net artışını hızlandırmalısınız.`
            }
        } else {
            advice = `Hedefiniz gerçekçi ve ulaşılabilir. Günlük ${finalHours} saatlik disiplinli bir çalışma ile ${formData.targetDepartment} hedefinize ulaşabilirsiniz.`
        }

        setAnalysis({
            daysUntilExam: diffDays,
            scoreDiff,
            totalStudyHours: Math.round(finalHours * diffDays),
            recommendedHoursPerDay: finalHours,
            difficulty,
            advice
        })
        setStep('analysis')
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
                        <span className="text-4xl">📚</span>
                        Sınav Koçluğu
                    </h1>
                    <p className="text-gray-600 mt-2">
                        TYT/AYT hazırlık programı oluşturun
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 ${step === 'intake' ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'intake' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                            1
                        </div>
                        <span className="font-bold">Bilgiler</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-200"></div>
                    <div className={`flex items-center gap-2 ${step === 'analysis' ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                            2
                        </div>
                        <span className="font-bold">Analiz</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-200"></div>
                    <div className={`flex items-center gap-2 ${step === 'template' ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'template' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                            3
                        </div>
                        <span className="font-bold">Şablon</span>
                    </div>
                </div>

                {/* Content */}
                {step === 'intake' && (
                    <form onSubmit={handleAnalyze} className="bg-white rounded-2xl p-8 space-y-6 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900">Öğrenci Hedefleri</h3>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Current Score */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Son Deneme Puanı
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.currentScore}
                                    onChange={(e) => setFormData({ ...formData, currentScore: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    placeholder="Örn: 350.50"
                                    required
                                />
                            </div>

                            {/* Target Score */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Hedef Puan
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.targetScore}
                                    onChange={(e) => setFormData({ ...formData, targetScore: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    placeholder="Örn: 450.00"
                                    required
                                />
                            </div>

                            {/* Target Department */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Hedef Bölüm
                                </label>
                                <input
                                    type="text"
                                    value={formData.targetDepartment}
                                    onChange={(e) => setFormData({ ...formData, targetDepartment: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    placeholder="Örn: Bilgisayar Mühendisliği"
                                    required
                                />
                            </div>

                            {/* Exam Date */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Sınav Tarihi
                                </label>
                                <input
                                    type="date"
                                    value={formData.examDate}
                                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>

                            {/* Study Hours */}
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Günlük Çalışma Saati
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={formData.studyHoursPerDay}
                                    onChange={(e) => setFormData({ ...formData, studyHoursPerDay: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Weak Subjects */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-3">
                                Zayıf Dersler (Seçiniz)
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {subjects.map(subject => (
                                    <button
                                        key={subject}
                                        type="button"
                                        onClick={() => toggleSubject(subject)}
                                        className={`px-4 py-2 rounded-xl font-bold transition ${formData.weakSubjects.includes(subject)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {subject}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition text-lg"
                        >
                            Analiz Et →
                        </button>
                    </form>
                )}

                {step === 'analysis' && analysis && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-8 border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">📊 Çalışma Planı Analizi</h3>

                            <div className="grid grid-cols-3 gap-6 mb-6">
                                <div className="text-center p-4 bg-blue-50 rounded-xl">
                                    <div className="text-3xl font-bold text-blue-600">{analysis.daysUntilExam}</div>
                                    <div className="text-xs text-gray-600 mt-1">Kalan Gün</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-xl">
                                    <div className="text-3xl font-bold text-purple-600">{analysis.scoreDiff}</div>
                                    <div className="text-xs text-gray-600 mt-1">Puan Farkı</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-xl">
                                    <div className="text-3xl font-bold text-green-600">{analysis.totalStudyHours}</div>
                                    <div className="text-xs text-gray-600 mt-1">Toplam Çalışma Saati</div>
                                </div>
                            </div>

                            <div className={`rounded-xl p-6 border ${analysis.difficulty === 'high' ? 'bg-red-50 border-red-200' :
                                analysis.difficulty === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                                    'bg-green-50 border-green-200'
                                }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className={`font-bold ${analysis.difficulty === 'high' ? 'text-red-900' :
                                        analysis.difficulty === 'medium' ? 'text-yellow-900' :
                                            'text-green-900'
                                        }`}>
                                        {analysis.difficulty === 'high' ? '🔥 Yoğun Tempo Gerekiyor' :
                                            analysis.difficulty === 'medium' ? '⚡ Orta Seviye Tempo' :
                                                '✅ Stabil Tempo'
                                        }
                                    </h4>
                                    <div className={`px-3 py-1 rounded-full text-xs font-black uppercase ${analysis.difficulty === 'high' ? 'bg-red-200 text-red-700' :
                                        analysis.difficulty === 'medium' ? 'bg-yellow-200 text-yellow-700' :
                                            'bg-green-200 text-green-700'
                                        }`}>
                                        Günlük {analysis.recommendedHoursPerDay} Saat
                                    </div>
                                </div>
                                <p className={analysis.difficulty === 'high' ? 'text-red-700' :
                                    analysis.difficulty === 'medium' ? 'text-yellow-700' :
                                        'text-green-700'
                                }>
                                    {analysis.advice}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep('template')}
                            className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition text-lg"
                        >
                            Şablon Seç →
                        </button>
                    </div>
                )}

                {step === 'template' && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">📚 Şablon Seçimi</h3>
                        <p className="text-gray-600 mb-8">
                            {analysis?.difficulty === 'high' ? '⚠️ Yoğun bir tempoda çalışmanız gerekecek. ' : ''}
                            Öğrenciniz için en uygun programı seçin:
                        </p>

                        <TemplateSelector
                            moduleType="exam"
                            onSuccess={() => {
                                alert('✅ Program başarıyla oluşturuldu ve öğrenciye atandı!')
                                router.push('/tutor')
                            }}
                            defaultStudentId={studentIdParam || undefined}
                        />

                        <button
                            onClick={() => setStep('analysis')}
                            className="mt-8 text-gray-400 hover:text-gray-600 font-bold transition flex items-center gap-2"
                        >
                            ← Analize Geri Dön
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
