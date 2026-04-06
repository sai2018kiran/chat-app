# Adverayze Real-Time Chat Application

## Project Overview
This is a full-stack real-time chat application built as part of the Adverayze hiring process. It allows users to send and receive messages in real-time, pin important messages, and delete messages either solely for themselves or for everyone in the chat room.

## Setup Instructions

### Prerequisites
- Node.js (v18.x or v20.x recommended)
- MongoDB instance running locally (port 27017) or a MongoDB Atlas URI.

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. (Optional) Provide a `.env` file with your `MONGODB_URI` if you aren't using a local instance on default port:
   ```bash
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.net/chat
   ```
4. Start the node server:
   ```bash
   npm start
   ```
   *The backend will run on `http://localhost:3001`.*

### 2. Frontend Setup
1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`.*

## Approach and Design Decisions
- **Monorepo-style structure**: Split into `frontend/` and `backend/`.
- **Frontend Stack**: 
  - **React.js + Vite**: Fast compilation and component handling.
  - **Vanilla CSS**: Extensively customized highly-aesthetic styling utilizing modern glassmorphism and gradient patterns without relying on Tailwind CSS.
  - **Socket.io-client**: Synchronizes all live chat events smoothly without polling.
- **Backend Stack**:
  - **Express.js + Socket.io**: For robust and scalable live messaging connections.
  - **MongoDB (Mongoose)**: Highly-portable NO-SQL architecture, fulfilling database requirements gracefully.

## Tradeoffs and Assumptions
- **Authentication**: To fulfill "Delete for Me" and "Delete for Everyone" identity checks instantly, I simulate unique users using a randomized ID persisted in the client's `localStorage` on first load. This guarantees real-time features testability without creating unnecessary bottlenecks like user registration flow.

## API Documentation

| Method | Endpoint                    | Description                                                                 | Payload / Query Params                               |
|--------|-----------------------------|-----------------------------------------------------------------------------|-------------------------------------------------------|
| GET    | `/api/messages`             | Fetch all chat messages.                                                    | None                                                  |
| POST   | `/api/messages`             | Send a new message.                                                         | JSON: `{ "content": "Hello", "senderId": "123" }`     |
| DELETE | `/api/messages/:id`         | Delete a message for a user or for everyone.                                | Query: `?type=me&userId=123` or `?type=everyone&...` |
| PATCH  | `/api/messages/:id/pin`     | Toggle the pin status of a message.                                         | JSON: `{ "isPinned": true }`                          |

---
