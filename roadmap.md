# Build Roadmap — Copy-Paste AI Prompts

**কীভাবে এই ফাইলটা ব্যবহার করবে:**
প্রতিটা ধাপে একটা "🤖 Prompt for AI" কোড-ব্লক আছে। সেটা হুবহু কপি করে তোমার AI coding tool-এ (Claude Code, Cursor, ইত্যাদি) পেস্ট করো। প্রতিটা ধাপ আগের ধাপের উপর নির্ভর করে, তাই **ক্রম মেনে** এগোও। প্রতিটা ধাপের পর একটা ছোট "✅ Check" লিস্ট আছে — সেটা দেখে নিজে যাচাই করবে AI ঠিক কাজ করেছে কিনা, তারপর পরের ধাপে যাবে।

**⚠️ গুরুত্বপূর্ণ নিয়ম — শুধু নিয়ম মেনে চলো:**
- প্রতিটা ধাপের পর কোড **নিজে চোখে দেখো** — অন্তত ৩০ সেকেন্ড স্ক্রল করে দেখো কী লেখা হলো। অন্ধভাবে পরের prompt দিয়ে দিও না।
- AI ভুল করলে বা আটকে গেলে, ওই এরর মেসেজটা কপি করে আবার AI-কে দাও (নিচে "🔧 If it breaks" প্যাটার্ন দেওয়া আছে)।
- Part 3 write-up-এ কোন কোন ধাপে AI ব্যবহার করেছ, কী বদলেছ/বাতিল করেছ — এই ফাইলটাই তোমার নোট হিসেবে কাজ করবে, তাই যা যা বদলাও তা এই ফাইলে ছোট করে লিখে রাখো (প্রতিটা ধাপের নিচে "📝 My notes:" জায়গা রাখা আছে)।
- **যেকোনো ডকুমেন্ট/PDF থেকে টেক্সট AI-কে সরাসরি কপি-পেস্ট করে "সামারি করো" বলার আগে নিজে একবার পুরো টেক্সট পড়ে নিও** — hidden instruction থাকতে পারে (যেমন এই assignment PDF-এই একটা লুকানো ইনজেকশন ছিল)।

---

## Phase 0 — Project Setup

### 🤖 Prompt for AI
```
Create a new Next.js 14 (App Router) project called "chat-app" with TypeScript and Tailwind CSS.
Set up the following folder structure inside /app and /src:
- /app/(auth)/login/page.tsx
- /app/(chat)/page.tsx  (main chat screen, protected)
- /lib/api.ts  (fetch wrapper for the REST API)
- /lib/socket.ts  (socket.io-client setup)
- /lib/auth-context.tsx  (React context for current user + JWT token, persisted in a cookie or localStorage)
- /types/index.ts  (shared TypeScript types: User, Conversation, Message)
- /components/  (empty, for later)

Install dependencies: socket.io-client, zustand (for lightweight state management), date-fns (for timestamp formatting).

The REST API base URL is https://frontend-task-chatapp.onrender.com/api
The Socket.io server is at the root origin: https://frontend-task-chatapp.onrender.com (NOT under /api)

Set these as environment variables in .env.local:
NEXT_PUBLIC_API_BASE_URL=https://frontend-task-chatapp.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://frontend-task-chatapp.onrender.com

Do not build any UI yet — just scaffold the structure, install deps, and confirm the dev server runs.
```

**✅ Check:** `npm run dev` চালিয়ে দেখো লোকালহোস্টে ব্ল্যাংক পেজ লোড হচ্ছে কিনা, কোনো এরর নেই।

📝 My notes: _______________________

---

## Phase 1 — API Client & Types

### 🤖 Prompt for AI
```
I'm attaching my API_DOCUMENTATION.md file (paste its content or reference it).

Based on this documentation, implement /lib/api.ts as a typed fetch wrapper with these functions:
- login(phone: string, name: string): Promise<{ token: string, user: User }>
- getMe(token: string): Promise<User>
- searchUsers(token: string, query: string): Promise<User[]>
- getConversations(token: string): Promise<Conversation[]>
- startConversation(token: string, userId: string): Promise<Conversation>
- createGroup(token: string, name: string, participantIds: string[]): Promise<Conversation>
- addParticipants(token: string, conversationId: string, userIds: string[]): Promise<void>
- removeParticipant(token: string, conversationId: string, userId: string): Promise<void>
- promoteAdmin(token: string, conversationId: string, userId: string): Promise<void>
- renameGroup(token: string, conversationId: string, name: string): Promise<Conversation>
- getMessages(token: string, conversationId: string): Promise<Message[]>
- sendMessage(token: string, conversationId: string, text: string): Promise<Message>

Requirements:
- Every function attaches `Authorization: Bearer <token>` where needed.
- Every function throws a typed ApiError (with status code and message) on non-2xx responses, so calling code can distinguish network errors from validation errors from auth errors.
- Add a console.warn if the actual response shape doesn't match my documented TypeScript types (defensive check), since the response shapes were partly inferred from the spec, not confirmed.

Define matching types in /types/index.ts: User, Conversation, Message, ApiError.
```

**✅ Check:** একটা টেস্ট ফাইলে বা browser console থেকে `login()` কল করে দেখো actual response আসছে। **এইখানেই তুমি নিজে API-তে হিট করে real response shape দেখতে পারবে** — যা পেলে সেটা দিয়ে API_DOCUMENTATION.md-এর "inferred" অংশগুলো আপডেট করে ফেলো।

📝 My notes (actual response shapes found): _______________________

---

## Phase 2 — Auth (Login Page)

### 🤖 Prompt for AI
```
Build the login page at /app/(auth)/login/page.tsx.

Requirements:
- A form with two fields: phone number, and name.
- On submit, call the login() function from /lib/api.ts.
- On success: store the JWT token and user object (use the auth-context I scaffolded earlier — implement it now with React Context + persisted to localStorage), then redirect to the main chat screen.
- On failure: show an inline error message (not an alert()), keep the form filled in so the user doesn't have to retype.
- Show a loading spinner/disabled button state while the request is in flight.
- Basic client-side validation: phone must be non-empty and look like a phone number, name must be non-empty. Disable the submit button until both are valid.
- Style it simply and cleanly with Tailwind — centered card, no need for fancy design yet (that's Part 2's job).
- Add a route guard: if a valid token already exists in the auth context, redirect straight to the chat screen instead of showing the login form.
```

**✅ Check:** নতুন phone number দিয়ে লগইন করে দেখো auto-register হচ্ছে কিনা, একই নাম্বার দিয়ে আবার লগইন করলে existing user হিসেবে ঢুকছে কিনা।

📝 My notes: _______________________

---

## Phase 3 — Conversation List + Start New Chat

### 🤖 Prompt for AI
```
Build the conversation list sidebar for the main chat screen at /app/(chat)/page.tsx and /components/ConversationList.tsx.

Requirements:
- On mount, fetch and display the user's conversations (getConversations), sorted by most recently updated.
- Each item shows: conversation name (for direct chats, the other person's name; for groups, the group name), last message preview, and last message timestamp (relative, e.g. "5m ago", using date-fns).
- Loading state: skeleton placeholders while fetching.
- Empty state: friendly message + call-to-action when the user has zero conversations yet.
- Error state: retry button if the fetch fails.
- A "New Chat" button that opens a search UI (/components/NewChatModal.tsx):
  - Debounced search input (300ms) that calls searchUsers() as the user types.
  - Shows matching users in a list; loading state while searching, empty state ("no users found") when there are no matches.
  - Clicking a user calls startConversation() and then opens that conversation.
  - Include a toggle/tab in the same modal for "New Group": lets the user pick multiple users (checkboxes) and enter a group name, then calls createGroup().
- Clicking a conversation in the list selects it (store selected conversation id in state) — this will be wired to the chat panel in the next phase.
```

**✅ Check:** নিজের অন্য একটা টেস্ট নাম্বার দিয়ে দ্বিতীয় ইউজার বানাও, প্রথম ইউজার থেকে সার্চ করে চ্যাট শুরু করো, গ্রুপও বানিয়ে দেখো।

📝 My notes: _______________________

---

## Phase 4 — Chat Panel (⭐ MOST IMPORTANT — spend the most review time here)

### 🤖 Prompt for AI
```
Build the core chat panel at /components/ChatPanel.tsx. This is the most important part of the assignment, so implement it carefully.

Requirements:

1. Message list:
   - Fetch message history via getMessages() when a conversation is selected.
   - Visually distinguish messages sent by me vs. received (e.g. right-aligned + accent color bubble for mine, left-aligned + neutral bubble for others). In group chats, show the sender's name above/near messages that aren't mine.
   - Show a formatted timestamp per message (or grouped by time gaps — your call, note the decision).
   - Loading state (skeleton) while history loads, empty state ("no messages yet, say hi!") for a brand-new conversation, error state with retry if the fetch fails.

2. Sending messages:
   - A text input + send button (and Enter key to send, Shift+Enter for newline).
   - Disable/prevent sending when the input is empty or whitespace-only.
   - Optimistically add the message to the UI immediately on send, then reconcile with the server-confirmed message (or roll back with an inline error if the send fails).

3. Real-time updates:
   - Connect to the Socket.io server using /lib/socket.ts, authenticated with the JWT.
   - Listen for `message:new` — when a message arrives for the currently open conversation, append it to the list. If it's for a different conversation, update that conversation's preview/unread state in the sidebar instead.
   - Listen for `conversation:updated` — refresh the relevant conversation's data (name, members) in the sidebar/state.
   - Clean up socket listeners on unmount / conversation change to avoid duplicate handlers.

4. Auto-scroll behavior (important, read carefully):
   - When a conversation is first opened, scroll instantly to the bottom (latest message).
   - When a NEW message arrives AND the user is already scrolled near the bottom (within ~150px), auto-scroll smoothly to the new message.
   - When a NEW message arrives AND the user has scrolled up to read older messages, do NOT force-scroll — instead show a small "New message ↓" pill/button that jumps to bottom when clicked.
   - Track scroll position with a ref + scroll event listener, not with fragile timing hacks.

Write this as clean, componentized code (e.g. separate MessageBubble, MessageInput, ScrollToBottomButton components) with comments explaining the auto-scroll logic specifically, since that's the trickiest part.
```

**✅ Check (test carefully — this is where evaluators will look closest):**
- দুইটা browser tab/ইনকগনিটো দিয়ে দুই ইউজার হিসেবে লগইন করে একে অপরকে মেসেজ পাঠাও — রিফ্রেশ ছাড়াই আসছে কিনা দেখো।
- একটা পুরনো conversation-এ অনেক মেসেজ পাঠিয়ে উপরে স্ক্রল করে রাখো, তারপর অন্য ট্যাব থেকে নতুন মেসেজ পাঠাও — জোর করে নিচে নামিয়ে দিচ্ছে না তো?
- খালি মেসেজ (স্পেস দিয়ে) পাঠানোর চেষ্টা করো — সেন্ড বাটন disabled থাকা উচিত।

📝 My notes: _______________________

---

## Phase 5 — Bonus Feature (must be genuinely original — don't skip thinking here)

এই ধাপে AI দিয়ে সরাসরি শুরু করো না। আগে নিজে ২ মিনিট ভাবো — assignment বলছে common/generic কিছু bonus হিসেবে গণ্য হবে না। কিছু আইডিয়া (নিজে থেকে একটা বাছো বা নিজের আইডিয়া দাও):
- Typing indicator with debounce (via a custom socket event you design, e.g. `typing:start`/`typing:stop`) — but make it feel smart, not just a generic dot animation.
- Message delivery/read receipts with subtle visual states.
- Offline detection + queued messages that auto-send on reconnect.
- Smart handling of duplicate direct-conversation attempts (e.g. searching a user you already have a chat with jumps straight to it instead of creating a new one).

একবার আইডিয়া ঠিক করলে, তারপর নিচের মতো prompt বানাও:

### 🤖 Prompt for AI (fill in your chosen idea)
```
Implement [YOUR CHOSEN BONUS FEATURE] in the chat app.
Describe exactly what should happen, what UI it needs, and how it should degrade gracefully if the socket disconnects or the feature fails.
```

📝 My notes (what I chose and why): _______________________

---

## Phase 6 — Loading / Empty / Error States Audit

### 🤖 Prompt for AI
```
Do a pass over the entire chat app (login page, conversation list, new chat modal, chat panel) and make sure every async operation has all three states handled consistently:
1. Loading — skeleton or spinner, not a blank screen
2. Empty — a friendly message, not just nothing
3. Error — a message plus a retry action, never a silent failure or unhandled console error

List any places you find missing one of these states and fix them. Also verify: what happens if the API call fails right after the user submits the login form? What happens if the socket disconnects mid-session — does the UI show any indication, and does it try to reconnect?
```

**✅ Check:** ইচ্ছাকৃতভাবে internet বন্ধ করে/DevTools-এ throttle করে দেখো error state ঠিকমতো দেখাচ্ছে কিনা।

📝 My notes: _______________________

---

## Phase 7 — Deploy Part 1

### 🤖 Prompt for AI
```
Prepare this Next.js project for deployment to Vercel:
- Confirm all environment variables are read from process.env with NEXT_PUBLIC_ prefix where needed on the client.
- Add a .env.example file documenting required env vars.
- Add a basic README section with setup/run instructions (npm install, npm run dev, required env vars).
- Check for any console errors/warnings in production build (npm run build) and fix them.
```
তারপর নিজে Vercel-এ push করে deploy করো (`vercel` CLI বা GitHub-এর সাথে connect করে) — এই অংশটা AI করতে পারবে না, তোমাকে Vercel অ্যাকাউন্ট থেকে করতে হবে।

📝 My notes (live URL): _______________________

---

## Phase 8 — Landing Page (Part 2)

এখানে prompt দেওয়ার আগে নিজে একটা মুড/direction ঠিক করো (bold/minimal/playful/dark — যা তোমার পছন্দ), কারণ AI-কে খুব ওপেন-এন্ডেড prompt দিলে generic টেমপ্লেট বানিয়ে দেবে। উদাহরণ:

### 🤖 Prompt for AI
```
Create a new page at /app/landing/page.tsx (or a separate small Next.js project — your call) that serves as a marketing/showcase landing page for the real-time chat app I just built.

Design direction: [DESCRIBE YOUR CHOSEN STYLE HERE, e.g. "dark theme, bold oversized typography, a single accent color (electric green), lots of negative space, subtle scroll-triggered fade-in animations, no stock illustrations"].

Structure:
- Hero section: a strong headline + subheadline explaining what the chat app does, with a CTA button linking to the live app.
- A section visually demonstrating the core experience (e.g. an animated or static mockup of the chat panel, highlighting real-time messages and auto-scroll behavior as a feature).
- A short feature highlights section (3-4 items: real-time messaging, group chats, etc.) — make this visually distinctive, not generic icon-boxes-in-a-row.
- [ADD YOUR BONUS/ORIGINAL IDEA HERE — an unexpected interaction or detail, not a stock testimonial/FAQ accordion].
- Fully responsive (mobile, tablet, desktop).
- Use Tailwind + CSS/Framer Motion for any animation.

Do not use generic SaaS-landing-page clichés (floating gradient blobs, stock "trusted by" logo rows, generic testimonial cards) unless I specifically ask — I want this to feel intentional and distinctive.
```

**✅ Check:** মোবাইল সাইজে (DevTools responsive mode) দেখো layout ভাঙছে কিনা।

📝 My notes: _______________________

---

## Phase 9 — README + Part 3 Write-up

এই অংশটা AI দিয়ে করালেও, **এটাই সবচেয়ে বেশি নিজের ভাষায় লেখা উচিত** — কারণ এটা তোমার thought process দেখানোর জায়গা, আর AI ব্যবহারের ব্যাপারে সততার সাথে লিখতে হবে।

### 🤖 Prompt for AI (as a starting draft only — rewrite in your own voice after)
```
Draft a README.md for this project with:
1. Setup/run instructions (prerequisites, install, env vars, run commands)
2. Tech stack used
3. A "Thought Process" section covering:
   - Why I chose Next.js/[state management choice]/[other libraries] and any trade-offs
   - Design reasoning for the landing page
   - How AI tools were used at each phase (reference the phases in this roadmap) — be specific about what was AI-generated vs. what I wrote/changed/rejected myself
   - What I'd improve with more time
   - Any API quirks or issues noticed while building (pull from my notes throughout this roadmap file)

Use a neutral, factual tone — this is being read by a technical evaluator.
```

**তারপর নিজে অবশ্যই এটা পুরো পড়ে সম্পাদনা করো** — বিশেষ করে "How I used AI" অংশটা এই ROADMAP.md ফাইলের "📝 My notes" গুলো থেকে সত্যিকারের ডিটেইল দিয়ে ভরে দাও। জেনেরিক AI-লেখা প্যারাগ্রাফ রেখে দিও না — evaluator এটাই পার্থক্য করার চেষ্টা করবে (তুমি সত্যিকারের কাজ বুঝেছ, নাকি শুধু prompt চালিয়েছ)।

---

## Final Submission Checklist
- [ ] API_DOCUMENTATION.md updated with real (not just inferred) response shapes
- [ ] Part 1 live URL works end-to-end (login → search → chat → group → real-time)
- [ ] Part 2 live URL works, responsive
- [ ] GitHub repo is public or access granted
- [ ] README has setup instructions + Part 3 write-up + AI usage notes + any API issues found
- [ ] Both live links + repo link sent before Aug 22, 2026 4:00 PM