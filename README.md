
# 💬 YoChatt - Real-Time Encrypted Chat Application  

A feature-rich real-time chat app with multiple themes, typing indicators, and responsive design. Built with modern web technologies for seamless communication.

## 🚀 Tech Stack & Features

### 🌟 Tech Stack
- **MERN Stack**  
  - MongoDB  
  - Express.js  
  - React  
  - Node.js  
- **Socket.io** for real-time communication  
- **TailwindCSS + DaisyUI** for modern UI  
- **Zustand** for lightweight and efficient global state management  

### 🔐 Authentication & Authorization  
- JWT-based authentication  
- Role-based access control  
- Protected routes  

### 💬 Real-Time Features  
- Instant messaging with Socket.io  
- Real-time online user status tracking  
- Typing indicators for active conversations  
- Image uploads and real-time previews

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




### 🖼️ Media Handling  
- Cloudinary integration for secure image storage  
- Real-time photo sharing with preview  
- Optimized media loading  

###   Error Handling  
- Comprehensive error handling on server and client  
- User-friendly validation and feedback  

### 🌐 Deployment  
- Fully deployed and production-ready  



## 🛠️ Setup .env file

Before running the project, create a `.env` file in the root directory and add the following:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

NODE_ENV=development
```


## ⚙️ Build the App
```
npm run build
```


## 🚀 Start the App
```
npm run start
```
