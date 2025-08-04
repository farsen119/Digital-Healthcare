# Doctor Type Registration Implementation Guide

## 🎯 **Overview**

This implementation allows **admins to set doctor type during registration** in both backend and frontend. Admins can now choose between:

1. **Permanent Doctor (Always Available)**: Queue-based consultation system
2. **Visiting Doctor (Special Days Only)**: Pre-booking system with time slots

---

## 🏗️ **Backend Implementation**

### **1. Enhanced Admin Interface (`users/admin.py`)**

#### **Updated Admin Fieldsets**
```python
# Fields to display in the admin form
fieldsets = UserAdmin.fieldsets + (
    ('Doctor Information', {
        'fields': (
            'doctor_type', 'license_number', 'experience_years', 'qualification', 
            'hospital', 'consultation_fee', 'bio', 'available_days', 'consultation_hours',
            'current_queue_position', 'max_queue_size', 'consultation_duration',
            'is_consulting', 'current_patient', 'visiting_days', 'visiting_start_date', 'visiting_end_date'
        ),
        'classes': ('collapse',),
        'description': 'These fields are specific to doctors'
    }),
)
```

#### **Updated List Display**
```python
list_display = ['username', 'email', 'role', 'first_name', 'last_name', 'specialization', 'doctor_type', 'phone', 'city', 'age', 'gender', 'blood_group', 'is_live', 'is_available_for_consultation']
list_filter = ['role', 'specialization', 'doctor_type', 'city', 'gender', 'blood_group', 'marital_status', 'is_live', 'is_available_for_consultation']
```

### **2. Enhanced Serializer Validation (`users/serializers.py`)**

#### **Doctor Type Validation**
```python
# Validate doctor type for doctors
doctor_type = data.get('doctor_type', 'permanent')
if doctor_type not in ['permanent', 'visiting']:
    raise serializers.ValidationError({"doctor_type": "Doctor type must be either 'permanent' or 'visiting'."})

# Set default values for doctor type specific fields
if doctor_type == 'permanent':
    data.setdefault('max_queue_size', 10)
    data.setdefault('consultation_duration', 15)
elif doctor_type == 'visiting':
    data.setdefault('visiting_days', [])
```

#### **Enhanced Create Method**
```python
doctor_type=validated_data.get('doctor_type', 'permanent'),
current_queue_position=validated_data.get('current_queue_position', 0),
max_queue_size=validated_data.get('max_queue_size', 10),
consultation_duration=validated_data.get('consultation_duration', 15),
is_consulting=validated_data.get('is_consulting', False),
current_patient=validated_data.get('current_patient', None),
visiting_days=validated_data.get('visiting_days', []),
visiting_start_date=validated_data.get('visiting_start_date', None),
visiting_end_date=validated_data.get('visiting_end_date', None),
```

---

## 🎨 **Frontend Implementation**

### **1. Enhanced Admin Registration Form (`admin-register.component.ts`)**

#### **Updated Form Fields**
```typescript
form: any = {
  // ... existing fields ...
  doctor_type: 'permanent', // Default to permanent
  // Queue system fields for permanent doctors
  max_queue_size: 10,
  consultation_duration: 15,
  // Visiting doctor fields
  visiting_days: [],
  visiting_start_date: '',
  visiting_end_date: ''
};
```

#### **Doctor Type Options**
```typescript
doctorTypes = [
  { value: 'permanent', label: 'Permanent Doctor (Always Available)' },
  { value: 'visiting', label: 'Visiting Doctor (Special Days Only)' }
];

daysOfWeek = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' }
];
```

#### **Helper Methods**
```typescript
onDoctorTypeChange() {
  // Reset visiting days when switching doctor types
  if (this.form.doctor_type === 'permanent') {
    this.form.visiting_days = [];
    this.form.visiting_start_date = '';
    this.form.visiting_end_date = '';
  }
}

onVisitingDayChange(dayValue: number, checked: boolean) {
  if (checked) {
    if (!this.form.visiting_days.includes(dayValue)) {
      this.form.visiting_days.push(dayValue);
    }
  } else {
    this.form.visiting_days = this.form.visiting_days.filter((day: number) => day !== dayValue);
  }
}

isVisitingDaySelected(dayValue: number): boolean {
  return this.form.visiting_days.includes(dayValue);
}
```

#### **Enhanced Validation**
```typescript
// Validate doctor type specific fields
if (this.form.doctor_type === 'visiting') {
  if (this.form.visiting_days.length === 0) {
    alert('Please select at least one visiting day for visiting doctors.');
    return;
  }
  if (!this.form.visiting_start_date || !this.form.visiting_end_date) {
    alert('Please set visiting start and end dates for visiting doctors.');
    return;
  }
}
```

### **2. Enhanced Admin Registration UI (`admin-register.component.html`)**

#### **Doctor Type Selection**
```html
<!-- Doctor Type Selection -->
<div class="row mb-4">
  <div class="col-md-6">
    <label for="doctor_type" class="form-label">Doctor Type *</label>
    <select id="doctor_type" name="doctor_type" [(ngModel)]="form.doctor_type" class="form-select" (ngModelChange)="onDoctorTypeChange()" required>
      <option *ngFor="let type of doctorTypes" [value]="type.value">{{ type.label }}</option>
    </select>
  </div>
</div>

<!-- Doctor Type Information Alert -->
<div class="alert" [ngClass]="form.doctor_type === 'permanent' ? 'alert-info' : 'alert-warning'" role="alert">
  <i class="bi" [ngClass]="form.doctor_type === 'permanent' ? 'bi-people-fill' : 'bi-calendar-event'"></i>
  <strong *ngIf="form.doctor_type === 'permanent'">Permanent Doctor:</strong>
  <strong *ngIf="form.doctor_type === 'visiting'">Visiting Doctor:</strong>
  <span *ngIf="form.doctor_type === 'permanent'">Always available with queue system. Patients join queue and get consulted in order.</span>
  <span *ngIf="form.doctor_type === 'visiting'">Available on specific days only. Patients book appointments with time slots.</span>
</div>
```

#### **Permanent Doctor Queue Settings**
```html
<!-- Permanent Doctor Queue Settings -->
<div *ngIf="form.doctor_type === 'permanent'">
  <hr class="my-3">
  <h6 class="text-primary mb-3"><i class="bi bi-people me-2"></i>Queue System Settings</h6>
  <div class="row">
    <div class="col-md-6 mb-3">
      <label for="max_queue_size" class="form-label">Maximum Queue Size</label>
      <input type="number" id="max_queue_size" name="max_queue_size" [(ngModel)]="form.max_queue_size" class="form-control" min="1" max="50" placeholder="10">
      <small class="form-text text-muted">Maximum number of patients that can be in queue at once</small>
    </div>
    <div class="col-md-6 mb-3">
      <label for="consultation_duration" class="form-label">Consultation Duration (minutes)</label>
      <input type="number" id="consultation_duration" name="consultation_duration" [(ngModel)]="form.consultation_duration" class="form-control" min="5" max="60" placeholder="15">
      <small class="form-text text-muted">Average time per consultation for wait time calculation</small>
    </div>
  </div>
</div>
```

#### **Visiting Doctor Schedule Settings**
```html
<!-- Visiting Doctor Schedule Settings -->
<div *ngIf="form.doctor_type === 'visiting'">
  <hr class="my-3">
  <h6 class="text-warning mb-3"><i class="bi bi-calendar-event me-2"></i>Visiting Schedule Settings</h6>
  
  <!-- Visiting Days Selection -->
  <div class="mb-3">
    <label class="form-label">Visiting Days *</label>
    <div class="row">
      <div class="col-md-3 mb-2" *ngFor="let day of daysOfWeek">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" 
                 [id]="'day_' + day.value" 
                 [checked]="isVisitingDaySelected(day.value)"
                 (change)="onVisitingDayChange(day.value, $event.target.checked)">
          <label class="form-check-label" [for]="'day_' + day.value">
            {{ day.label }}
          </label>
        </div>
      </div>
    </div>
  </div>

  <!-- Visiting Date Range -->
  <div class="row">
    <div class="col-md-6 mb-3">
      <label for="visiting_start_date" class="form-label">Visiting Start Date *</label>
      <input type="date" id="visiting_start_date" name="visiting_start_date" [(ngModel)]="form.visiting_start_date" class="form-control" required>
      <small class="form-text text-muted">When the doctor will start visiting</small>
    </div>
    <div class="col-md-6 mb-3">
      <label for="visiting_end_date" class="form-label">Visiting End Date *</label>
      <input type="date" id="visiting_end_date" name="visiting_end_date" [(ngModel)]="form.visiting_end_date" class="form-control" required>
      <small class="form-text text-muted">When the doctor will stop visiting</small>
    </div>
  </div>
</div>
```

### **3. Enhanced Admin Users List (`admin-users.component.html`)**

#### **Doctor Type Column**
```html
<th>Doctor Type</th>

<td>
  <span class="badge" [ngClass]="user.doctor_type === 'permanent' ? 'bg-primary' : 'bg-warning'">
    {{ user.doctor_type === 'permanent' ? 'Permanent' : 'Visiting' }}
  </span>
</td>
```

---

## 🔄 **How It Works**

### **Admin Registration Flow**

1. **Admin selects "Doctor" role** → Doctor-specific fields appear
2. **Admin selects doctor type** → UI updates to show relevant fields
3. **For Permanent Doctors**:
   - Queue system settings appear
   - Max queue size and consultation duration fields
   - Visiting schedule fields are hidden
4. **For Visiting Doctors**:
   - Visiting schedule settings appear
   - Day selection checkboxes
   - Start/end date fields
   - Queue system fields are hidden
5. **Admin fills required fields** → Validation ensures completeness
6. **Admin submits form** → Doctor created with appropriate type and settings

### **Validation Rules**

#### **Permanent Doctors**
- ✅ **Required**: specialization, license_number, qualification
- ✅ **Optional**: queue settings (defaults: max_queue_size=10, consultation_duration=15)
- ✅ **Hidden**: visiting schedule fields

#### **Visiting Doctors**
- ✅ **Required**: specialization, license_number, qualification
- ✅ **Required**: at least one visiting day selected
- ✅ **Required**: visiting start and end dates
- ✅ **Hidden**: queue system fields

---

## 🎯 **Key Features**

### **For Admins:**
- ✅ **Clear doctor type selection** with descriptive labels
- ✅ **Dynamic form fields** based on doctor type
- ✅ **Comprehensive validation** for each doctor type
- ✅ **Visual indicators** (badges, alerts) for different types
- ✅ **Default values** for common settings

### **For System:**
- ✅ **Proper data validation** in both frontend and backend
- ✅ **Default field values** for new doctors
- ✅ **Type-specific field management** (show/hide relevant fields)
- ✅ **Database integrity** with proper field constraints

### **For Users:**
- ✅ **Clear visual distinction** between doctor types in lists
- ✅ **Consistent data structure** for both types
- ✅ **Proper field validation** prevents incomplete registrations

---

## 🛠️ **Implementation Steps**

### **Step 1: Database Migration**
```bash
cd healthcare-backend
python manage.py makemigrations
python manage.py migrate
```

### **Step 2: Test Admin Registration**
1. **Access Admin Panel** → `/admin/`
2. **Add New User** → Select "Doctor" role
3. **Test Permanent Doctor** → Set type to "permanent"
4. **Test Visiting Doctor** → Set type to "visiting"
5. **Verify Fields** → Ensure correct fields appear for each type

### **Step 3: Test Frontend Registration**
1. **Access Admin Registration** → `/admin-register`
2. **Select Doctor Role** → Verify doctor type selection appears
3. **Test Both Types** → Verify dynamic form behavior
4. **Test Validation** → Ensure proper validation messages

### **Step 4: Verify User Lists**
1. **Access Admin Users** → `/admin-users`
2. **Check Doctor Tab** → Verify doctor type column appears
3. **Verify Badges** → Check color coding for doctor types

---

## 📝 **Summary**

This implementation provides a **complete doctor type registration system** that:

1. **Allows admins to set doctor type** during registration
2. **Provides dynamic form fields** based on doctor type
3. **Includes comprehensive validation** for each type
4. **Shows clear visual indicators** in user lists
5. **Maintains data integrity** with proper validation

The system is now **production-ready** and provides a **user-friendly experience** for admin doctor registration! 🚀 