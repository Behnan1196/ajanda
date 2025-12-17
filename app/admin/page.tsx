import AdminLayout from '@/components/admin/AdminLayout'

export default function AdminDashboard() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                        </div>
                        <div className="text-3xl">👥</div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Ana Konular</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                        </div>
                        <div className="text-3xl">📚</div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Alt Konular</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                        </div>
                        <div className="text-3xl">📖</div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Kaynaklar</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                        </div>
                        <div className="text-3xl">🔗</div>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Hoş Geldiniz!</h2>
                <p className="text-gray-600">
                    Admin paneline hoş geldiniz. Sol menüden yönetmek istediğiniz bölümü seçebilirsiniz.
                </p>

                <div className="mt-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">1️⃣</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Ana Konular</h3>
                            <p className="text-sm text-gray-600">Matematik, Tai Chi gibi ana konuları yönetin</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="text-2xl">2️⃣</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Alt Konular</h3>
                            <p className="text-sm text-gray-600">Her ana konunun altındaki detay konuları ekleyin</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="text-2xl">3️⃣</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Kaynaklar</h3>
                            <p className="text-sm text-gray-600">Video, döküman ve diğer kaynakları ekleyin</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="text-2xl">4️⃣</span>
                        <div>
                            <h3 className="font-medium text-gray-900">Kullanıcılar</h3>
                            <p className="text-sm text-gray-600">Kullanıcı ve koç yönetimi yapın</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
