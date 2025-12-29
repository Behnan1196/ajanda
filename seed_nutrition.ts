import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
    console.log('Starting seed...')

    // 1. Delete old tasks
    const projId = '00000000-0000-0000-0000-000000000003'
    const sysUserId = '00000000-0000-0000-0000-000000000000'

    await supabase.from('tasks').delete().eq('project_id', projId)
    console.log('Deleted old tasks')

    // 2. Get task types
    const { data: nType } = await supabase.from('task_types').select('id').eq('slug', 'nutrition').single()
    const { data: tType } = await supabase.from('task_types').select('id').eq('slug', 'todo').single()

    const typeId = nType?.id || tType?.id

    // 3. Insert Day 1
    const today = new Date().toISOString().split('T')[0]

    const { data: d1 } = await supabase.from('tasks').insert({
        project_id: projId,
        user_id: sysUserId,
        title: '1. Gün Beslenme Planı',
        description: '1850 Kalori Hedefi',
        task_type_id: typeId,
        start_date: today,
        due_date: today,
        sort_order: 0,
        created_by: sysUserId
    }).select().single()

    if (d1) {
        console.log('Created Day 1:', d1.id)
        await supabase.from('tasks').insert([
            { project_id: projId, parent_id: d1.id, user_id: sysUserId, title: 'Kahvaltı: Yulaf & Muz', task_type_id: typeId, due_date: today, sort_order: 0, created_by: sysUserId, metadata: { calories: 450 } },
            { project_id: projId, parent_id: d1.id, user_id: sysUserId, title: 'Öğle: Izgara Tavuk', task_type_id: typeId, due_date: today, sort_order: 1, created_by: sysUserId, metadata: { calories: 600 } },
            { project_id: projId, parent_id: d1.id, user_id: sysUserId, title: 'Akşam: Sebze Yemeği', task_type_id: typeId, due_date: today, sort_order: 2, created_by: sysUserId, metadata: { calories: 500 } }
        ])
    }

    // 4. Insert Day 2
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const { data: d2 } = await supabase.from('tasks').insert({
        project_id: projId,
        user_id: sysUserId,
        title: '2. Gün Beslenme Planı',
        description: '1900 Kalori Hedefi',
        task_type_id: typeId,
        start_date: tomorrow,
        due_date: tomorrow,
        sort_order: 1,
        created_by: sysUserId
    }).select().single()

    if (d2) {
        console.log('Created Day 2:', d2.id)
        await supabase.from('tasks').insert([
            { project_id: projId, parent_id: d2.id, user_id: sysUserId, title: 'Kahvaltı: Yumurta', task_type_id: typeId, due_date: tomorrow, sort_order: 0, created_by: sysUserId, metadata: { calories: 400 } },
            { project_id: projId, parent_id: d2.id, user_id: sysUserId, title: 'Öğle: Köfte', task_type_id: typeId, due_date: tomorrow, sort_order: 1, created_by: sysUserId, metadata: { calories: 650 } },
            { project_id: projId, parent_id: d2.id, user_id: sysUserId, title: 'Akşam: Balık', task_type_id: typeId, due_date: tomorrow, sort_order: 2, created_by: sysUserId, metadata: { calories: 550 } }
        ])
    }

    console.log('Seed complete!')
}

seed().catch(console.error)
