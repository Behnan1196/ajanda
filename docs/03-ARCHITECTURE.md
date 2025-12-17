# Component Detayları

## DashboardTabs

**Dosya:** `components/DashboardTabs.tsx`

**Amaç:** Ana dashboard ve tab navigasyon sistemi

**Props:**
```typescript
interface DashboardTabsProps {
  user: User  // Supabase User objesi
}
```

**State:**
- `activeTab`: Ana sekme (program | gelisim | iletisim | araclar)
- `activeProgramTab`: Program alt sekmesi (bugun | haftalik | aylik)
- `selectedDate`: Takvimden seçilen tarih

**Özellikler:**
- 4 ana tab (alt bottom bar)
- Program sekmesinde 3 alt tab
- Takvimden tarih seçimi → Bugün sekmesine geçiş

---

## TodayView

**Dosya:** `components/program/TodayView.tsx`

**Amaç:** Günlük görev görünümü ve yönetimi

**Props:**
```typescript
interface TodayViewProps {
  userId: string
  initialDate?: Date | null  // Takvimden seçilen tarih
}
```

**State:**
- `tasks`: Görev listesi
- `loading`: Yükleme durumu
- `showTaskModal`: Modal açık/kapalı
- `editingTask`: Düzenlenen görev
- `selectedDate`: Seçili tarih

**Fonksiyonlar:**
- `loadTasks(date)`: Belirtilen tarihteki görevleri yükle
- `handleTaskComplete(id)`: Görevi tamamla
- `handleTaskUncomplete(id)`: Tamamlamayı geri al
- `handleTaskDelete(id)`: Görevi sil
- `handleTaskEdit(task)`: Görev düzenleme modalını aç
- `goToPreviousDay()`: Önceki güne git
- `goToNextDay()`: Sonraki güne git
- `goToToday()`: Bugüne dön

---

## MonthlyView  

**Dosya:** `components/program/MonthlyView.tsx`

**Amaç:** Aylık takvim görünümü

**Props:**
```typescript
interface MonthlyViewProps {
  userId: string
  onDateSelect: (date: Date) => void  // Tarih seçildiğinde callback
}
```

**State:**
- `currentMonth`: Görüntülenen ay
- `monthData`: Map<dateString, DayData>
- `loading`: Yükleme durumu

**Fonksiyonlar:**
- `loadMonthData()`: Ayın tüm görevlerini yükle ve grupla
- `getDaysInMonth()`: Takvim grid için 42 gün oluştur
- `goToPreviousMonth()`: Önceki aya git
- `goToNextMonth()`: Sonraki aya git
- `goToToday()`: Bu aya dön
- `handleDateClick(date)`: Tarihe tıklandığında callback çağır

**Veri Yapısı:**
```typescript
interface DayData {
  date: Date
  taskCount: number          // Toplam görev sayısı
  completedCount: number     // Tamamlanan görev sayısı
}
```

**Görsel Gösterim:**
- Sağ alt köşede: `2/5` formatında görev sayısı
- Renk kodları:
  - İndigo: Hiç tamamlanmamış (0/5)
  - Sarı: Kısmi tamamlanmış (2/5)
  - Yeşil: Hepsi tamamlanmış (5/5)

---

## TaskCard

**Dosya:** `components/program/TaskCard.tsx`

**Amaç:** Tek bir görevin görsel kartı

**Props:**
```typescript
interface TaskCardProps {
  task: Task
  onComplete: () => void
  onUncomplete: () => void
  onEdit: () => void
  onDelete: () => void
}
```

**Görsel Elementler:**
- Görev tipi ikonu (video/todo)
- Başlık (tamamlanmışsa üstü çizili)
- Açıklama
- Metadata (video URL, süre vb.)
- Saat bilgisi
- "Yaptım" butonu / Tamamlandı ikonu
- Menü butonu (⋮)

---

## TaskMenu

**Dosya:** `components/program/TaskMenu.tsx`

**Amaç:** Görev işlemleri dropdown menüsü

**Props:**
```typescript
interface TaskMenuProps {
  taskId: string
  isCompleted: boolean
  onEdit: () => void
  onDelete: () => void
  onUncomplete?: () => void
}
```

**Menü Seçenekleri:**
- **Geri Al** (sadece tamamlanmışsa)
- **Düzenle**
- **Sil** (kırmızı vurgu, onay dialog)

---

## TaskFormModal

**Dosya:** `components/program/TaskFormModal.tsx`

**Amaç:** Görev ekleme/düzenleme modal formu

**Props:**
```typescript
interface TaskFormModalProps {
  userId: string
  editingTask?: Task | null       // Edit mode için
  defaultDate?: Date              // Seçili tarih
  onClose: () => void
  onTaskSaved: () => void
}
```

**Modlar:**
- **Create Mode:** `editingTask = null`  
  - Başlık: "Yeni Görev"
  - Buton: "Kaydet"
  
- **Edit Mode:** `editingTask` var
  - Başlık: "Görevi Düzenle"
  - Görev tipi disabled
  - Buton: "Güncelle"

**Form Alanları:**
- Görev Tipi (select)
- Başlık (text, required)
- Açıklama (textarea)
- **Dinamik alanlar** (task_type.schema'dan)
  - Video: URL (url), Süre (number)
  - To-Do: Notlar (textarea)
- Tarih (date)
- Saat (time)
- Hatırlatıcı (time, sadece create mode)

---

## AddTaskButton

**Dosya:** `components/program/AddTaskButton.tsx`

**Amaç:** Floating Action Button (FAB)

**Props:**
```typescript
interface AddTaskButtonProps {
  onClick: () => void
}
```

**Stil:**
- Sabit pozisyon (sağ alt)
- İndigo arka plan
- + ikonu
- Hover efekti

---

## Supabase Utilities

### client.ts
```typescript
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### server.ts
```typescript
export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get, set, remove } }
  )
}
```

### middleware.ts
```typescript
export async function updateSession(request: NextRequest) {
  // Session yenileme
  // Auth check
  // Protected route kontrolü
}
```

---

## Animasyon Sınıfları

**Dosya:** `app/globals.css`

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-fadeIn { animation: fadeIn 0.2s ease-out; }
.animate-slideUp { animation: slideUp 0.3s ease-out; }
```

---

**Son Güncelleme:** 5 Aralık 2025
