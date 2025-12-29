/**
 * Template Actions (Unified)
 * 
 * Program creation from unified templates
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getTemplate } from '@/lib/templates'

/**
 * Create a program from unified template
 */
export async function createProgramFromTemplate(
    templateId: string,
    studentId: string,
    startDate: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    // Get template - Try code first, then DB
    let template = getTemplate(templateId) as any

    if (!template) {
        const { data: dbTemplate } = await supabase
            .from('projects')
            .select('*, tasks(*)')
            .eq('id', templateId)
            .or('is_template.eq.true,is_official.eq.true')
            .single()

        if (dbTemplate) {
            template = {
                id: dbTemplate.id,
                name: dbTemplate.name,
                description: dbTemplate.description,
                module: dbTemplate.module || dbTemplate.settings?.module || dbTemplate.settings?.module_type,
                duration_days: dbTemplate.settings?.duration_days || 7,
                metadata: dbTemplate.settings?.metadata || {},
                tasks: (dbTemplate.tasks || []).map((t: any) => ({
                    day: Math.ceil((new Date(t.due_date).getTime() - new Date(dbTemplate.start_date || dbTemplate.created_at).getTime()) / (86400000)) + 1 || 1,
                    title: t.title,
                    description: t.description,
                    task_type: t.task_type_slug || 'todo', // assuming we have slug flat or nested
                    settings: t.settings
                }))
            }
        }
    }

    if (!template) return { error: 'Şablon bulunamadı' }

    // 2. Determine target user (already a UUID from getAssignedPersonas)
    const targetUserId = studentId || user.id

    try {
        // Use admin client if assigning to someone else
        const client = targetUserId === user.id ? supabase : createAdminClient()

        const isCoachProject = true // Always true for programs created from templates

        const { data: project, error: projectError } = await client
            .from('projects')
            .insert({
                user_id: targetUserId,
                name: template.name,
                description: template.description,
                status: 'active',
                type: 'program',
                module: template.module,
                is_coach_project: isCoachProject,
                settings: {
                    duration_days: template.duration_days,
                    start_date: startDate,
                    template_id: templateId,
                    student_id: studentId,
                    is_coach_project: isCoachProject,
                    created_by: user.id,
                    metadata: template.metadata
                }
            })
            .select()
            .single()

        if (projectError || !project) {
            return { error: projectError?.message || 'Proje oluşturulamadı' }
        }

        // 2. Create tasks from template
        const startDateObj = new Date(startDate)
        const taskCreationPromises = template.tasks.map(async (taskTemplate: any) => {
            // Calculate task date
            const taskDate = new Date(startDateObj)
            taskDate.setDate(taskDate.getDate() + (taskTemplate.day - 1))
            const taskDateStr = taskDate.toISOString().split('T')[0]

            // Get task type ID
            const { data: taskType } = await supabase
                .from('task_types')
                .select('id')
                .eq('slug', taskTemplate.task_type)
                .single()

            if (!taskType) {
                console.error(`Task type not found: ${taskTemplate.task_type}`)
                return null
            }

            // Create task
            return client
                .from('tasks')
                .insert({
                    project_id: project.id,
                    user_id: targetUserId,
                    task_type_id: taskType.id,
                    title: taskTemplate.title,
                    description: taskTemplate.description,
                    start_date: taskDateStr,
                    due_date: taskDateStr,
                    duration_minutes: taskTemplate.duration_minutes || 0,
                    settings: taskTemplate.settings || {},
                    created_by: user.id,
                    assigned_to: targetUserId,
                    assigned_by: user.id,
                    sort_order: taskTemplate.day
                })
        })

        const results = await Promise.all(taskCreationPromises)

        // Check for errors
        const errors = results.filter(r => r?.error)
        if (errors.length > 0) {
            console.error('Task creation errors:', errors)
            // Cleanup: delete project
            await client.from('projects').delete().eq('id', project.id)
            return { error: 'Görevler oluşturulurken hata oluştu' }
        }

        revalidatePath('/tutor')
        revalidatePath(`/projects/${project.id}`)

        return { data: project }
    } catch (e) {
        console.error('Program creation error:', e)
        return { error: String(e) }
    }
}

// Legacy function name for backwards compatibility
export async function createProgramFromSimpleTemplate(
    templateId: string,
    studentId: string,
    startDate: string
) {
    return createProgramFromTemplate(templateId, studentId, startDate)
}

/**
 * Get templates by module
 */
export async function getTemplatesByModule(module: string) {
    const { getTemplatesByModule: getTemplates } = await import('@/lib/templates')
    return getTemplates(module)
}

/**
 * Get all templates
 */
export async function getAllTemplates() {
    const { getAllTemplates: getAll } = await import('@/lib/templates')
    return getAll()
}
