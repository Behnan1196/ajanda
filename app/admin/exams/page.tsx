import Link from 'next/link'
import { getExamTemplates, getExams } from '@/app/actions/exams'

export default async function AdminExamsPage() {
    const templates = await getExamTemplates()
    const exams = await getExams()

    return (
        <div className="space-y-8">
            {/* Exam Templates Section */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Sınav Şablonları</h2>
                        <p className="text-sm text-gray-500">TYT, AYT gibi sınav yapılarını tanımlayın</p>
                    </div>
                    <Link
                        href="/admin/exams/templates/create"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        + Yeni Şablon
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-medium">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Şablon Adı</th>
                                <th className="px-4 py-3">Bölüm Sayısı</th>
                                <th className="px-4 py-3 rounded-r-lg">Oluşturulma</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {templates.map((template: any) => (
                                <tr key={template.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{template.name}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {template.sections?.length || 0} Bölüm
                                        <span className="text-xs text-gray-400 ml-2">
                                            ({template.sections?.map((s: any) => s.name).join(', ')})
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(template.created_at).toLocaleDateString('tr-TR')}
                                    </td>
                                </tr>
                            ))}
                            {templates.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500 italic">
                                        Henüz şablon oluşturulmamış
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Scheduled Exams Section */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Tanımlı Deneme Sınavları</h2>
                        <p className="text-sm text-gray-500">Öğrencilerin gireceği spesifik sınavlar</p>
                    </div>
                    <Link
                        href="/admin/exams/create"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                    >
                        + Sınav Takvimle
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-medium">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Sınav Adı</th>
                                <th className="px-4 py-3">Tür</th>
                                <th className="px-4 py-3">Tarih</th>
                                <th className="px-4 py-3 rounded-r-lg">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {exams.map((exam: any) => (
                                <tr key={exam.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{exam.name}</td>
                                    <td className="px-4 py-3 text-gray-600 badge">
                                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">
                                            {exam.template?.name}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Date(exam.date).toLocaleDateString('tr-TR', {
                                            day: 'numeric', month: 'long', weekday: 'long'
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {/* Actions like Edit/Delete could go here */}
                                        <button className="text-gray-400 hover:text-red-600">Sil</button>
                                    </td>
                                </tr>
                            ))}
                            {exams.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                                        Henüz sınav tanımlanmamış
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}
