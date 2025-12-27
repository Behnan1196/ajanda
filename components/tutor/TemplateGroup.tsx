interface TemplateGroupProps {
    icon: string
    title: string
    templates: any[]
    onTemplateClick: (template: any) => void
    onEdit?: (template: any) => void
    onDelete?: (template: any) => void
}

export default function TemplateGroup({ icon, title, templates, onTemplateClick, onEdit, onDelete }: TemplateGroupProps) {
    if (templates.length === 0) return null

    return (
        <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                <span className="text-2xl">{icon}</span>
                {title}
                <span className="text-sm font-normal text-gray-400">({templates.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                    <div
                        key={template.id}
                        className="relative group bg-white border border-gray-200 rounded-3xl hover:border-purple-300 hover:shadow-xl transition-all duration-300"
                    >
                        <button
                            onClick={() => onTemplateClick(template)}
                            className="w-full text-left p-6"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h4 className="font-bold text-gray-900 group-hover:text-purple-600 transition truncate pr-8">
                                    {template.name}
                                </h4>
                                {template.source === 'database' && (
                                    <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shrink-0">
                                        Kişisel
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2rem]">
                                {template.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                <span>📅 {template.duration_days} Gün</span>
                                {template.tasks && template.tasks.length > 0 && (
                                    <span>📋 {template.tasks.length} Görev</span>
                                )}
                            </div>
                        </button>

                        {/* Action Buttons for Database Templates */}
                        {template.source === 'database' && (
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition duration-300">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onEdit?.(template)
                                    }}
                                    className="p-1.5 bg-white shadow-lg border border-gray-100 rounded-lg text-gray-400 hover:text-purple-600 hover:scale-110 transition"
                                    title="Düzenle"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete?.(template)
                                    }}
                                    className="p-1.5 bg-white shadow-lg border border-gray-100 rounded-lg text-gray-400 hover:text-red-600 hover:scale-110 transition"
                                    title="Sil"
                                >
                                    🗑️
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
