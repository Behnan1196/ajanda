# API ve Veri Akışı

## Supabase Client Kullanımı

### Browser Client (Client Component)

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Görevleri getir
const { data, error } = await supabase
  .from('tasks')
  .select('*, task_types(*)')
  .eq('user_id', userId)
  .eq('due_date', dateString)
  .order('due_time', { ascending: true })
```

### Server Client (Server Component)

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()

// Kullanıcıyı al
const { data: { user } } = await supabase.auth.getUser()
```

## CRUD İşlemleri

### Create (INSERT)

```typescript
// Görev oluştur
const { error } = await supabase
  .from('tasks')
  .insert({
    user_id: userId,
    task_type_id: taskTypeId,
    title: 'Görev Başlığı',
    description: 'Açıklama',
    metadata: { video_url: '...' },
    due_date: '2025-12-05',
    due_time: '14:30',
    created_by: userId
  })
```

### Read (SELECT)

```typescript
// Tek görev
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('id', taskId)
  .single()

// Görev listesi (JOIN ile)
const { data } = await supabase
  .from('tasks')
  .select(`
    *,
    task_types (name, slug, icon)
  `)
  .eq('user_id', userId)
```

### Update

```typescript
// Görevi tamamla
const { error } = await supabase
  .from('tasks')
  .update({
    is_completed: true,
    completed_at: new Date().toISOString()
  })
  .eq('id', taskId)

// Görevi düzenle
const { error } = await supabase
  .from('tasks')
  .update({
    title: 'Yeni Başlık',
    metadata: { ... }
  })
  .eq('id', taskId)
```

### Delete

```typescript
// Görevi sil
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId)
```

## Veri Akışı Örnekleri

### 1. Görev Ekleme Akışı

```
User: + Butonuna tıkla
  ↓
Component: setShowTaskModal(true)
  ↓
TaskFormModal: Form göster
  ↓
User: Formu doldur ve "Kaydet"
  ↓
TaskFormModal: handleSubmit()
  ↓
Supabase: INSERT tasks
  ↓
Component: onTaskSaved() callback
  ↓
TodayView: loadTasks() - Liste yenile
  ↓
UI: Yeni görev görünür
```

### 2. Takvimden Tarih Seçme

```
User: Aylık takvimde 10 Aralık'a tıkla
  ↓
MonthlyView: onDateSelect(date) callback
  ↓
DashboardTabs: setSelectedDate(date)
                setActiveProgramTab('bugun')
  ↓
TodayView: initialDate prop değişir
  ↓
TodayView: useEffect → setSelectedDate(initialDate)
  ↓
TodayView: loadTasks(selectedDate)
  ↓
Supabase: SELECT tasks WHERE due_date = '2025-12-10'
  ↓
UI: 10 Aralık'ın görevleri gösterilir
```

### 3. Görev Düzenleme Akışı

```
User: Görev kartında ⋮ → Düzenle
  ↓
TaskMenu: onEdit() callback
  ↓
TodayView: setEditingTask(task)
           setShowTaskModal(true)
  ↓
TaskFormModal: editingTask prop alır
               Form alanlarını doldurur
  ↓
User: Değişiklikleri yap, "Güncelle"
  ↓
TaskFormModal: handleSubmit()
  ↓
Supabase: UPDATE tasks WHERE id = taskId
  ↓
Component: onTaskSaved()
  ↓
TodayView: loadTasks() - Liste yenile
  ↓
UI: Güncel görev görünür
```

## Authentication Flow

### Login

```typescript
const { error } = await supabase.auth.signInWithPassword({
  email: 'demo@example.com',
  password: 'password123'
})

if (!error) {
  router.push('/')  // Dashboard'a yönlendir
}
```

### Logout

```typescript
await supabase.auth.signOut()
router.push('/login')
```

### Session Check (Middleware)

```typescript
// middleware.ts
const { data: { user } } = await supabase.auth.getUser()

if (!user && !request.nextUrl.pathname.startsWith('/login')) {
  return NextResponse.redirect(new URL('/login', request.url))
}
```

## RLS Policy Örnekleri

### Users can view own tasks

```sql
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (user_id = auth.uid());
```

### Coaches can view student tasks

```sql
CREATE POLICY "Coaches can view student tasks"
  ON tasks FOR SELECT
  USING (
    user_id IN (
      SELECT student_id FROM user_relationships
      WHERE coach_id = auth.uid() AND is_active = true
    )
  );
```

## Realtime Updates (Gelecek)

```typescript
// Görevleri dinle
const subscription = supabase
  .channel('tasks')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Liste güncelle
      loadTasks()
    }
  )
  .subscribe()
```

## Error Handling

```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert(taskData)

if (error) {
  console.error('Error creating task:', error)
  alert('Görev oluşturulurken hata oluştu')
  return
}

// Başarılı
onTaskSaved()
```

---

**Son Güncelleme:** 5 Aralık 2025
