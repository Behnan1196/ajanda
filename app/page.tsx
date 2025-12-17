import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardTabs from '@/components/DashboardTabs'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardTabs user={user} />
    </div>
  )
}
