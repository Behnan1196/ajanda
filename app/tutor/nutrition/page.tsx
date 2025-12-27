'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TemplateSelector from '@/components/tutor/TemplateSelector'

interface NutritionIntakeData {
    weight: string
    targetWeight: string
    height: string
    age: string
    gender: 'male' | 'female'
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active'
}

interface Analysis {
    bmr: number
    tdee: number
    targetCalories: number
    weightDiff: number
    goal: 'lose' | 'gain' | 'maintain'
    macros: {
        protein: number
        carbs: number
        fats: number
    }
}

export default function NutritionCoachingPage() {
    const router = useRouter()
    const [step, setStep] = useState<'intake' | 'analysis' | 'template'>('intake')
    const [formData, setFormData] = useState<NutritionIntakeData>({
        weight: '',
        targetWeight: '',
        height: '',
        age: '',
        gender: 'male',
        activityLevel: 'moderate'
    })
    const [analysis, setAnalysis] = useState<Analysis | null>(null)

    const handleAnalyze = (e: React.FormEvent) => {
        e.preventDefault()
        const weight = parseFloat(formData.weight)
        const height = parseFloat(formData.height)
        const age = parseFloat(formData.age)
        const targetWeight = parseFloat(formData.targetWeight)

        // BMR Calculation (Mifflin-St Jeor)
        let bmr = (10 * weight) + (6.25 * height) - (5 * age)
        bmr = formData.gender === 'male' ? bmr + 5 : bmr - 161

        // TDEE Multiplication
        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725
        }
        const tdee = Math.round(bmr * activityMultipliers[formData.activityLevel])

        // Target Calories
        const weightDiff = targetWeight - weight
        const goal = weightDiff > 0 ? 'gain' : weightDiff < 0 ? 'lose' : 'maintain'
        const targetCalories = goal === 'lose' ? tdee - 500 : goal === 'gain' ? tdee + 300 : tdee

        // Macros
        const proteinFactor = goal === 'maintain' ? 1.6 : 2
        const protein = Math.round(weight * proteinFactor)
        const fats = Math.round(weight * 0.8)
        const carbCalories = targetCalories - (protein * 4) - (fats * 9)
        const carbs = Math.round(carbCalories / 4)

        setAnalysis({
            bmr: Math.round(bmr),
            tdee,
            targetCalories,
            weightDiff: Math.abs(weightDiff),
            goal,
            macros: { protein, carbs, fats }
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
                        <span className="text-4xl">🍏</span>
                        Beslenme Koçluğu
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Kişiye özel beslenme programı oluşturun
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 ${step === 'intake' ? 'text-purple-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'intake' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                            1
                        </div>
                        <span className="font-bold">Bilgiler</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-200"></div>
                    <div className={`flex items-center gap-2 ${step === 'analysis' ? 'text-purple-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'analysis' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                            2
                        </div>
                        <span className="font-bold">Analiz</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-200"></div>
                    <div className={`flex items-center gap-2 ${step === 'template' ? 'text-purple-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'template' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                            3
                        </div>
                        <span className="font-bold">Şablon</span>
                    </div>
                </div>

                {/* Content */}
                {step === 'intake' && (
                    <form onSubmit={handleAnalyze} className="bg-white rounded-2xl p-8 space-y-6 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900">Kişisel Bilgiler</h3>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Weight */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Mevcut Kilo (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                    required
                                />
                            </div>

                            {/* Target Weight */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Hedef Kilo (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.targetWeight}
                                    onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                    required
                                />
                            </div>

                            {/* Height */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Boy (cm)
                                </label>
                                <input
                                    type="number"
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                    required
                                />
                            </div>

                            {/* Age */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Yaş
                                </label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                    required
                                />
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Cinsiyet
                                </label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                >
                                    <option value="male">Erkek</option>
                                    <option value="female">Kadın</option>
                                </select>
                            </div>

                            {/* Activity Level */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                    Aktivite Seviyesi
                                </label>
                                <select
                                    value={formData.activityLevel}
                                    onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as any })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                                >
                                    <option value="sedentary">Hareketsiz (Ofis işi)</option>
                                    <option value="light">Hafif Aktif (Haftada 1-3 gün)</option>
                                    <option value="moderate">Orta Aktif (Haftada 3-5 gün)</option>
                                    <option value="active">Çok Aktif (Haftada 6-7 gün)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full px-6 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition text-lg"
                        >
                            Analiz Et →
                        </button>
                    </form>
                )}

                {step === 'analysis' && analysis && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-8 border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">📊 Kişisel Analiz</h3>

                            <div className="grid grid-cols-3 gap-6 mb-6">
                                <div className="text-center p-4 bg-purple-50 rounded-xl">
                                    <div className="text-3xl font-bold text-purple-600">{analysis.bmr}</div>
                                    <div className="text-xs text-gray-600 mt-1">Bazal Metabolizma</div>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-xl">
                                    <div className="text-3xl font-bold text-blue-600">{analysis.tdee}</div>
                                    <div className="text-xs text-gray-600 mt-1">Günlük Kalori İhtiyacı</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-xl">
                                    <div className="text-3xl font-bold text-green-600">{analysis.targetCalories}</div>
                                    <div className="text-xs text-gray-600 mt-1">Hedef Kalori</div>
                                </div>
                            </div>

                            {/* Macros Section */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-4 border-2 border-orange-100 rounded-xl bg-orange-50/30">
                                    <div className="text-xl font-bold text-orange-600">{analysis.macros.protein}g</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase">Protein</div>
                                </div>
                                <div className="p-4 border-2 border-blue-100 rounded-xl bg-blue-50/30">
                                    <div className="text-xl font-bold text-blue-600">{analysis.macros.carbs}g</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase">Karbonhidrat</div>
                                </div>
                                <div className="p-4 border-2 border-yellow-100 rounded-xl bg-yellow-50/30">
                                    <div className="text-xl font-bold text-yellow-600">{analysis.macros.fats}g</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase">Yağ</div>
                                </div>
                            </div>

                            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                                <h4 className="font-bold text-purple-900 mb-2">💡 Öneri</h4>
                                <p className="text-purple-700">
                                    Günlük <strong>{analysis.targetCalories} kalori</strong> hedefi ile{' '}
                                    <strong>{analysis.weightDiff} kg {analysis.goal === 'lose' ? 'vermek' : 'almak'}</strong> için uygun programlar öneriyoruz.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep('template')}
                            className="w-full px-6 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition text-lg"
                        >
                            Şablon Seç →
                        </button>
                    </div>
                )}

                {step === 'template' && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">🍽️ Şablon Seçimi</h3>
                        <p className="text-gray-600 mb-8">
                            Günlük <strong>{analysis.targetCalories} kalori</strong> hedefine ulaşmak için bir şablon seçin:
                        </p>

                        <TemplateSelector
                            moduleType="nutrition"
                            onSuccess={() => {
                                alert('✅ Beslenme programı başarıyla oluşturuldu!')
                                router.push('/tutor')
                            }}
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
