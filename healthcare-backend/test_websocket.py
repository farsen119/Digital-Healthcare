import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8000/ws/doctor-status/"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket successfully!")
            
            # Send a test message
            test_message = {
                "type": "doctor_status_update",
                "doctor_id": 1,
                "is_live": True
            }
            
            await websocket.send(json.dumps(test_message))
            print("📤 Sent test message:", test_message)
            
            # Wait for response
            response = await websocket.recv()
            print(f"📨 Received response: {response}")
            
            # Parse response
            response_data = json.loads(response)
            if response_data.get('type') == 'doctor_status_change':
                print("🎉 WebSocket is working correctly!")
                print(f"Doctor {response_data.get('doctor_id')} status: {response_data.get('is_live')}")
            else:
                print("⚠️ Unexpected response format")
                
    except websockets.exceptions.ConnectionRefused:
        print("❌ Connection refused. Make sure the server is running with daphne:")
        print("   daphne healthcare.asgi:application -b 0.0.0.0 -p 8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🧪 Testing WebSocket Connection...")
    asyncio.run(test_websocket()) 