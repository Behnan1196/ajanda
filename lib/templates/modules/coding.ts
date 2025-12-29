/**
 * Coding Module Templates (Unified Format)
 */

import { UnifiedProgramTemplate, registerTemplate } from '../unified'

const frontendBasics: UnifiedProgramTemplate = {
    id: 'coding-frontend-basics',
    name: 'Frontend Temelleri - 14 Gün',
    description: 'HTML, CSS, JavaScript temel eğitimi',
    module: 'coding',
    duration_days: 14,
    metadata: {
        difficulty: 'beginner',
        tags: ['Frontend', 'Web', 'JavaScript']
    },
    tasks: [
        { day: 1, title: 'HTML Temelleri', description: 'Temel HTML etiketleri, sayfa yapısı', duration_minutes: 60, task_type: 'todo', settings: { language: 'HTML', topic: 'Temeller', practice_type: 'theory' } },
        { day: 2, title: 'HTML Pratik', description: 'Basit bir sayfa oluştur', duration_minutes: 90, task_type: 'todo', settings: { language: 'HTML', topic: 'Pratik', practice_type: 'project' } },
        { day: 3, title: 'CSS Temelleri', description: 'Selectors, colors, fonts', duration_minutes: 60, task_type: 'todo', settings: { language: 'CSS', topic: 'Temeller' } },
        { day: 4, title: 'CSS Layout', description: 'Flexbox, Grid basics', duration_minutes: 90, task_type: 'todo', settings: { language: 'CSS', topic: 'Layout' } },
        { day: 5, title: 'JavaScript Temelleri', description: 'Variables, data types, functions', duration_minutes: 60, task_type: 'todo', settings: { language: 'JavaScript', topic: 'Temeller' } },
        { day: 6, title: 'JavaScript DOM', description: 'DOM manipulation, events', duration_minutes: 90, task_type: 'todo', settings: { language: 'JavaScript', topic: 'DOM' } },
        { day: 7, title: 'Haftalık Proje', description: 'To-Do list uygulaması', duration_minutes: 120, task_type: 'todo', settings: { language: 'JavaScript', practice_type: 'project', project_name: 'Todo App' } },

        // Week 2
        { day: 8, title: 'JavaScript Arrays', description: 'Array methods, iteration', duration_minutes: 60, task_type: 'todo', settings: { language: 'JavaScript', topic: 'Arrays' } },
        { day: 9, title: 'JavaScript Objects', description: 'Object manipulation, this keyword', duration_minutes: 60, task_type: 'todo', settings: { language: 'JavaScript', topic: 'Objects' } },
        { day: 10, title: 'Async JavaScript', description: 'Callbacks, Promises, async/await', duration_minutes: 90, task_type: 'todo', settings: { language: 'JavaScript', topic: 'Async' } },
        { day: 11, title: 'Fetch API', description: 'API calls, JSON handling', duration_minutes: 90, task_type: 'todo', settings: { language: 'JavaScript', topic: 'API' } },
        { day: 12, title: 'Local Storage', description: 'Data persistence', duration_minutes: 60, task_type: 'todo', settings: { language: 'JavaScript', topic: 'Storage' } },
        { day: 13, title: 'Final Project Başlangıç', description: 'Weather app başlat', duration_minutes: 120, task_type: 'todo', settings: { language: 'JavaScript', practice_type: 'project', project_name: 'Weather App' } },
        { day: 14, title: 'Final Project Tamamla', description: 'Weather app bitir, deploy et', duration_minutes: 120, task_type: 'todo', settings: { language: 'JavaScript', practice_type: 'project', project_name: 'Weather App' } }
    ]
}

registerTemplate(frontendBasics)

export { frontendBasics }
