import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { subscription } = await request.json()

        if (!subscription) {
            return NextResponse.json({ error: 'Subscription is required' }, { status: 400 })
        }

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                subscription: subscription
            }, {
                onConflict: 'user_id, subscription'
            })

        if (error) {
            console.error('Subscription save error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Push subscribe error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
