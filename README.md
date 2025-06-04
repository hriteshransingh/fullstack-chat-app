# 💬 YoChatt - Real-Time Encrypted Chat Application  

A feature-rich real-time chat app with typing indicators, image sharing, theme customization, and **end-to-end encryption**. Built using modern web technologies for secure, seamless communication.

---

## 🚀 Tech Stack & Features

### 🌟 Tech Stack
- **MERN Stack**  
  - MongoDB  
  - Express.js  
  - React  
  - Node.js  
- **Socket.io** for real-time communication  
- **TailwindCSS + DaisyUI** for modern, responsive UI  
- **Zustand** for lightweight and efficient state management  
- **libsodium** for modern cryptography (XChaCha20-Poly1305, Argon2id)  
- **Render** for deployment  

---

### 🔐 Authentication & Authorization  
- JWT-based login and session management  
- Protected routes and role-based access control  

---

### 💬 Real-Time Features  
- Instant messaging with Socket.io  
- Real-time typing indicators  
- Online/offline user status tracking  
- Image sharing with preview support  
- Multi-theme (light/dark/custom) user interface  

---

### 🔐 End-to-End Encryption (E2EE)

> Messages are encrypted before they leave the client and decrypted only by the recipient.

- Each conversation uses a **unique symmetric key**  
- The conversation key is **encrypted with each user's public key**  
- Messages are encrypted using **XChaCha20-Poly1305**  
- The conversation key is **decrypted on the client only** using the user's private key  
- User’s private key is **encrypted with their password** using **Argon2id**  
- All decrypted keys are securely stored in **IndexedDB**  
- **Zero-knowledge design** — even the server can’t decrypt your data  

✅ Ensures **complete privacy and forward secrecy** in one-to-one conversations.

---

### 🖼️ Media Handling  
- Cloudinary integration for secure and scalable image uploads  
- Real-time image sharing and previews in chat  
- Optimized media delivery  

---

### ⚠️ Error Handling  
- Client- and server-side input validation  
- Toast feedback for all critical actions  
- Automatic reconnect support for real-time messaging  

---

### 🌐 Deployment  
- Fully deployed and production-ready using Render  
- Frontend built with Vite for blazing-fast performance  

---

## 🛠️ Setup `.env` file

Before running the project, create a `.env` file in the root directory and add the following:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

NODE_ENV=development



## ⚙️ Build the App
```
npm run build
```


## 🚀 Start the App
```
npm start
```





