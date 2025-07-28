# 🚀 Real-Time Doctor Status WebSocket Setup Guide

## 📋 Overview
This guide will help you set up the real-time doctor status system using WebSockets. When a doctor toggles their online/offline status, it will update everywhere instantly without page refresh.

## 🔧 Backend Setup

### 1. Install Required Packages
```bash
cd healthcare-backend
pip install channels
```

### 2. Database Migration
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Run Django with ASGI Server
```bash
# Install Daphne (ASGI server)
pip install daphne

# Run the server
daphne healthcare.asgi:application -b 0.0.0.0 -p 8000
```

## 🎯 How It Works

### Doctor Dashboard
- **Toggle Button**: Doctor clicks online/offline toggle
- **REST API**: Updates status in database
- **WebSocket**: Broadcasts status change to all connected clients
- **Real-time Updates**: Admin dashboard and sidebars update instantly

### Admin Dashboard
- **Live Status Monitor**: Shows all doctors with real-time status
- **Connection Indicator**: Shows WebSocket connection status
- **Manual Refresh**: Button to refresh data if needed

### Sidebar Updates
- **Status Dot**: Shows online/offline status with color
- **Real-time Updates**: Status changes without page refresh

## 🔄 WebSocket Flow

1. **Doctor Toggles Status** → REST API updates database
2. **Backend Broadcasts** → WebSocket sends to all clients
3. **Frontend Receives** → Updates UI instantly
4. **Admin Sees Changes** → Real-time monitoring

## 🧪 Testing

### Test Script
Create `test_websocket.py` in healthcare-backend:

```python
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8000/ws/doctor-status/"
    
    async with websockets.connect(uri) as websocket:
        print("✅ Connected to WebSocket")
        
        # Send a test message
        test_message = {
            "type": "doctor_status_update",
            "doctor_id": 1,
            "is_live": True
        }
        
        await websocket.send(json.dumps(test_message))
        print("📤 Sent test message")
        
        # Wait for response
        response = await websocket.recv()
        print(f"📨 Received: {response}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
```

### Run Test
```bash
cd healthcare-backend
python test_websocket.py
```

## 🎉 Features Implemented

### ✅ Backend
- Django Channels WebSocket consumer
- Real-time status broadcasting
- Consultation hours logic
- Database persistence

### ✅ Frontend
- WebSocket service with reconnection
- Real-time status updates
- Admin dashboard monitoring
- Sidebar status indicators

### ✅ Real-time Updates
- Doctor dashboard toggle
- Admin dashboard monitoring
- Sidebar status dots
- Connection status indicators

## 🚨 Troubleshooting

### WebSocket Connection Issues
1. **Check ASGI Server**: Make sure using `daphne` not `runserver`
2. **Port Issues**: Ensure port 8000 is available
3. **CORS**: Check if CORS is blocking WebSocket connections

### Status Not Updating
1. **Check Console**: Look for WebSocket connection logs
2. **Database**: Verify `is_live` field exists
3. **Permissions**: Ensure doctor can update their own status

### Admin Dashboard Issues
1. **User Service**: Check if `getUsers()` returns doctor data
2. **WebSocket Service**: Verify connection status
3. **Component Lifecycle**: Check subscription cleanup

## 🎯 Expected Behavior

1. **Doctor logs in** → Sidebar shows offline status
2. **Doctor toggles online** → Status updates everywhere instantly
3. **Admin dashboard** → Shows doctor as online in real-time
4. **Other doctors** → Can see status changes
5. **Patients** → Can see available doctors

## 🔧 Configuration Files

### Backend Files Modified:
- `healthcare/settings.py` - Added Channels configuration
- `healthcare/asgi.py` - WebSocket routing
- `users/consumers.py` - WebSocket consumer
- `users/routing.py` - WebSocket URLs
- `users/views.py` - Status update logic

### Frontend Files Modified:
- `websocket.service.ts` - WebSocket service
- `doctor-dashboard.component.ts` - Real-time updates
- `admin-dashboard.component.ts` - Status monitoring
- `side-navbar.component.ts` - Status display

## 🎉 Success Indicators

- ✅ WebSocket connects without errors
- ✅ Doctor toggle updates status instantly
- ✅ Admin dashboard shows real-time updates
- ✅ Sidebar status dots change color
- ✅ No page refresh needed for updates

## 🚀 Next Steps

1. Install `channels` package
2. Run migrations
3. Start server with `daphne`
4. Test doctor status toggle
5. Verify admin dashboard updates
6. Check sidebar status indicators

**Your real-time doctor status system is ready! 🎉** 