const WebSocket = require('ws');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUwNTc2MjY1LCJpYXQiOjE3NTA1NzI2NjUsImp0aSI6Ijg4NzZmMDVlZGJhZjQ2YjE5MGMzNmViZDBhZjBmOTc1IiwidXNlcl9pZCI6OX0.GliCHxzBv17pr1DcvT9T58X8YQKgBT4zIphoDeg7pRQ";
const wsUrl = `ws://localhost:8000/ws/debate/4/?token=${token}`;

console.log('Connecting to:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', function open() {
  console.log('WebSocket connected!');
  
  // Send a test message
  setTimeout(() => {
    const message = {
      type: 'chat_message',
      content: 'Hello from WebSocket test!'
    };
    console.log('Sending message:', message);
    ws.send(JSON.stringify(message));
  }, 1000);
});

ws.on('message', function message(data) {
  console.log('Received:', JSON.parse(data.toString()));
});

ws.on('close', function close(code, reason) {
  console.log('WebSocket closed:', code, reason.toString());
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err.message);
});

// Keep the script running for a few seconds
setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);
