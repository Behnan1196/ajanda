'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TemplateSelector from '@/components/tutor/TemplateSelector'

interface CodingFormData {
    targetStack: string
    currentLevel: 'beginner' | 'intermediate' | 'advanced'
    dailyHours: string
    interestedTopics: string[]
}

interface Analysis {
    estimatedWeeks: number
    recommendedPath: string
    intensity: 'low' | 'medium' | 'high'
    advice: string
}

const STACKS = [
    { id: 'frontend', name: 'Frontend (React/Vue/Angular)', icon: '🎨' },
    { id: 'backend', name: 'Backend (Node/Python/Go)', icon: '⚙️' },
    { id: 'mobile', name: 'Mobile (Flutter/React Native)', icon: '📱' },
    { id: 'data', name: 'Data Science & AI', icon: '🧠' }
]

const TOPICS = ['JavaScript', 'TypeScript', 'Python', 'React', 'SQL', 'Docker', 'AWS', 'Algorithms']

export default function CodingCoachingPage() {
    const router = useRouter()
    const [step, setStep] = useState<'intake' | 'analysis' | 'template'>('intake')
    const [formData, setFormData] = useState<CodingFormData>({
        targetStack: 'frontend',
        currentLevel: 'beginner',
        dailyHours: '2',
        interestedTopics: []
    })
    const [analysis, setAnalysis] = useState<Analysis | null>(null)

    const toggleTopic = (topic: string) => {
        setFormData(prev => ({
            ...prev,
            interestedTopics: prev.interestedTopics.includes(topic)
                ? prev.interestedTopics.filter(t => t !== topic)
                : [...prev.interestedTopics, topic]
        }))
    }

    const handleAnalyze = (e: React.FormEvent) => {
        e.preventDefault()

        const hours = parseFloat(formData.dailyHours)
        let totalHoursNeeded = 400 // Average for a stack

        if (formData.currentLevel === 'intermediate') totalHoursNeeded = 200
        if (formData.currentLevel === 'advanced') totalHoursNeeded = 100

        const estimatedWeeks = Math.ceil(totalHoursNeeded / (hours * 6)) // 6 days a week

        let intensity: 'low' | 'medium' | 'high' = 'low'
        if (hours > 6) intensity = 'high'
        else if (hours > 3) intensity = 'medium'

        const stackName = STACKS.find(s => s.id === formData.targetStack)?.name

        setAnalysis({
            estimatedWeeks,
            recommendedPath: stackName || '',
            intensity,
            advice: `Günlük ${hours} saat çalışma ile yaklaşık ${estimatedWeeks} haftada ${stackName} yetkinliğine ulaşabilirsiniz. ${formData.interestedTopics.length > 0 ? `Özellikle ${formData.interestedTopics.join(', ')} konuları seçtiğiniz yol için kritiktir.` : ''
                }`
        })
        setStep('analysis')
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                    <button
                        onClick={() => router.push('/tutor')}
                        className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 font-bold"
                    >
                        ← Geri Dön
                    </button>
                    <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4">
                        <span className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg">💻</span>
                        Yazılım Koçluğu
                    </h1>
                    <p className="text-gray-600 mt-2 font-medium">Öğrencinin teknoloji yolculuğunu planlayın.</p>
                </header>

                {/* Progress Tracker */}
                <div className="flex items-center gap-4 mb-12">
                    {['intake', 'analysis', 'template'].map((s, i) => (
                        <div key={s} className="flex items-center gap-4 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${step === s ? 'bg-blue-600 text-white scale-110 shadow-lg' :
                                    (i < ['intake', 'analysis', 'template'].indexOf(step) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400')
                                }`}>
                                {i < ['intake', 'analysis', 'template'].indexOf(step) ? '✓' : i + 1}
                            </div>
                            <div className={`h-1 flex-1 rounded-full ${i < ['intake', 'analysis', 'template'].indexOf(step) ? 'bg-green-500' : 'bg-gray-200'
                                }`} />
                        </div>
                    ))}
                </div>

                {step === 'intake' && (
                    <form onSubmit={handleAnalyze} className="bg-white rounded-3xl p-8 space-y-8 border-2 border-gray-100 shadow-xl">
                        <h3 className="text-xl font-black text-gray-900">Teknik Profil</h3>

                        <div className="grid grid-cols-2 gap-8">
                            {/* Stack Selection */}
                            <div className="col-span-2">
                                <label className="block text-sm font-black text-gray-600 mb-4 uppercase tracking-wider">
                                    Hedef Teknoloji Yığını
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {STACKS.map(stack => (
                                        <button
                                            key={stack.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, targetStack: stack.id })}
                                            className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${formData.targetStack === stack.id
                                                    ? 'border-blue-600 bg-blue-50/50 shadow-md'
                                                    : 'border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            <span className="text-3xl">{stack.icon}</span>
                                            <span className={`font-bold ${formData.targetStack === stack.id ? 'text-blue-900' : 'text-gray-600'}`}>
                                                {stack.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Level */}
                            <div>
                                <label className="block text-sm font-black text-gray-600 mb-2 uppercase tracking-wider">
                                    Mevcut Seviye
                                </label>
                                <select
                                    value={formData.currentLevel}
                                    onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value as any })}
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold"
                                >
                                    <option value="beginner">Sıfırdan Başlıyor</option>
                                    <option value="intermediate">Temelleri Biliyor</option>
                                    <option value="advanced">İleri Seviye (Proje odaklı)</option>
                                </select>
                            </div>

                            {/* Study Hours */}
                            <div>
                                <label className="block text-sm font-black text-gray-600 mb-2 uppercase tracking-wider">
                                    Günlük Çalışma (Saat)
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="1"
                                    max="16"
                                    value={formData.dailyHours}
                                    onChange={(e) => setFormData({ ...formData, dailyHours: e.target.value })}
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold"
                                />
                            </div>
                        </div>

                        {/* Topics */}
                        <div>
                            <label className="block text-sm font-black text-gray-600 mb-4 uppercase tracking-wider">
                                İlgilenilen Alanlar
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {TOPICS.map(topic => (
                                    <button
                                        key={topic}
                                        type="button"
                                        onClick={() => toggleTopic(topic)}
                                        className={`px-4 py-2 rounded-xl font-bold transition-all ${formData.interestedTopics.includes(topic)
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full px-6 py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition shadow-lg text-lg uppercase tracking-widest"
                        >
                            Yol Haritasını Hazırla →
                        </button>
                    </form>
                )}

                {step === 'analysis' && analysis && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <span className="text-9xl">📊</span>
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-8">🚀 Gelişim Analizi</h3>

                            <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
                                <div className="text-center p-6 bg-blue-50 rounded-2xl border-2 border-blue-100">
                                    <div className="text-4xl font-black text-blue-600">{analysis.estimatedWeeks}</div>
                                    <div className="text-xs font-black text-blue-400 mt-2 uppercase">Tahmini Hafta</div>
                                </div>
                                <div className="text-center p-6 bg-purple-50 rounded-2xl border-2 border-purple-100">
                                    <div className="text-4xl font-black text-purple-600">{analysis.intensity === 'high' ? '🔥' : analysis.intensity === 'medium' ? '⚡' : '✅'}</div>
                                    <div className="text-xs font-black text-purple-400 mt-2 uppercase">Tempo</div>
                                </div>
                                <div className="text-center p-6 bg-green-50 rounded-2xl border-2 border-green-100">
                                    <div className="text-lg font-black text-green-600 leading-tight">{analysis.recommendedPath}</div>
                                    <div className="text-xs font-black text-green-400 mt-2 uppercase">Hedef Yol</div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-100">
                                <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="text-blue-600">💡</span> Mentor Notu
                                </h4>
                                <p className="text-gray-700 font-medium leading-relaxed">
                                    {analysis.advice}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep('template')}
                            className="w-full px-6 py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition shadow-lg text-lg uppercase tracking-widest"
                        >
                            Uygun Şablonları Gör →
                        </button>
                    </div>
                )}

                {step === 'template' && (
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
                        <h3 className="text-2xl font-black text-gray-900 mb-2">💻 Müfredat Seçimi</h3>
                        <p className="text-gray-500 mb-8 font-medium">
                            {analysis?.recommendedPath} için en uygun kodlama şablonlarından birini seçerek programı başlatın.
                        </p>

                        <TemplateSelector
                            moduleType="coding"
                            onSuccess={() => {
                                alert('✅ Kodlama programı başarıyla oluşturuldu ve öğrenciye atandı!')
                                router.push('/tutor')
                            }}
                        />

                        <button
                            onClick={() => setStep('analysis')}
                            className="mt-12 text-gray-400 hover:text-blue-600 font-black transition flex items-center gap-2 uppercase text-sm tracking-widest"
                        >
                            ← Analize Geri Dön
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
