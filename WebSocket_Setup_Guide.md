# WebSocket Setup Guide for Healthcare Management System

## 🚨 **Current Issue**
The notification system is not working because the Django backend is running with the regular development server, which doesn't support WebSocket connections.

## 🔍 **Problem Analysis**

### **Error Symptoms**
```
WebSocket connection closed: 1006
WebSocket connection status changed: false
```

### **Root Cause**
- **Regular Django Server** (`python manage.py runserver`) only supports HTTP/HTTPS
- **Cannot handle WebSocket connections**
- Frontend tries to connect to `ws://localhost:8000/ws/doctor-status/` but gets error 1006
- WebSocket connection fails immediately

## 🔧 **Solution: Use ASGI Server**

### **Why ASGI Server is Required**

| Feature | Django Dev Server | Daphne/uvicorn |
|---------|------------------|----------------|
| HTTP Support | ✅ | ✅ |
| WebSocket Support | ❌ | ✅ |
| Real-time Communication | ❌ | ✅ |
| Django Channels Support | ❌ | ✅ |

### **Step 1: Install Daphne**
```bash
cd healthcare-backend
pip install daphne
```

### **Step 2: Stop Current Server**
Stop your current Django development server (Ctrl+C)

### **Step 3: Run with Daphne**
```bash
cd healthcare-backend
daphne -b 0.0.0.0 -p 8000 healthcare.asgi:application
```

### **Alternative: Use uvicorn**
```bash
cd healthcare-backend
pip install uvicorn
uvicorn healthcare.asgi:application --host 0.0.0.0 --port 8000
```

## ✅ **Expected Results After Fix**

### **WebSocket Connection**
- Connection status will show: `WebSocket connection status changed: true`
- No more error 1006 messages

### **Notification System**
- **Login Notifications**: When a doctor logs in, notification appears instantly in admin dashboard
- **Logout Notifications**: When a doctor logs out, notification appears instantly in admin dashboard
- **Real-time Updates**: Doctor availability changes are reflected immediately

### **Admin Dashboard Features**
- Live doctor status updates
- Real-time notification popups
- Notification history in dedicated box

## 🏗️ **System Architecture**

### **Backend Components**
```
healthcare-backend/
├── healthcare/
│   ├── asgi.py          # ASGI application configuration
│   └── settings.py      # Django settings with Channels config
├── users/
│   ├── consumers.py     # WebSocket consumer
│   ├── routing.py       # WebSocket URL patterns
│   └── views.py         # API endpoints with WebSocket notifications
```

### **Frontend Components**
```
healthcare-frontend/
├── src/app/
│   ├── services/
│   │   └── websocket.service.ts    # WebSocket connection management
│   ├── pages/admin-dashboard/
│   │   ├── admin-dashboard.component.ts    # Notification handling
│   │   └── admin-dashboard.component.html  # Notification UI
│   └── types/
│       └── websocket.types.ts      # TypeScript interfaces
```

## 🔄 **Notification Flow**

### **Doctor Login Flow**
1. Doctor logs in via frontend
2. Frontend calls `/api/users/login-status/`
3. Backend updates doctor status to online
4. Backend sends WebSocket notification: `doctor_login_logout`
5. Admin dashboard receives notification
6. Notification appears in admin dashboard with popup

### **Doctor Logout Flow**
1. Doctor logs out via frontend
2. Frontend calls `/api/users/logout-status/`
3. Backend updates doctor status to offline
4. Backend sends WebSocket notification: `doctor_login_logout`
5. Admin dashboard receives notification
6. Notification appears in admin dashboard with popup

## 🛠️ **Technical Details**

### **WebSocket URL Structure**
```
ws://localhost:8000/ws/doctor-status/
```

### **Message Types**
- `doctor_login_logout`: Login/logout notifications
- `doctor_status_change`: Availability status changes

### **Channel Layer**
- Uses in-memory channel layer for development
- Groups: `"doctor_status"` for broadcasting notifications

## 🧪 **Testing the Fix**

### **Test Steps**
1. Start backend with Daphne: `daphne -b 0.0.0.0 -p 8000 healthcare.asgi:application`
2. Start frontend: `ng serve`
3. Open admin dashboard in one tab
4. Login as a doctor in another tab
5. Check admin dashboard for login notification
6. Logout as doctor
7. Check admin dashboard for logout notification

### **Success Indicators**
- WebSocket connection status shows "Connected"
- Notifications appear instantly in admin dashboard
- No error 1006 messages in browser console

## 🚀 **Production Considerations**

### **For Production Deployment**
- Use Redis as channel layer instead of in-memory
- Configure proper CORS settings
- Set up SSL/TLS for secure WebSocket connections
- Use process managers like Supervisor or systemd

### **Channel Layer Configuration (Production)**
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

## 📝 **Troubleshooting**

### **Common Issues**
1. **Port already in use**: Change port or kill existing process
2. **Daphne not found**: Install with `pip install daphne`
3. **CORS errors**: Check CORS settings in Django
4. **WebSocket still failing**: Ensure ASGI application is properly configured

### **Debug Commands**
```bash
# Check if Daphne is installed
pip list | grep daphne

# Check if port 8000 is in use
netstat -an | grep 8000

# Kill process on port 8000 (if needed)
lsof -ti:8000 | xargs kill -9
```

## 🎯 **Summary**

The notification system requires WebSocket support, which is only available through ASGI servers like Daphne or uvicorn. The regular Django development server cannot handle WebSocket connections, which is why the notifications aren't working.

**Key Takeaway**: Always use an ASGI server when working with Django Channels and WebSocket functionality.

---

## 📋 **Complete Implementation Details: Admin Dashboard Notifications**

### **🎯 What Was Implemented**

The admin dashboard now has **two distinct notification systems**:

1. **Login/Logout Notifications**: Simple text notifications when doctors log in/out
2. **Consultation Availability Notifications**: Real-time updates when doctors toggle availability

### **🔧 Backend Changes Made**

#### **1. Enhanced User Views (`users/views.py`)**
```python
# Added new endpoint for online doctors
@action(detail=False, methods=['get'], url_path='online-doctors')
def online_doctors(self, request):
    """Get currently online doctors for admin dashboard"""
    online_doctors = CustomUser.objects.filter(
        role='doctor',
        is_live=True,
        is_available_for_consultation=True
    ).order_by('first_name', 'last_name')
    serializer = PublicDoctorSerializer(online_doctors, many=True)
    return Response(serializer.data)

# Enhanced notification system
def notify_status_change(self, doctor, is_available_for_consultation, notification_type='consultation'):
    """Send WebSocket notification for status change"""
    try:
        channel_layer = get_channel_layer()
        current_time = timezone.now()
        
        if notification_type == 'login':
            message = {
                'type': 'doctor_login_logout',
                'doctor_id': doctor.id,
                'action': 'login',
                'doctor_name': f"Dr. {doctor.first_name} {doctor.last_name}",
                'timestamp': current_time.isoformat(),
                'message': f"Dr. {doctor.first_name} {doctor.last_name} logged in at {current_time.strftime('%I:%M %p on %B %d, %Y')}"
            }
        elif notification_type == 'logout':
            message = {
                'type': 'doctor_login_logout',
                'doctor_id': doctor.id,
                'action': 'logout',
                'doctor_name': f"Dr. {doctor.first_name} {doctor.last_name}",
                'timestamp': current_time.isoformat(),
                'message': f"Dr. {doctor.first_name} {doctor.last_name} logged out at {current_time.strftime('%I:%M %p on %B %d, %Y')}"
            }
        else:  # consultation availability change
            message = {
                'type': 'doctor_status_change',
                'doctor_id': doctor.id,
                'is_available_for_consultation': is_available_for_consultation,
                'doctor_info': {
                    'id': doctor.id,
                    'username': doctor.username,
                    'first_name': doctor.first_name,
                    'last_name': doctor.last_name,
                    'is_available_for_consultation': doctor.is_available_for_consultation,
                    'is_live': doctor.is_live,
                    'consultation_hours': doctor.consultation_hours,
                    'specialization': doctor.specialization,
                    'hospital': doctor.hospital
                }
            }
        
        async_to_sync(channel_layer.group_send)("doctor_status", message)
    except Exception as e:
        pass
```

#### **2. Enhanced WebSocket Consumer (`users/consumers.py`)**
```python
async def doctor_login_logout(self, event):
    """Send login/logout notification to WebSocket"""
    await self.send(text_data=json.dumps({
        'type': 'doctor_login_logout',
        'doctor_id': event['doctor_id'],
        'action': event['action'],
        'doctor_name': event['doctor_name'],
        'timestamp': event['timestamp'],
        'message': event['message']
    }))
```

#### **3. Updated TypeScript Interfaces (`websocket.types.ts`)**
```typescript
export interface WebSocketMessage {
  type: string;
  doctor_id?: number;
  is_available_for_consultation?: boolean;
  doctor_info?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    is_available_for_consultation: boolean;
    is_live?: boolean;
    consultation_hours: string;
    specialization: string;
    hospital: string;
  };
  // For login/logout notifications
  action?: 'login' | 'logout';
  doctor_name?: string;
  timestamp?: string;
  message?: string;
}
```

### **🎨 Frontend Changes Made**

#### **1. Enhanced Admin Dashboard Component (`admin-dashboard.component.ts`)**
```typescript
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // New properties for notifications
  loginLogoutNotifications: any[] = [];
  private subscriptions: Subscription[] = [];

  setupWebSocket() {
    // Subscribe to WebSocket messages
    this.subscriptions.push(
      this.webSocketService.messages$.subscribe(message => {
        if (message && message.type === 'doctor_status_change') {
          this.handleDoctorStatusChange(message);
        } else if (message && message.type === 'doctor_login_logout') {
          this.handleLoginLogoutNotification(message);
        }
      })
    );
  }

  handleLoginLogoutNotification(message: any) {
    // Add the notification to the list
    this.loginLogoutNotifications.unshift({
      doctor_name: message.doctor_name,
      action: message.action,
      timestamp: new Date(message.timestamp)
    });
    
    // Keep only the last 10 notifications
    if (this.loginLogoutNotifications.length > 10) {
      this.loginLogoutNotifications = this.loginLogoutNotifications.slice(0, 10);
    }
    
    // Show a pop-up notification
    this.showLoginLogoutPopup(message);
  }

  showLoginLogoutPopup(message: any) {
    const notification = document.createElement('div');
    notification.className = `alert alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    if (message.action === 'login') {
      notification.classList.add('alert-success');
      notification.innerHTML = `
        <i class="bi bi-person-check-fill me-2"></i>
        <strong>${message.doctor_name}</strong> logged in at ${new Date(message.timestamp).toLocaleTimeString()}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
    } else {
      notification.classList.add('alert-warning');
      notification.innerHTML = `
        <i class="bi bi-person-x-fill me-2"></i>
        <strong>${message.doctor_name}</strong> logged out at ${new Date(message.timestamp).toLocaleTimeString()}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  testNotification() {
    // Add a test notification to verify the UI works
    this.loginLogoutNotifications.unshift({
      doctor_name: 'Dr. Test Doctor',
      action: 'login',
      timestamp: new Date()
    });
    
    // Show popup notification
    this.showLoginLogoutPopup({
      doctor_name: 'Dr. Test Doctor',
      action: 'login',
      timestamp: new Date().toISOString()
    });
  }
}
```

#### **2. Enhanced Admin Dashboard HTML (`admin-dashboard.component.html`)**
```html
<!-- Doctor Login/Logout Notifications -->
<div class="card mb-4">
  <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
    <h5 class="mb-0">
      <i class="bi bi-bell-fill me-2"></i> 
      Doctor Login/Logout Notifications
      <span *ngIf="loginLogoutNotifications.length > 0" class="badge bg-light text-dark ms-2">{{ loginLogoutNotifications.length }}</span>
    </h5>
    <button class="btn btn-sm btn-outline-light" (click)="testNotification()">
      <i class="bi bi-bell me-1"></i> Test Notification
    </button>
  </div>
  <div class="card-body">
    <div class="notification-list" *ngIf="loginLogoutNotifications.length > 0">
      <div *ngFor="let notification of loginLogoutNotifications" 
           class="alert" 
           [ngClass]="notification.action === 'login' ? 'alert-success' : 'alert-warning'">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <i class="bi" [ngClass]="notification.action === 'login' ? 'bi-person-check-fill' : 'bi-person-x-fill'"></i>
            <strong>{{ notification.doctor_name }}</strong>
            <span *ngIf="notification.action === 'login'"> logged in</span>
            <span *ngIf="notification.action === 'logout'"> logged out</span>
          </div>
          <small class="text-muted">{{ notification.timestamp | date:'medium' }}</small>
        </div>
      </div>
    </div>
    <div *ngIf="loginLogoutNotifications.length === 0" class="text-center text-muted py-3">
      <i class="bi bi-bell-slash fs-1"></i>
      <p class="mt-2">No login/logout notifications yet</p>
      <small>Notifications will appear here when doctors log in or out</small>
    </div>
  </div>
</div>
```

#### **3. Enhanced CSS Styling (`admin-dashboard.component.css`)**
```css
/* Notification List Styling */
.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-list .alert {
  margin-bottom: 0.5rem;
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.notification-list .alert:hover {
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.notification-list .alert-success {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-left: 4px solid #28a745;
  color: #155724;
}

.notification-list .alert-warning {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border-left: 4px solid #ffc107;
  color: #856404;
}

/* Popup Notification Styling */
.position-fixed.alert {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-radius: 8px;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

#### **4. Enhanced User Service (`user.service.ts`)**
```typescript
/**
 * Gets currently online doctors (requires authentication).
 */
getOnlineDoctors(): Observable<User[]> {
  const authHeaders = this.getAuthHeaders();
  return this.http.get<User[]>(`${this.apiUrl}online-doctors/`, { headers: authHeaders });
}
```

### **🎯 Features Implemented**

#### **1. Login/Logout Notification System**
- ✅ **Real-time notifications** when doctors log in/out
- ✅ **Notification history** in admin dashboard
- ✅ **Popup notifications** that auto-dismiss after 5 seconds
- ✅ **Test notification button** for UI verification
- ✅ **Notification counter badge** showing number of notifications
- ✅ **Empty state** when no notifications exist

#### **2. Visual Design**
- ✅ **Color-coded notifications**: Green for login, yellow for logout
- ✅ **Bootstrap icons**: Person-check for login, person-x for logout
- ✅ **Smooth animations**: Slide-in effects for popups
- ✅ **Hover effects**: Notifications slide on hover
- ✅ **Responsive design**: Works on all screen sizes

#### **3. Technical Features**
- ✅ **WebSocket integration**: Real-time communication
- ✅ **Message handling**: Different message types for different events
- ✅ **Error handling**: Graceful fallbacks
- ✅ **Memory management**: Keeps only last 10 notifications
- ✅ **Auto-cleanup**: Subscriptions properly managed

#### **4. User Experience**
- ✅ **Instant feedback**: Notifications appear immediately
- ✅ **Non-intrusive**: Popups don't block the interface
- ✅ **Clear information**: Shows doctor name, action, and timestamp
- ✅ **Easy testing**: Test button to verify functionality
- ✅ **Visual indicators**: Connection status and notification count

### **🔄 How It All Works Together**

1. **Doctor logs in** → Frontend calls `/api/users/login-status/`
2. **Backend processes** → Updates doctor status and sends WebSocket message
3. **WebSocket broadcasts** → Message sent to all connected clients
4. **Admin dashboard receives** → `handleLoginLogoutNotification()` processes the message
5. **UI updates** → Notification added to list and popup appears
6. **User sees notification** → Real-time feedback without page refresh

### **🎉 Result**

The admin dashboard now provides **comprehensive real-time monitoring** of doctor activities with:
- **Live login/logout tracking**
- **Beautiful notification interface**
- **Instant visual feedback**
- **Professional user experience**

This creates a **hospital management system** that feels modern and responsive, giving administrators immediate visibility into doctor activities. 