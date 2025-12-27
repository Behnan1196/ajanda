'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getSimpleTemplate } from '@/lib/templates/simple'
import { getExamTemplate } from '@/lib/templates/exam'
import { getCodingTemplate } from '@/lib/templates/coding'

export async function createProgramFromSimpleTemplate(
    templateId: string,
    studentId: string,
    startDate: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    // Şablonu bul (simple, exam veya coding)
    const template = getSimpleTemplate(templateId) || getExamTemplate(templateId) || getCodingTemplate(templateId)
    if (!template) return { error: 'Şablon bulunamadı' }

    // Module type'ı belirle
    const moduleType = (template as any).exam_type ? 'exam' :
        templateId.startsWith('coding-') ? 'coding' : 'general'

    try {
        // 1. Proje oluştur
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
                user_id: user.id,
                name: template.name,
                description: template.description,
                status: 'active',
                settings: {
                    module_type: moduleType,
                    duration_days: template.duration_days,
                    start_date: startDate,
                    template_id: templateId,
                    student_id: studentId
                }
            })
            .select()
            .single()

        if (projectError || !project) {
            return { error: projectError?.message || 'Proje oluşturulamadı' }
        }

        // 2. Task type ID'sini al (todo)
        const { data: taskType } = await supabase
            .from('task_types')
            .select('id')
            .eq('slug', 'todo')
            .single()

        if (!taskType) {
            await supabase.from('projects').delete().eq('id', project.id)
            return { error: 'Task type bulunamadı' }
        }

        // 3. Hedef user'ı belirle (persona varsa onun user'ı, yoksa kendisi)
        let targetUserId = user.id  // Default: kendisi

        if (studentId) {
            const { data: persona } = await supabase
                .from('personas')
                .select('user_id')
                .eq('id', studentId)
                .single()

            if (persona) {
                targetUserId = persona.user_id
            }
            // Persona bulunamazsa da devam et, kendine ata
        }

        // 4. Task'ları oluştur
        const start = new Date(startDate)
        const tasksToInsert = template.tasks.map((task, index) => {
            const taskDate = new Date(start)
            taskDate.setDate(taskDate.getDate() + (task.day - 1))
            const taskDateStr = taskDate.toISOString().split('T')[0]

            const taskAny = task as any
            const descriptionParts = [taskAny.description || '']

            if (taskAny.subject) {
                descriptionParts.push(`\nKonu: ${taskAny.subject}`)
                if (taskAny.topic) descriptionParts.push(` - ${taskAny.topic}`)
                if (taskAny.target_questions) descriptionParts.push(`\nHedef: ${taskAny.target_questions} soru`)
            } else if (taskAny.category) {
                descriptionParts.push(`\nKategori: ${taskAny.category}`)
            }
            descriptionParts.push(`\nGün: ${task.day}`)

            return {
                project_id: project.id,
                user_id: targetUserId,
                task_type_id: taskType.id,
                title: task.title,
                description: descriptionParts.join(''),
                start_date: taskDateStr,
                due_date: taskDateStr,
                duration_minutes: task.duration,
                sort_order: index,
                is_completed: false,
                created_by: user.id,
                assigned_to: targetUserId,
                assigned_by: user.id
            }
        })

        const { error: tasksError } = await supabase
            .from('tasks')
            .insert(tasksToInsert)

        if (tasksError) {
            // Proje oluşturuldu ama task'lar eklenemedi, projeyi sil
            await supabase.from('projects').delete().eq('id', project.id)
            return { error: 'Görevler oluşturulamadı: ' + tasksError.message }
        }

        revalidatePath('/tutor')
        revalidatePath(`/projects/${project.id}`)

        return { data: project }
    } catch (e) {
        console.error('Program creation error:', e)
        return { error: String(e) }
    }
}
