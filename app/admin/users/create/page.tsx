'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUser } from '@/app/actions/admin-users'
import Link from 'next/link'

export default function CreateUserPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student'
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await createUser(formData)

            if (result.success) {
                alert('Kullanıcı başarıyla oluşturuldu!')
                router.push('/admin/users')
            } else {
                alert('Hata: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/users" className="text-gray-500 hover:text-gray-700">
                    ← Geri
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Yeni Kullanıcı Oluştur</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
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
                            placeholder="Örn: Ahmet Yılmaz"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Adresi
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="ornek@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Şifre
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="En az 6 karakter"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rol
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="student">Persona</option>
                            <option value="coach">Tutor</option>
                            <option value="admin">Yönetici (Admin)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            * Yönetici: Tam yetki. Tutor: Persona yönetimi. Persona: Sadece kendi alanı.
                        </p>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <Link
                            href="/admin/users"
                            className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                        >
                            İptal
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
                        >
                            {loading ? 'Oluşturuluyor...' : 'Kullanıcıyı Oluştur'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
