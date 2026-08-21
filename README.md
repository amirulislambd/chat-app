# Real-Time Chat App

A robust, real-time chat application built with Next.js, Socket.IO, and Tailwind CSS. Features include direct messaging, group chats, typing indicators, read receipts, offline message queueing, and a global dark mode.

## Setup Instructions

### Prerequisites
- Node.js 18+ and `npm` or `pnpm` installed.

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd chat-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Variables**:
   Copy the example environment file and fill in the required variables (default backend values are provided):
   ```bash
   cp .env.example .env.local
   ```
   **Required Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: The base URL for the backend API.
   - `NEXT_PUBLIC_SOCKET_URL`: The base URL for the Socket.IO server.

### Running the App

Start the development server:
```bash
npm run dev
# or
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Deployment (Vercel)

1. Connect your repository to Vercel.
2. In the Vercel project settings, ensure you add the Environment Variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SOCKET_URL`
3. Deploy!

