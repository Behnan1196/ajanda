'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, updateUser, getCoaches, assignCoach, removeCoach } from '@/app/actions/admin-users'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Standard options for specialties and roles
const SPECIALTY_OPTIONS = [
    { value: 'Akademik', label: 'Akademik / Branş' },
    { value: 'Spor', label: 'Spor / Fitness' },
    { value: 'Diyet', label: 'Beslenme / Diyet' },
    { value: 'Rehberlik', label: 'Rehberlik / Mentörlük' },
    { value: 'Yaşam', label: 'Yaşam Koçluğu' }
]

const ROLE_OPTIONS = [
    { value: 'Genel Koç', label: 'Genel Tutor' },
    { value: 'Akademik Koç', label: 'Akademik Tutor' },
    { value: 'Spor Koçu', label: 'Spor Tutoru' },
    { value: 'Diyetisyen', label: 'Diyetisyen' },
    { value: 'Mentör', label: 'Mentör' },
    { value: 'Yaşam Koçu', label: 'Yaşam Tutoru' }
]

export default function EditUserPage() {
    const params = useParams()
    const userId = params.id as string
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [coaches, setCoaches] = useState<any[]>([])
    const [assignedCoaches, setAssignedCoaches] = useState<any[]>([])

    // Coach Assignment State
    const [newCoachId, setNewCoachId] = useState('')
    const [newCoachRole, setNewCoachRole] = useState('')
    const [coachFilter, setCoachFilter] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        roles: [] as string[],
        specialties: [] as string[],
        password: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const [userData, coachesData] = await Promise.all([
            getUser(userId),
            getCoaches()
        ])

        if (userData) {
            setUser(userData)
            setAssignedCoaches(userData.coaches || [])
            setFormData({
                name: userData.name,
                roles: userData.roles || [],
                specialties: userData.specialties || [],
                password: ''
            })
        }

        if (coachesData) {
            setCoaches(coachesData)
        }

        setLoading(false)
    }

    // Handlers
    const handleCoachFilterChange = (filter: string) => {
        setCoachFilter(filter)
        setNewCoachId('') // Reset selection

        // Auto-suggest role based on filter
        if (filter === 'Spor') setNewCoachRole('Spor Koçu')
        else if (filter === 'Diyet') setNewCoachRole('Diyetisyen')
        else if (filter === 'Akademik') setNewCoachRole('Akademik Koç')
        else if (filter === 'Rehberlik') setNewCoachRole('Mentör')
        else if (filter === 'Yaşam') setNewCoachRole('Yaşam Koçu')
        else setNewCoachRole('')
    }

    const handleAddCoach = async () => {
        if (!newCoachId) return

        const label = newCoachRole.trim() || 'Genel Koç'

        // Optimistic update
        const selectedCoach = coaches.find(c => c.id === newCoachId)
        if (!selectedCoach) return

        // CHECK: Don't allow exact duplicate (Same coach + Same role)
        const isDuplicate = assignedCoaches.some(ac =>
            ac.id === newCoachId && ac.role === label
        )

        if (isDuplicate) {
            alert(`Bu koç zaten "${label}" rolüyle atanmış.`)
            return
        }

        setSaving(true)
        const result = await assignCoach(userId, newCoachId, label)
        setSaving(false)

        if (result.error) {
            alert('Atama Hatası: ' + result.error)
        } else {
            setNewCoachId('')
            setNewCoachRole('')
            loadData()
        }
    }

    const handleRemoveCoach = async (coachId: string) => {
        if (!confirm('Bu koçun atamasını kaldırmak istediğinize emin misiniz?')) return

        setSaving(true)
        const result = await removeCoach(userId, coachId)
        setSaving(false)

        if (result.error) {
            alert('Silme Hatası: ' + result.error)
        } else {
            loadData()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const result = await updateUser(userId, {
                name: formData.name,
                roles: formData.roles,
                specialties: formData.specialties,
                password: formData.password
            })

            if (result.error) {
                alert('Hata (Profil): ' + result.error)
                setSaving(false)
                return
            }

            alert('Kullanıcı güncellendi!')
            router.push('/admin/users')
        } catch (error) {
            console.error(error)
            alert('Bir hata oluştu')
        } finally {
            setSaving(false)
        }
    }

    // Filtering logic
    const filteredCoaches = coaches.filter(c => {
        // ALLOW multiple assignments: Do not filter out if already assigned.
        // We only filter by specialty if selected.
        if (coachFilter && (!c.specialties || !c.specialties.includes(coachFilter))) return false
        return true
    })

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
    if (!user) return <div className="p-8 text-center text-red-500">Kullanıcı bulunamadı</div>

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/users" className="text-gray-500 hover:text-gray-700">
                    ← Geri
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Kullanıcıyı Düzenle</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email (Değiştirilemez)
                            </label>
                            <input
                                type="text"
                                disabled
                                value={user.email}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ad Soyad
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Yeni Şifre (Opsiyonel)
                        </label>
                        <input
                            type="password"
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Değiştirmek için doldurun"
                        />
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Kullanıcı Rolleri
                        </label>
                        <div className="flex flex-wrap gap-4">
                            {['student', 'coach', 'admin'].map(role => (
                                <div key={role} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                    <input
                                        type="checkbox"
                                        id={`role_${role}`}
                                        checked={formData.roles.includes(role)}
                                        onChange={(e) => {
                                            const newRoles = e.target.checked
                                                ? [...formData.roles, role]
                                                : formData.roles.filter(r => r !== role)
                                            setFormData({ ...formData, roles: newRoles })
                                        }}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`role_${role}`} className="text-sm text-gray-700 select-none cursor-pointer capitalize font-medium">
                                        {role === 'student' ? 'Persona' : role === 'coach' ? 'Tutor' : 'Yönetici'}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Coach Specialties Section - Only for Coaches */}
                    {formData.roles.includes('coach') && (
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                            <label className="block text-sm font-semibold text-indigo-900 mb-2">
                                🎓 Tutorluk Uzmanlık Alanları
                            </label>
                            <p className="text-xs text-indigo-700 mb-3">Bu kullanıcının hangi alanlarda koçluk yapabileceğini seçin.</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {SPECIALTY_OPTIONS.map(opt => (
                                    <div key={opt.value} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-indigo-100">
                                        <input
                                            type="checkbox"
                                            id={`spec_${opt.value}`}
                                            checked={formData.specialties.includes(opt.value)}
                                            onChange={(e) => {
                                                const newSpecs = e.target.checked
                                                    ? [...formData.specialties, opt.value]
                                                    : formData.specialties.filter(s => s !== opt.value)
                                                setFormData({ ...formData, specialties: newSpecs })
                                            }}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor={`spec_${opt.value}`} className="text-sm text-gray-700 select-none cursor-pointer">
                                            {opt.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                        <Link
                            href="/admin/users"
                            className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                        >
                            İptal
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
                        >
                            {saving ? 'Kaydediliyor...' : 'Profil Bilgilerini Güncelle'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Coach Assignment Section - Only for Students */}
            {formData.roles.includes('student') && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </span>
                        Personanın Tutor Kadrosu
                    </h3>

                    {/* Assigned Coaches List */}
                    <div className="space-y-3 mb-6">
                        {assignedCoaches.length === 0 ? (
                            <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
                                Henüz atanmış bir tutor yok.
                            </p>
                        ) : (
                            assignedCoaches.map((assignment: any) => (
                                <div key={assignment.relationship_id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-200 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                            {assignment.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{assignment.name}</div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-gray-500">{assignment.email}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                                                    {assignment.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveCoach(assignment.relationship_id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                                        title="Atamayı Kaldır"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add New Coach Form */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">Yeni Tutor Ata</h4>

                            {/* Filter Dropdown */}
                            <select
                                value={coachFilter}
                                onChange={(e) => handleCoachFilterChange(e.target.value)}
                                className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">Tüm Branşlar</option>
                                {SPECIALTY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div className="md:col-span-2">
                                <select
                                    value={newCoachId}
                                    onChange={(e) => setNewCoachId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option value="">
                                        {coachFilter ? `${coachFilter} Alanındaki Koçlar...` : 'Tüm Koçlar Listesi...'}
                                    </option>
                                    {filteredCoaches.map(coach => {
                                        // Find existing assignments for this coach
                                        const existingRoles = assignedCoaches
                                            .filter(ac => ac.id === coach.id)
                                            .map(ac => ac.role)

                                        const roleText = existingRoles.length > 0
                                            ? ` [Mevcut: ${existingRoles.join(', ')}]`
                                            : ''

                                        return (
                                            <option key={coach.id} value={coach.id}>
                                                {coach.name}
                                                {coach.specialties && coach.specialties.length > 0
                                                    ? ` (${coach.specialties.join(', ')})`
                                                    : ''}
                                                {roleText}
                                            </option>
                                        )
                                    })}
                                    {filteredCoaches.length === 0 && (
                                        <option value="" disabled>Bu kriterde koç bulunamadı</option>
                                    )}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <select
                                    value={newCoachRole}
                                    onChange={(e) => setNewCoachRole(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option value="">Rol Seçin...</option>
                                    {ROLE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <button
                                    type="button"
                                    onClick={handleAddCoach}
                                    disabled={!newCoachId || saving}
                                    className="w-full h-full px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black disabled:opacity-50 transition flex items-center justify-center gap-2"
                                >
                                    {saving ? '...' : <span>+ Ata</span>}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            * Filtre kullanarak sadece ilgili branştaki tutorları listeleyebilirsiniz.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
