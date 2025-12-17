export default function ExamsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Sınav Yönetimi</h1>
            </div>
            {children}
        </div>
    )
}
