'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createUser(data: any) {
    const supabaseAdmin = createAdminClient()
    const supabase = await createClient()

    // Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: userData } = await supabase
        .from('users')
        .select('roles')
        .eq('id', user.id)
        .single()

    if (!userData?.roles?.includes('admin')) {
        return { error: 'Forbidden' }
    }

    // 1. Create user in Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
            name: data.name
        }
    })

    if (authError) {
        return { error: authError.message }
    }

    if (!authUser.user) {
        return { error: 'User creation failed' }
    }

    // 2. Insert into public.users (triggers might handle this, but let's be safe and update if needed)
    // Our schema usually handles this via triggers on auth.users insert, 
    // but if we need to set roles immediately, we should update the public.users table.
    // The trigger likely creates the user with default 'student' role.
    // We should update the role to the selected one.

    // Wait a bit for trigger? Or just upsert?
    // Ideally, we update the public user record.

    // 2. Insert into public.users
    // Since there is no trigger, we must explicitly insert the user into the public table.
    // Using upsert to be safe.
    const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
            id: authUser.user.id,
            email: data.email,
            name: data.name,
            roles: [data.role],
            organization_id: null // Explicitly null for now, or handle organization selection later
        })

    if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Cleanup: delete auth user if profile creation fails?
        // For now, just return error.
        return { error: 'User created in Auth but profile creation failed: ' + profileError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function deleteUser(userId: string) {
    const supabaseAdmin = createAdminClient()
    const supabase = await createClient()

    // Check permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: userData } = await supabase
        .from('users')
        .select('roles')
        .eq('id', user.id)
        .single()

    if (!userData?.roles?.includes('admin')) {
        return { error: 'Forbidden' }
    }

    // Delete from Auth (Cascade should handle public.users)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function getUsers() {
    const supabaseAdmin = createAdminClient()
    const supabase = await createClient()

    // Check permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: userData } = await supabase
        .from('users')
        .select('roles')
        .eq('id', user.id)
        .single()

    if (!userData?.roles?.includes('admin')) {
        return []
    }

    const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching users:', error)
        return []
    }

    return data
}

export async function getUser(userId: string) {
    const supabaseAdmin = createAdminClient()
    const supabase = await createClient()

    // Check permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: adminData } = await supabase
        .from('users')
        .select('roles')
        .eq('id', user.id)
        .single()

    if (!adminData?.roles?.includes('admin')) {
        return null
    }

    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

    if (profileError || !userProfile) {
        console.error('Error fetching user profile:', profileError)
        return null
    }

    // Fetch coaches separately
    const { data: relationships, error: relError } = await supabaseAdmin
        .from('user_relationships')
        .select(`
            id,
            coach_id,
            role_label,
            coach:users!coach_id(name, email)
        `)
        .eq('student_id', userId)
        .eq('is_active', true)

    if (relError) {
        console.error('Error fetching coaches:', relError)
    }

    // Map coaches to cleaner format
    const activeCoaches = relationships?.map((c: any) => ({
        id: c.coach_id,
        relationship_id: c.id,
        name: c.coach?.name || 'Unknown',
        email: c.coach?.email || '',
        role: c.role_label || 'Genel Koç'
    })) || []

    return {
        ...userProfile,
        coaches: activeCoaches
    }
}

export async function updateUser(userId: string, data: any) {
    const supabaseAdmin = createAdminClient()
    const supabase = await createClient()

    // Check permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminData } = await supabase
        .from('users')
        .select('roles')
        .eq('id', user.id)
        .single()

    if (!adminData?.roles?.includes('admin')) {
        return { error: 'Forbidden' }
    }

    // Update public profile
    const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
            name: data.name,
            roles: data.roles, // Expecting array of strings
            specialties: data.specialties || [], // Update specialties
            // Add other fields as needed
        })
        .eq('id', userId)

    if (updateError) {
        return { error: updateError.message }
    }

    // If password provided, update auth user
    if (data.password && data.password.length >= 6) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: data.password
        })
        if (authError) {
            return { error: 'Profile updated but password failed: ' + authError.message }
        }
    }

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
}

export async function getCoaches() {
    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, specialties') // Select specialties
        .contains('roles', ['coach'])
        .order('name')

    if (error) {
        console.error('Error fetching coaches:', error)
        return []
    }
    return data
}

export async function assignCoach(studentId: string, coachId: string, roleLabel: string = 'Genel Koç') {
    const supabaseAdmin = createAdminClient()
    const supabase = await createClient()

    // Check permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin
    const { data: adminData } = await supabase
        .from('users')
        .select('roles')
        .eq('id', user.id)
        .single()
    if (!adminData?.roles?.includes('admin')) return { error: 'Forbidden' }

    // Insert or Update relationship
    // With the new schema, we can have multiple coaches.
    // We'll use upsert on constraint if we had one, but we dropped the simple pairwise constraint.
    // The new unique index is (coach_id, student_id, role_label).

    const { error } = await supabaseAdmin
        .from('user_relationships')
        .upsert({
            student_id: studentId,
            coach_id: coachId,
            role_label: roleLabel,
            is_active: true
        }, {
            onConflict: 'coach_id,student_id,role_label'
        })

    if (error) return { error: error.message }

    revalidatePath(`/admin/users/${studentId}`)
    return { success: true }
}

export async function removeCoach(studentId: string, relationshipId: string) {
    const supabaseAdmin = createAdminClient()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminData } = await supabase
        .from('users')
        .select('roles')
        .eq('id', user.id)
        .single()
    if (!adminData?.roles?.includes('admin')) return { error: 'Forbidden' }

    // Soft delete (set inactive) by primary key ID
    const { error } = await supabaseAdmin
        .from('user_relationships')
        .update({ is_active: false })
        .eq('id', relationshipId)

    if (error) return { error: error.message }

    revalidatePath(`/admin/users/${studentId}`)
    return { success: true }
}
