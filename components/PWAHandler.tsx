'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendLocalNotification, requestNotificationPermission } from '@/lib/notifications'

export default function PWAHandler() {
    const supabase = createClient()
    const lastCheckedMinute = useRef<string | null>(null)

    useEffect(() => {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered')
                    // Proactively request permission on mount if not determined
                    if (Notification.permission === 'default') {
                        requestNotificationPermission()
                    }
                })
        }

        // Client-side Reminder Checker
        const checkReminders = async () => {
            const now = new Date()
            // Adjust to local date string yyyy-mm-dd
            const offset = now.getTimezoneOffset()
            const localNow = new Date(now.getTime() - (offset * 60 * 1000))
            const today = localNow.toISOString().split('T')[0]
            const currentTimeString = now.toTimeString().substring(0, 5) // "HH:MM"

            // Avoid double checks for the same minute
            if (lastCheckedMinute.current === currentTimeString) return
            lastCheckedMinute.current = currentTimeString

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: tasks } = await supabase
                .from('tasks')
                .select('id, title, due_time')
                .eq('user_id', user.id)
                .eq('due_date', today)
                .eq('is_completed', false)
                .eq('due_time', currentTimeString)

            if (tasks && tasks.length > 0) {
                tasks.forEach(task => {
                    console.log('Notifying task:', task.title)
                    sendLocalNotification('Görev Zamanı!', task.title)
                })
            }
        }

        // Check every 30 seconds to ensure we don't miss the minute start
        checkReminders()
        const interval = setInterval(checkReminders, 30000)
        return () => clearInterval(interval)
    }, [supabase])

    return null
}
