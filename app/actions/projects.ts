'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface Project {
    id: string
    user_id: string
    name: string
    description: string | null
    status: string
    start_date: string | null
    end_date: string | null
    settings: any
    created_at: string
}

export async function getProjects(userId?: string, filter: 'all' | 'personal' | 'coach' = 'all') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    const targetUserId = userId || user.id

    let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', targetUserId)

    if (filter === 'personal') {
        // Öğrencinin kendi oluşturduğu projeler (is_coach_project false veya null)
        // Ayrıca is_official olanları asla kişisel projelerde gösterme
        query = query.eq('is_official', false)
            .or('is_coach_project.is.null,is_coach_project.eq.false')
    } else if (filter === 'coach') {
        // Koç tarafından atanan veya program türündeki projeler
        query = query.eq('is_coach_project', true)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        return { error: error.message }
    }

    return { data: data as Project[] }
}

export async function createProject(name: string, description?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    const { data, error } = await supabase
        .from('projects')
        .insert({
            user_id: user.id,
            name,
            description,
            status: 'active'
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/projects')
    return { data: data as Project }
}

export async function updateProject(projectId: string, updates: Partial<Project>) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)
    return { data: data as Project }
}

export async function deleteProject(projectId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

    if (error) return { error: error.message }

    revalidatePath('/projects')
    return { success: true }
}

export async function getProjectTasks(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tasks')
        .select(`
            *,
            task_types (
                name,
                slug,
                icon
            ),
            assigned_to_user:users!tasks_assigned_to_fkey (
                name,
                avatar_url
            ),
            dependency_ids
        `)
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) return { error: error.message }
    return { data }
}

export async function createProjectTask(projectId: string, title: string, description?: string, parentId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    // Get 'todo' task type ID
    const { data: taskType } = await supabase
        .from('task_types')
        .select('id')
        .eq('slug', 'todo')
        .single()

    if (!taskType) return { error: 'Görev tipi bulunamadı' }

    // Get next sort order
    const { data: maxOrderTask } = await supabase
        .from('tasks')
        .select('sort_order')
        .eq('project_id', projectId)
        // If parentId exists, we might want to scope sort order to siblings?
        // For now, global sort order per project is easiest for flat list, 
        // but if we have nested structure, global sort might be tricky.
        // Let's assume global sort order for simplicity in initial DnD.
        // Or better: scope by parent_id if provided.
        // .eq('parent_id', parentId || null) -> this query is tricky with null.
        // Let's use global max for now, simpler.
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

    const nextOrder = (maxOrderTask?.sort_order || 0) + 1

    const { data, error } = await supabase
        .from('tasks')
        .insert({
            project_id: projectId,
            parent_id: parentId,
            user_id: user.id,
            title,
            description,
            task_type_id: taskType.id,
            is_completed: false,
            created_by: user.id,
            assigned_by: user.id,
            due_date: new Date().toISOString(), // Default to today
            sort_order: nextOrder
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath(`/projects/${projectId}`)
    return { data }
}

export async function updateProjectTask(projectId: string, taskId: string, updates: any) {
    const supabase = await createClient()

    // Dependency Validation: If updating dates, check predecessors
    if (updates.start_date || updates.end_date) {
        const { data: currentTask } = await supabase
            .from('tasks')
            .select('dependency_ids, start_date, end_date')
            .eq('id', taskId)
            .single()

        const depIds = updates.dependency_ids || currentTask?.dependency_ids
        if (depIds && depIds.length > 0) {
            const { data: predecessors } = await supabase
                .from('tasks')
                .select('title, end_date')
                .in('id', depIds)

            const newStart = updates.start_date ? new Date(updates.start_date) : (currentTask?.start_date ? new Date(currentTask.start_date) : null)

            if (newStart && predecessors) {
                for (const pred of predecessors) {
                    if (pred.end_date && new Date(pred.end_date) > newStart) {
                        return { error: `Bağımlılık Hatası: "${pred.title}" bitmeden bu görev başlayamaz.` }
                    }
                }
            }
        }
    }

    console.log('Updating task:', taskId, updates)

    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

    if (error) {
        console.error('Update Task Error:', error)
        return { error: error.message }
    }

    console.log('Update Task Success:', data)

    revalidatePath(`/projects/${projectId}`)

    // Automatic Rollup: If this task has a parent, update parent's progress
    if (data.parent_id) {
        await recalculateParentProgress(projectId, data.parent_id)
    }

    return { data }
}

async function recalculateParentProgress(projectId: string, parentId: string) {
    const supabase = await createClient()

    // Get all subtasks of this parent
    const { data: subtasks } = await supabase
        .from('tasks')
        .select('progress_percent, is_completed')
        .eq('parent_id', parentId)

    if (!subtasks || subtasks.length === 0) return

    // Calculate average progress
    const totalProgress = subtasks.reduce((sum, task) => sum + (task.progress_percent || 0), 0)
    const averageProgress = Math.round(totalProgress / subtasks.length)
    const allCompleted = subtasks.every(t => t.is_completed)

    // Update parent
    await supabase
        .from('tasks')
        .update({
            progress_percent: averageProgress,
            is_completed: allCompleted,
            completed_at: allCompleted ? new Date().toISOString() : null
        })
        .eq('id', parentId)

    // Recursively update upwards if parent also has a parent
    const { data: parentTask } = await supabase
        .from('tasks')
        .select('parent_id')
        .eq('id', parentId)
        .single()

    if (parentTask?.parent_id) {
        await recalculateParentProgress(projectId, parentTask.parent_id)
    }
}

export async function deleteProjectTask(projectId: string, taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    // Optional: Check if user owns the project or task
    // For now assuming owner of project or creator of task can delete

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

    if (error) return { error: error.message }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function reorderProjectTasks(projectId: string, activeId: string, overId: string) {
    const supabase = await createClient()

    // 1. Get both tasks to verify they are in the same project
    const { data: tasks } = await supabase
        .from('tasks')
        .select('id, parent_id, sort_order')
        .in('id', [activeId, overId])
        .eq('project_id', projectId)

    if (!tasks || tasks.length !== 2) return { error: 'Görevler bulunamadı' }

    const activeTask = tasks.find(t => t.id === activeId)
    const overTask = tasks.find(t => t.id === overId)

    if (!activeTask || !overTask) return { error: 'Görev hatası' }

    // If different parents, we are moving (re-parenting) OR just visual reorder? 
    // For simple sibling reorder, we assume same parent or flexible sort_order.
    // Let's swap their sort_orders? No, arrayMove logic needs updating multiple items.
    // However, if we only swap 2 items, it's easy. But usually we drag X between Y and Z.
    // For MVP: We will simply fail if different parents for now, or rely on frontend to only allow sibling reorder.

    // Actually, to support correct "insert between", we need to shift others.
    // But since we are using float/large spacing or just updating all?
    // WeeklyView updates ALL items in container. We should do the same for robustness.

    return { success: false, error: "Not implemented fully for single item swap yet" }
}

export async function updateTaskOrders(projectId: string, updates: { id: string, sort_order: number }[]) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Oturum açılmamış' }

        // Perform updates in parallel for better performance since they are independent RLS-wise usually
        // But sequential is safer if rate limits or connection limits are tight. 
        // Let's use Promise.all for speed, assuming batch size isn't huge.
        const promises = updates.map(update =>
            supabase
                .from('tasks')
                .update({ sort_order: update.sort_order })
                .eq('id', update.id)
                .eq('project_id', projectId)
        )

        await Promise.all(promises)

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (e) {
        console.error("Order Update Error:", e)
        return { success: false, error: String(e) }
    }
}

// ============================================
// TEMPLATE SYSTEM
// ============================================

/**
 * Convert an existing project to a reusable template
 */
export async function convertProjectToTemplate(projectId: string, templateName?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    const updates: any = {
        is_template: true,
        status: 'template'
    }

    if (templateName) {
        updates.name = templateName
    }

    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/tutor')
    return { data }
}

/**
 * Get all template projects
 */
export async function getTemplates(moduleType?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    let query = supabase
        .from('projects')
        .select('*')
        .or(`is_official.eq.true,and(is_template.eq.true,user_id.eq.${user.id})`)
        .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) return { error: error.message }

    // Filter by module_type if specified
    if (moduleType && data) {
        const filtered = data.filter((p: any) =>
            p.module === moduleType ||
            p.settings?.module === moduleType ||
            p.settings?.module_type === moduleType
        )
        return { data: filtered }
    }

    return { data }
}

/**
 * Create a new project from a template
 */
export async function createProjectFromTemplate(
    templateId: string,
    studentId: string,
    startDate: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    try {
        // 1. Get template project with tasks
        const { data: template, error: templateError } = await supabase
            .from('projects')
            .select(`
                *,
                tasks (*)
            `)
            .eq('id', templateId)
            .eq('is_template', true)
            .single()

        if (templateError || !template) {
            return { error: 'Şablon bulunamadı' }
        }

        // 2. Determine target user (already a UUID from getAssignedPersonas)
        const targetUserId = studentId || user.id

        // 3. Create new project
        // If creating for another user, use admin client to bypass RLS
        const supabaseClient = targetUserId === user.id ? supabase : createAdminClient()

        const isCoachProject = true // Always true for programs created from templates via tutor panels

        const { data: newProject, error: projectError } = await supabaseClient
            .from('projects')
            .insert({
                user_id: targetUserId,
                name: template.name,
                description: template.description,
                status: 'active',
                start_date: startDate,
                is_coach_project: isCoachProject,
                settings: {
                    duration_days: template.duration_days,
                    is_template: false,
                    is_coach_project: isCoachProject,
                    created_by: user.id,
                    template_id: templateId,
                    student_id: studentId
                }
            })
            .select()
            .single()

        if (projectError || !newProject) {
            return { error: projectError?.message || 'Proje oluşturulamadı' }
        }

        // 3.5 Get default task type ID for 'todo'
        const { data: defaultType } = await supabase
            .from('task_types')
            .select('id')
            .eq('slug', 'todo')
            .single()

        // 4. Copy tasks one by one to handle parent_id mapping
        const tasks = template.tasks as any[]
        if (tasks && tasks.length > 0) {
            const start = new Date(startDate)
            const templateStart = new Date(template.start_date || template.created_at)

            // Map from template task ID to new project task ID
            const idMap: { [key: string]: string } = {}

            // Sort tasks to process parents before children if possible, 
            // though our for loop with idMap handles it if parents are encountered first.
            // Templates created with our builder usually have parents before children.
            for (const task of tasks) {
                // Calculate date
                const taskDate = new Date(task.start_date || task.due_date)
                const dayDiff = Math.floor((taskDate.getTime() - templateStart.getTime()) / (1000 * 60 * 60 * 24))
                const newTaskDate = new Date(start)
                newTaskDate.setDate(newTaskDate.getDate() + dayDiff)
                const newTaskDateStr = newTaskDate.toISOString().split('T')[0]

                const { data: newTask, error: taskError } = await supabase
                    .from('tasks')
                    .insert({
                        project_id: newProject.id,
                        user_id: targetUserId,
                        task_type_id: task.task_type_id || defaultType?.id,
                        title: task.title,
                        description: task.description,
                        start_date: newTaskDateStr,
                        due_date: newTaskDateStr,
                        duration_minutes: task.duration_minutes,
                        sort_order: task.sort_order,
                        is_completed: false,
                        created_by: user.id,
                        assigned_to: targetUserId,
                        assigned_by: user.id,
                        parent_id: task.parent_id ? idMap[task.parent_id] : null
                    })
                    .select()
                    .single()

                if (taskError) {
                    await supabase.from('projects').delete().eq('id', newProject.id)
                    return { error: 'Görevler oluşturulamadı: ' + taskError.message }
                }

                if (newTask) {
                    idMap[task.id] = newTask.id
                }
            }
        }

        revalidatePath('/tutor')
        revalidatePath(`/projects/${newProject.id}`)

        return { data: newProject }
    } catch (e) {
        console.error('Template creation error:', e)
        return { error: String(e) }
    }
}

/**
 * Create a template from the template builder
 */
export async function createTemplateFromBuilder(
    templateData: {
        name: string
        description: string
        moduleType: string
        durationDays: number
    },
    tasks: Array<{
        id: string
        title: string
        description: string
        day: number
        duration: number
        parent_id?: string
    }>
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    try {
        // 1. Create template project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
                user_id: user.id,
                name: templateData.name,
                description: templateData.description,
                status: 'template',
                is_template: true,
                start_date: new Date().toISOString().split('T')[0],
                settings: {
                    module_type: templateData.moduleType,
                    duration_days: templateData.durationDays
                }
            })
            .select()
            .single()

        if (projectError || !project) {
            return { error: projectError?.message || 'Proje oluşturulamadı' }
        }

        // 1.5 Get default task type ID for 'todo'
        const { data: defaultType } = await supabase
            .from('task_types')
            .select('id')
            .eq('slug', 'todo')
            .single()

        // 2. Create tasks one by one to handle parent_id mapping
        // We need a map from local ID (from frontend) to database ID (returned by Supabase)
        const idMap: { [key: string]: string } = {}

        for (const task of tasks) {
            // Calculate task date
            const taskDate = new Date()
            taskDate.setDate(taskDate.getDate() + (task.day - 1))

            const { data: newTask, error: taskError } = await supabase
                .from('tasks')
                .insert({
                    project_id: project.id,
                    user_id: user.id,
                    task_type_id: defaultType?.id,
                    title: task.title,
                    description: task.description,
                    start_date: taskDate.toISOString().split('T')[0],
                    due_date: taskDate.toISOString().split('T')[0],
                    duration_minutes: task.duration,
                    sort_order: tasks.indexOf(task),
                    is_completed: false,
                    created_by: user.id,
                    parent_id: task.parent_id ? idMap[task.parent_id] : null
                })
                .select()
                .single()

            if (taskError) {
                // Rollback
                await supabase.from('projects').delete().eq('id', project.id)
                return { error: 'Görev oluşturulamadı: ' + taskError.message }
            }

            if (newTask) {
                idMap[task.id] = newTask.id
            }
        }

        revalidatePath('/tutor')
        return { success: true, data: project }
    } catch (e) {
        console.error('Template builder creation error:', e)
        return { error: String(e) }
    }
}

/**
 * Get a single project by ID
 */
export async function getProjectById(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    console.log('Fetching project:', projectId, 'for user:', user.id)

    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single()

        if (error) {
            console.error('Database error fetching project:', error)
            return { error: error.message }
        }

        if (!data) {
            console.warn('Project not found in database:', projectId)
            return { error: 'Proje bulunamadı' }
        }

        // Security check: only allow creator or admins
        if (data.user_id !== user.id) {
            // Check if user has tutor-student relationship or other access logic if needed
            // For now, let's just log and see
            console.warn('User', user.id, 'attempted to access project owned by', data.user_id)
        }

        return { data }
    } catch (e) {
        console.error('Unexpected error in getProjectById:', e)
        return { error: String(e) }
    }
}

/**
 * Synchronize project/template tasks (insert, update, delete)
 */
export async function syncProjectTasks(projectId: string, tasks: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmamış' }

    try {
        // 1. Get existing task IDs
        const { data: existingTasks } = await supabase
            .from('tasks')
            .select('id')
            .eq('project_id', projectId)

        const existingIds = (existingTasks || []).map(t => t.id)
        const incomingIds = tasks.filter(t => !String(t.id).startsWith('temp-')).map(t => t.id)

        // 2. Identify tasks to delete
        const idsToDelete = existingIds.filter(id => !incomingIds.includes(id))
        if (idsToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('tasks')
                .delete()
                .in('id', idsToDelete)
            if (deleteError) return { error: 'Silme hatası: ' + deleteError.message }
        }

        // 3. Get default task type
        const { data: defaultType } = await supabase
            .from('task_types')
            .select('id')
            .eq('slug', 'todo')
            .single()

        // 4. Sync tasks
        const idMap: { [key: string]: string } = {}

        for (const task of tasks) {
            const isNew = String(task.id).startsWith('temp-')
            const payload: any = {
                project_id: projectId,
                user_id: user.id,
                title: task.title,
                description: task.description,
                start_date: task.start_date,
                due_date: task.due_date,
                duration_minutes: task.duration_minutes || task.duration || 0,
                sort_order: tasks.indexOf(task),
                task_type_id: task.task_type_id || defaultType?.id,
                is_completed: task.is_completed || false,
                created_by: user.id,
                assigned_to: user.id, // Usually owner for templates
                parent_id: task.parent_id ? (idMap[task.parent_id] || task.parent_id) : null
            }

            if (isNew) {
                const { data: inserted, error: insertError } = await supabase
                    .from('tasks')
                    .insert(payload)
                    .select()
                    .single()

                if (insertError) return { error: 'Ekleme hatası: ' + insertError.message }
                if (inserted) idMap[task.id] = inserted.id
            } else {
                const { error: updateError } = await supabase
                    .from('tasks')
                    .update(payload)
                    .eq('id', task.id)

                if (updateError) return { error: 'Güncelleme hatası: ' + updateError.message }
                idMap[task.id] = task.id
            }
        }

        return { success: true }
    } catch (err: any) {
        return { error: err.message || 'Senkronizasyon hatası' }
    }
}
