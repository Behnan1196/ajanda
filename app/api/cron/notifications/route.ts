import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        // Basic security check
        const authHeader = request.headers.get('authorization')
        if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // return new Response('Unauthorized', { status: 401 })
        }

        // Configure VAPID lazily inside the handler to avoid build-time errors
        const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
        const vapidPrivate = process.env.VAPID_PRIVATE_KEY?.trim()
        const vapidSubject = process.env.VAPID_SUBJECT?.trim() || 'mailto:behnan@example.com'

        if (!vapidPublic || !vapidPrivate) {
            return new Response('Error: VAPID keys are missing from environment variables.', { status: 500 })
        }

        try {
            webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
        } catch (err: any) {
            return new Response(`Error: VAPID Configuration Failed - ${err.message}`, { status: 500 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            return new Response('Error: Supabase environment variables are missing.', { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const now = new Date()
        // Current time in Turkey (UTC+3)
        const trOffset = 3 * 60 * 60 * 1000
        const trNow = new Date(now.getTime() + trOffset)

        const today = trNow.toISOString().split('T')[0]
        const currentMin = trNow.getHours().toString().padStart(2, '0') + ':' + trNow.getMinutes().toString().padStart(2, '0')

        console.log(`Running cron at ${today} ${currentMin}`)

        // 1. Get tasks due now that haven't been notified
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select(`
                id, 
                title, 
                user_id,
                metadata
            `)
            .eq('due_date', today)
            .eq('due_time', currentMin)
            .eq('is_completed', false)

        if (tasksError) {
            return new Response(`Error: Database query failed - ${tasksError.message}`, { status: 500 })
        }

        if (!tasks || tasks.length === 0) {
            return new Response(`No tasks found for ${today} ${currentMin}`, { status: 200 })
        }

        const results = []

        for (const task of tasks) {
            // 2. Already notified? (Avoid spam)
            if (task.metadata?.notified_push === true) continue

            // 3. Get user's subscriptions
            const { data: subs, error: subsError } = await supabase
                .from('push_subscriptions')
                .select('subscription')
                .eq('user_id', task.user_id)

            if (subsError || !subs) continue

            // 4. Send pushes
            for (const { subscription } of subs) {
                try {
                    await webpush.sendNotification(
                        subscription as any,
                        JSON.stringify({
                            title: 'Görev Zamanı! 🕒',
                            body: task.title,
                            icon: '/icons/icon-192x192.png'
                        })
                    )
                    results.push({ taskId: task.id, status: 'sent' })
                } catch (err: any) {
                    console.error('Push error:', err)
                    if (err.statusCode === 410) {
                        // Subscription expired/invalid
                        await supabase.from('push_subscriptions').delete().eq('subscription', subscription)
                    }
                }
            }

            // 5. Mark as notified in metadata
            await supabase.from('tasks').update({
                metadata: { ...task.metadata, notified_push: true }
            }).eq('id', task.id)
        }

        return new Response(JSON.stringify(results), { status: 200 })
    } catch (globalError: any) {
        return new Response(`Critical System Error: ${globalError.message}`, { status: 500 })
    }
}
