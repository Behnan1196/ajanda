'use client'

import { useState } from 'react'
import { Task } from '@/app/actions/projects'
import { Plus, Trash2, Edit2, CheckCircle, Circle, MapPin, DollarSign } from 'lucide-react'

interface ShoppingListEditorProps {
    project: any
    tasks: Task[]
    onAddTask: (title: string, metadata?: any) => void
    onUpdateTask: (taskId: string, updates: any) => void
    onDeleteTask: (taskId: string) => void
    readOnly?: boolean
}

export default function ShoppingListEditor({ project, tasks, onAddTask, onUpdateTask, onDeleteTask, readOnly = false }: ShoppingListEditorProps) {
    const [newItemName, setNewItemName] = useState('')
    const [newItemPrice, setNewItemPrice] = useState('')
    const [newItemStore, setNewItemStore] = useState('')

    // Group tasks by "Store" (from metadata) or default 'Genel'
    const groupedTasks = tasks.reduce((acc, task) => {
        const store = (task.metadata as any)?.store || 'Genel'
        if (!acc[store]) acc[store] = []
        acc[store].push(task)
        return acc
    }, {} as Record<string, Task[]>)

    const handleAdd = () => {
        if (!newItemName.trim()) return

        onAddTask(newItemName, {
            store: newItemStore || 'Genel',
            price: newItemPrice ? parseFloat(newItemPrice) : null,
            quantity: 1
        })

        setNewItemName('')
        setNewItemPrice('')
        // Keep store selected for quick entry
    }

    const calculateTotal = () => {
        return tasks.reduce((sum, task) => {
            const price = (task.metadata as any)?.price || 0
            const qty = (task.metadata as any)?.quantity || 1
            return sum + (price * qty)
        }, 0)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-4">
            {/* Summary Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">🛒 {project.name}</h2>
                    <p className="text-gray-500 text-sm">{tasks.filter(t => !t.is_completed).length} ürün alınacak</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tahmini Tutar</p>
                    <p className="text-3xl font-bold text-indigo-600">₺{calculateTotal().toFixed(2)}</p>
                </div>
            </div>

            {/* Quick Add Bar */}
            {!readOnly && (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-indigo-50 flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="Ürün adı (örn. Süt)"
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    <div className="flex gap-2">
                        <div className="relative w-24">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₺</span>
                            <input
                                type="number"
                                placeholder="Fiyat"
                                className="w-full pl-6 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm"
                                value={newItemPrice}
                                onChange={e => setNewItemPrice(e.target.value)}
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Market/Konum"
                            className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm"
                            value={newItemStore}
                            onChange={e => setNewItemStore(e.target.value)}
                            list="stores-list"
                        />
                        <datalist id="stores-list">
                            <option value="Migros" />
                            <option value="Bim" />
                            <option value="Eczane" />
                            <option value="Pazar" />
                        </datalist>

                        <button
                            onClick={handleAdd}
                            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Lists by Store */}
            <div className="space-y-6">
                {Object.entries(groupedTasks).map(([store, storeTasks]) => (
                    <div key={store} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <MapPin size={14} className="text-gray-400" />
                                {store}
                            </h3>
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600 font-medium">
                                {storeTasks.length}
                            </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {storeTasks.map(task => (
                                <div key={task.id} className={`p-4 flex items-center gap-4 group transition ${task.is_completed ? 'bg-gray-50/50' : 'hover:bg-indigo-50/10'}`}>
                                    <button
                                        onClick={() => onUpdateTask(task.id, { is_completed: !task.is_completed })}
                                        className={`shrink-0 transition ${task.is_completed ? 'text-green-500' : 'text-gray-300 hover:text-indigo-500'}`}
                                    >
                                        {task.is_completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                                    </button>

                                    <div className="flex-1">
                                        <p className={`font-medium transition ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                            {task.title}
                                        </p>
                                        {(task.metadata as any)?.price > 0 && (
                                            <p className="text-xs text-indigo-600 font-bold flex items-center gap-1">
                                                <DollarSign size={10} />
                                                {(task.metadata as any).price} TL
                                            </p>
                                        )}
                                    </div>

                                    {!readOnly && (
                                        <button
                                            onClick={() => onDeleteTask(task.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {tasks.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <span className="text-4xl block mb-2 opacity-30">🛒</span>
                    Listeniz boş. Yukarıdan ürün ekleyin.
                </div>
            )}
        </div>
    )
}
