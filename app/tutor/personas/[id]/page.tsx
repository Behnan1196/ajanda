import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TutorPageClient from '../../TutorPageClient'

export default async function PersonaDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <TutorPageClient
            userId={user.id}
            initialPersonaId={params.id}
        />
    )
}
