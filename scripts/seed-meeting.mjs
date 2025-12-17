
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin rights

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
    console.log('Seeding meeting task type...')

    const { error } = await supabase
        .from('task_types')
        .upsert({
            name: 'Toplantı',
            slug: 'meeting',
            icon: 'users',
            is_active: true,
            schema: {
                fields: [
                    {
                        name: 'duration',
                        type: 'number',
                        label: 'Süre (Dakika)',
                        required: true,
                        placeholder: 'Örn: 30'
                    }
                ]
            }
        }, { onConflict: 'slug' })

    if (error) {
        console.error('Error seeding meeting:', error)
    } else {
        console.log('Meeting task type seeded successfully!')
    }
}

seed()
