'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendLocalNotification } from '@/lib/notifications'

export default function PWAHandler() {
    const supabase = createClient()
    const notifiedTasks = useRef<Set<string>>(new Set())

    useEffect(() => {
        // Register Service Worker
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered')
                })
        }

        // Client-side Reminder Checker
        const checkReminders = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const now = new Date()

            // local HH:MM
            const hour = now.getHours().toString().padStart(2, '0')
            const minute = now.getMinutes().toString().padStart(2, '0')
            const currentTimeString = `${hour}:${minute}`

            // local yyyy-mm-dd
            const offset = now.getTimezoneOffset()
            const localNow = new Date(now.getTime() - (offset * 60 * 1000))
            const today = localNow.toISOString().split('T')[0]

            // We use .lte('due_time', ...) to catch notifications that might have been 
            // missed while the app was in the background/throttled.
            // IMPORTANT: Also check metadata to avoid duplicates with server-side push
            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('id, title, due_time, metadata')
                .eq('user_id', user.id)
                .eq('due_date', today)
                .eq('is_completed', false)
                .lte('due_time', currentTimeString)
                .order('due_time', { ascending: true })

            if (error) {
                console.error('Error fetching tasks for notifications:', error)
                return
            }

            if (tasks && tasks.length > 0) {
                tasks.forEach(async task => {
                    // Skip if already notified by server-side push OR client-side
                    if (task.metadata?.notified_push === true || notifiedTasks.current.has(task.id)) {
                        return
                    }

                    console.log('Triggering notification for task:', task.title)
                    sendLocalNotification('Görev Zamanı!', task.title)
                    notifiedTasks.current.add(task.id)

                    // Mark as notified in database to prevent server-side duplicate
                    await supabase
                        .from('tasks')
                        .update({
                            metadata: { ...task.metadata, notified_push: true }
                        })
                        .eq('id', task.id)
                })
            }
        }

        // Check every 20 seconds for higher precision
        const interval = setInterval(checkReminders, 20000)
        // Initial check
        checkReminders()

        return () => clearInterval(interval)
    }, [supabase])

    return null
}
