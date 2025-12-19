'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendLocalNotification } from '@/lib/notifications'

export default function PWAHandler() {
    const supabase = createClient()

    useEffect(() => {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
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
            // Adjust to local date string yyyy-mm-dd
            const offset = now.getTimezoneOffset()
            const localNow = new Date(now.getTime() - (offset * 60 * 1000))
            const today = localNow.toISOString().split('T')[0]
            const currentTime = now.toTimeString().substring(0, 5)

            const { data: tasks } = await supabase
                .from('tasks')
                .select('title, due_time')
                .eq('user_id', user.id)
                .eq('due_date', today)
                .eq('is_completed', false)
                .eq('due_time', currentTime)

            if (tasks && tasks.length > 0) {
                tasks.forEach(task => {
                    sendLocalNotification('Görev Zamanı!', task.title)
                })
            }
        }

        // Check immediately and then every minute
        checkReminders()
        const interval = setInterval(checkReminders, 60000)
        return () => clearInterval(interval)
    }, [supabase])

    return null
}
