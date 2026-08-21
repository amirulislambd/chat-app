# ChatApp

ChatApp is a responsive real-time messaging client built with Next.js and TypeScript. It supports direct conversations, group conversations, live message delivery, typing indicators, read-status updates, offline message queueing, replies, profile popovers, and light/dark themes.

The application is designed around a simple workflow: authenticate with a phone number, find or create a conversation, select it from the sidebar, and exchange messages without refreshing the page.

## Features

- Phone-and-name login with automatic registration for new phone numbers.
- JWT authentication persisted in `localStorage`.
- Direct conversations with duplicate-conversation detection.
- Group creation with a name and selected participants.
- Group member management for group administrators.
- Debounced user search for starting chats and adding members.
- Message history loaded from the REST API.
- Real-time incoming messages through Socket.IO.
- Typing indicators with start, stop, and resume behavior.
- Pending message queue when the browser is offline, with retry on reconnect.
- Optimistic message rendering with delivery and seen states.
- Reply-to-message support through a swipe gesture or pointer drag.
- Automatic scroll-to-latest behavior while preserving the user’s position when reading older messages.
- Conversation previews, relative timestamps, unread counts, loading states, empty states, and retryable errors.
- Responsive desktop/mobile layout with resizable conversation sidebar.
- Light/dark theme toggle.

## Technology

- **Next.js 16** with the App Router
- **React 19** and TypeScript
- **Tailwind CSS 4** for styling
- **Socket.IO Client** for real-time events
- **date-fns** for relative conversation timestamps
- **Zustand** is installed for lightweight state management as the app grows
- **Vercel**-compatible production build and deployment

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Installation

```bash
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_BASE_URL=https://frontend-task-chatapp.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://frontend-task-chatapp.onrender.com
```

`NEXT_PUBLIC_API_BASE_URL` is the REST API origin. `NEXT_PUBLIC_SOCKET_URL` is the root Socket.IO origin and must not include `/api`.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm start
```

| Script | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create and type-check the production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Application Flow

### 1. Authentication

The login page collects a phone number and display name. On submit, `src/lib/api.ts` sends `POST /auth/login`. The API returns a JWT and user object; `AuthProvider` stores both in `localStorage` and exposes them through `useAuth()`.

Protected chat pages wait for the persisted credentials. Users without a token are redirected to `/login`. A `401` or `403` from protected requests clears the session and sends the user back to login.

### 2. Conversation sidebar

`ConversationList` loads conversations with `GET /conversations`, sorts them by `updatedAt`, and displays the participant or group name, latest message preview, relative timestamp, and unread count.

Selecting a conversation passes the complete conversation object to the chat page and persists its ID in `localStorage`. The sidebar also listens for incoming messages so previews and unread counts update immediately.

### 3. Starting a direct chat

`NewChatModal` debounces search input by 300ms and calls `GET /users/search?q=...`. Selecting a user either opens an existing direct conversation or calls `POST /conversations` to create one.

### 4. Creating and managing groups

The group tab lets the user enter a group name and select multiple users. It calls:

```text
POST /conversations/group
{ "name": "Project Team", "participantIds": ["user-id"] }
```

The API returns a group identifier as `id`; the client normalizes it to `_id` before selecting the new conversation. Group admins can open the add-members action and call:

```text
POST /conversations/{conversationId}/participants
{ "userIds": ["user-id"] }
```

The backend enforces the admin rule. A `403 Forbidden` means the authenticated account is not an administrator of that group; the frontend cannot bypass this permission.

### 5. Loading messages

When a conversation is selected, the chat page calls `GET /conversations/{conversationId}/messages`. Messages are sorted oldest-first for display. Existing messages are treated as seen, while failures show an inline error and retry action.

### 6. Sending messages

`MessageInput` supports single-line Enter-to-send and Shift+Enter for a newline. Whitespace-only messages are rejected. Messages are rendered optimistically, then reconciled with the server response. If the browser is offline, a pending message is shown locally and retried after the socket reconnects.

## Real-Time Behavior

`src/lib/socket.ts` creates one Socket.IO client with manual connection control. After authentication, the JWT is sent in the handshake as `auth: { token }`.

| Event | Behavior |
|---|---|
| `message:new` | Adds messages to the open conversation or updates another conversation’s preview/unread count |
| `message:seen` | Updates the sender’s delivery state |
| `conversation:updated` | Intended for refreshing changed group metadata and membership |
| `typing:start` | Shows who is currently typing |
| `typing:stop` | Removes the typing indicator |
| `connect` | Refreshes the active message history after reconnecting |

Listeners are removed when their component or selected conversation changes to prevent duplicate handlers.

### Scroll behavior

- Opening a conversation jumps immediately to the newest message.
- A new message smoothly scrolls into view when the user is already near the bottom.
- When the user is reading older messages, the view stays in place instead of being forced downward.

## Project Structure

```text
src/
├── app/
│   ├── (auth)/login/page.tsx   # Login route
│   ├── (chat)/page.tsx         # Main protected chat route
│   ├── chat/page.tsx           # Chat route entry used by the app
│   ├── landing/page.tsx        # Product landing page
│   ├── layout.tsx              # Global providers and metadata
│   └── globals.css             # Global Tailwind/theme styles
├── components/
│   ├── ConversationList.tsx    # Sidebar and conversation selection
│   ├── MessageBubble.tsx       # Message rendering, status, replies, profile popover
│   ├── MessageInput.tsx        # Compose, typing, and offline queue behavior
│   ├── NewChatModal.tsx        # Direct chat, group creation, and member search
│   ├── TypingIndicator.tsx     # Live typing state
│   └── ...                     # Theme and offline UI components
├── lib/
│   ├── api.ts                  # Typed REST wrapper and ApiError handling
│   ├── auth-context.tsx        # Persisted user/JWT session
│   ├── socket.ts               # Shared Socket.IO client
│   └── theme-context.tsx       # Theme persistence and toggle
└── types/index.ts              # Shared User, Conversation, Message types
```

## API Contract

The REST client attaches `Authorization: Bearer <token>` to protected requests and converts non-2xx responses into `ApiError` objects with a status code, message, and optional response data. It also warns when responses do not match the expected shape, which helps expose differences between the inferred API contract and the live service.

Backend endpoints and request examples are documented in [api-documentation.md](api-documentation.md).

## Deployment

For Vercel deployment:

1. Import the repository into Vercel.
2. Add `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_SOCKET_URL` to the project environment variables.
3. Deploy the `main` branch.
4. Verify login, conversation creation, group member permissions, and Socket.IO events on the deployed URL.

## Notes and Limitations

- Group member changes are restricted by the backend to group admins.
- The offline queue currently lives in component state, so pending messages are not preserved if the browser tab is closed.
- Message history currently loads as one list; the API’s cursor pagination can be used later for large conversations.
- The live API documentation does not fully describe response bodies, so the client keeps defensive shape warnings and normalizes known `id`/`_id` differences.

