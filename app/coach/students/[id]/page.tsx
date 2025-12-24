import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardTabs from '@/components/DashboardTabs'

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <DashboardTabs
            user={user}
            isCoachMode={true}
            initialStudentId={params.id}
        />
    )
}
