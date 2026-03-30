# 🎥 LAN WebRTC Video Call (Mesh Architecture)

A real-time peer-to-peer video calling application built using **WebRTC**, **React**, and **Socket.IO**, designed to work seamlessly over a **local network (LAN)**.

---

## 🚀 Features

* 🔗 Peer-to-peer video & audio streaming (WebRTC)
* 🧑‍🤝‍🧑 Multi-user room support
* ⚡ Real-time signaling using Socket.IO
* 🎯 Automatic peer discovery within a room
* 📡 ICE candidate handling with STUN server
* 🧠 Optimized connection handling (no duplicate peers)
* 🔄 Clean disconnect handling
* 🖥️ Works across multiple devices on the same WiFi

---

## 🏗️ Architecture Overview

### 🔹 Signaling (Backend)

* Built with Node.js + Express + Socket.IO
* Handles:

  * Room joining
  * Offer/Answer exchange
  * ICE candidate forwarding

### 🔹 Media (Frontend)

* Built with React
* Uses WebRTC (`RTCPeerConnection`) for:

  * Direct peer-to-peer video/audio streaming

---

## 📡 How It Works

1. User joins a room
2. Server sends list of existing users
3. WebRTC handshake begins:

   * Offer → Answer → ICE Candidates
4. Direct P2P connection established
5. Media streams flow directly between peers

```
Client A  --->  Server  --->  Client B
   (offer/answer/ICE via Socket.IO)

Client A  <====== WebRTC P2P ======>  Client B
         (video/audio stream)
```

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* WebRTC API
* Socket.IO Client

### Backend

* Node.js
* Express
* Socket.IO

---

## 📁 Project Structure

```
project-root/
│
├── backend/
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── src/
│   │   └── App.jsx
│   └── .env
│
└── README.md
```

---

## ⚙️ Setup Instructions

### 🔹 1. Clone the Repository

```bash
git clone <your-repo-url>
cd project-root
```

---

### 🔹 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```
PUBLIC_IP=192.168.1.X
```

Run server:

```bash
node index.js
```

---

### 🔹 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:

```
VITE_PUBLIC_IP=192.168.1.X
```

Run frontend:

```bash
npm run dev
```

---

## 🌐 Running the App

On **both devices (same WiFi)** open:

```
http://<SERVER_IP>:5173
```

Example:

```
http://192.168.1.7:5173
```

---

## ⚠️ Important Notes

### 🔥 Use HTTP (Recommended for LAN)

* No certificate issues
* Works instantly across devices
* Best for development

---

### 🔥 Same Network Required

* All devices must be on the same WiFi/LAN

---

### 🔥 Do NOT Use `localhost`

Use:

```
http://192.168.x.x:5173
```

NOT:

```
http://localhost:5173
```

---

## 🔐 HTTPS & Certificate Setup (Optional)

This project supports HTTPS but requires certificate configuration.

### ⚠️ Problem

Self-signed certificates are not trusted by browsers → causes:

* WebSocket (`wss://`) failures
* Connection errors between devices

---

### ✅ Option 1: Temporary Fix

Open in browser:

```
https://<SERVER_IP>:5000
```

Then click:

* Advanced → Proceed anyway

⚠️ Must be done on every device

---

### ✅ Option 2: Permanent Fix (Windows)

1. Press `Win + R` → type `mmc`
2. Add **Certificates snap-in**
3. Go to:

   ```
   Trusted Root Certification Authorities
   ```
4. Import your certificate (`.pem` / `.crt`)

---

### 🚀 Recommended Tool

Use **mkcert**:

```bash
mkcert -install
mkcert 192.168.1.7
```

---

### ⚠️ Important

* Certificate must match IP exactly
* All devices must trust it

---

## 🧠 Key Implementation Details

### ✅ Peer Management

* One `RTCPeerConnection` per user
* Stored using `useRef` to avoid re-renders

---

### ✅ ICE Candidate Queue

* Handles race conditions
* Prevents `Unknown ufrag` errors

---

### ✅ Room Management

* Backend uses `Set` to avoid duplicates

---

## 🐛 Common Issues & Fixes

---

### ❌ WebSocket connection failed

**Fix:**

* Use HTTP instead of HTTPS
* Check firewall (port 5000)

---

### ❌ No video on second device

**Fix:**

* Use same IP on both devices
* Check camera permissions

---

### ❌ ICE / Unknown ufrag error

**Fix:**

* Ensure only one peer per user
* Use ICE queue (already implemented)

---

### ❌ Cannot connect from second laptop

**Fix:**

* Check firewall settings
* Ensure backend IP is accessible

---

## 📉 Limitations

This project uses **Mesh Topology**:

| Users | Connections per user |
| ----- | -------------------- |
| 2     | 1                    |
| 4     | 3                    |
| 6     | 5                    |
| 8     | 7                    |

⚠️ Performance degrades after ~6 users

---

## 🔮 Future Improvements

* 🔁 Add TURN server (for internet usage)
* 🧱 Move to SFU (e.g., mediasoup)
* 🎙️ Mute / Unmute controls
* 🖥️ Screen sharing
* 🧑‍💼 Authentication system
* 📹 Recording support

---

## 👨‍💻 Author

**Shreyash Sawant**

---

## 📜 License

This project is for educational purposes.
