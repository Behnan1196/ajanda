import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        // Basic security check
        const authHeader = request.headers.get('authorization')
        if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response('Unauthorized', { status: 401 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            return new Response('Error: Supabase environment variables are missing.', { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get today's date in local timezone (Turkey UTC+3)
        const now = new Date()
        const trOffset = 3 * 60 * 60 * 1000
        const trNow = new Date(now.getTime() + trOffset)
        const today = trNow.toISOString().split('T')[0]

        console.log(`Running task rollover at ${today}`)

        // Find all incomplete tasks from previous days (excluding project tasks)
        const { data: pendingTasks, error: fetchError } = await supabase
            .from('tasks')
            .select('id, title, user_id, due_date')
            .eq('is_completed', false)
            .is('project_id', null) // Only standalone tasks
            .lt('due_date', today)

        if (fetchError) {
            console.error('Error fetching pending tasks:', fetchError)
            return new Response(`Error: ${fetchError.message}`, { status: 500 })
        }

        if (!pendingTasks || pendingTasks.length === 0) {
            return new Response('No tasks to rollover', { status: 200 })
        }

        console.log(`Found ${pendingTasks.length} tasks to rollover`)

        // Update all pending tasks to today
        const { error: updateError } = await supabase
            .from('tasks')
            .update({ due_date: today })
            .in('id', pendingTasks.map(t => t.id))

        if (updateError) {
            console.error('Error updating tasks:', updateError)
            return new Response(`Error: ${updateError.message}`, { status: 500 })
        }

        // Group by user for summary
        const userTaskCounts = pendingTasks.reduce((acc, task) => {
            acc[task.user_id] = (acc[task.user_id] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const summary = Object.entries(userTaskCounts).map(([userId, count]) => ({
            userId,
            tasksRolledOver: count
        }))

        return new Response(JSON.stringify({
            success: true,
            totalTasksRolledOver: pendingTasks.length,
            userSummary: summary,
            date: today
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (globalError: any) {
        console.error('Critical error in task rollover:', globalError)
        return new Response(`Critical System Error: ${globalError.message}`, { status: 500 })
    }
}
