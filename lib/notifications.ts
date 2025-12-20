'use client'

export async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('Bildirim desteği bu tarayıcıda yok.')
        return false
    }

    console.log('Mevcut bildirim izni:', Notification.permission)

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission === 'denied') {
        console.log('Bildirim izni daha önce reddedilmiş.')
        return false
    }

    try {
        console.log('Bildirim izni isteniyor...')
        // Safari/iOS requires a direct user gesture for this call
        const permission = await Notification.requestPermission()
        console.log('Bildirim izni sonucu:', permission)
        return permission === 'granted'
    } catch (err) {
        console.error('Bildirim izni istenirken hata:', err)
        return false
    }
}

export function sendLocalNotification(title: string, body: string) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        // Check for Service Worker registration to show notification via SW (best for PWA)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body,
                    icon: '/icons/icon-512x512.png',
                    badge: '/icons/icon-512x512.png',
                })
            })
        } else {
            new Notification(title, {
                body,
                icon: '/icons/icon-512x512.png'
            })
        }
    }
}

export function sendTestNotification() {
    sendLocalNotification('Test Bildirimi 🔔', 'Bildirim sisteminiz başarıyla çalışıyor!')
}

export async function subscribeUserToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported')
        return null
    }

    try {
        const registration = await navigator.serviceWorker.ready
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

        if (!publicVapidKey) {
            console.error('Public VAPID key is missing')
            return null
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicVapidKey
        })

        const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            body: JSON.stringify({ subscription }),
            headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) throw new Error('Failed to save subscription on server')

        console.log('User is subscribed to Push')
        return subscription
    } catch (error) {
        console.error('Failed to subscribe user:', error)
        return null
    }
}
