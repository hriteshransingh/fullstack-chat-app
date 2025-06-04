
# 💬 YoChatt - Real-Time Chat Application  

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
npm start
```
