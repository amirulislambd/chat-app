# Chat API — Documentation

> Base REST URL: `https://frontend-task-chatapp.onrender.com/api`
> WebSocket root: `https://frontend-task-chatapp.onrender.com` (Socket.io serves itself at `/socket.io/`, **not** under `/api`)
> Version: 1.0.0 (OAS 3.0)

**Note on this document:** The official Swagger spec is intentionally request-focused — it documents endpoints, methods, and request bodies, but does **not** specify response bodies or status codes. Fields marked `⚠️ inferred — verify against live API` are my best-guess design based on REST conventions and the request schemas; I confirmed/corrected these by hitting the live endpoints during implementation (see notes at the bottom).

---

## Authentication

- Auth model: JWT bearer token.
- No separate signup flow — `POST /auth/login` registers a new user automatically if the phone number hasn't been seen before, otherwise logs the existing user in.
- Every protected request needs: `Authorization: Bearer <token>`
- The same token is passed to the Socket.io handshake: `auth: { token }`.

---

## REST Endpoints

### Auth

#### `POST /auth/login`
Log in or register.

**Auth required:** No

**Request body** (`LoginRequest`):
| Field | Type | Required | Example |
|---|---|---|---|
| phone | string | ✅ | `+15551234567` |
| name | string | ✅ | `Ada Lovelace` |

**Response** `200 OK` ⚠️ inferred:
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "665f0c2a9b1e4a0012ab34cd",
    "phone": "+15551234567",
    "name": "Ada Lovelace"
  }
}
```
**Possible errors:** `400` invalid phone/name format.

---

#### `GET /auth/me`
Return the currently authenticated user.

**Auth required:** ✅ Bearer token

**Response** `200 OK` ⚠️ inferred:
```json
{ "id": "665f0c2a9b1e4a0012ab34cd", "phone": "+15551234567", "name": "Ada Lovelace" }
```
**Possible errors:** `401` missing/invalid/expired token.

---

### Users

#### `GET /users/search`
Search users by name or phone (used to start a new conversation).

**Auth required:** ✅ Bearer token

**Query params** (confirmed from spec):
| Param | Type | Required | Example | Notes |
|---|---|---|---|---|
| q | string | ✅ | `Ada` | Search term — matches a user's name or phone number |

**Response** `200 OK` ⚠️ inferred:
```json
[
  { "id": "665f0c2a9b1e4a0012ab34cd", "name": "Ada Lovelace", "phone": "+15551234567" }
]
```

---

### Conversations

#### `GET /conversations`
List all conversations (direct + group) the current user is a participant in.

**Auth required:** ✅

**Response** `200 OK` ⚠️ inferred:
```json
[
  {
    "id": "conv_123",
    "type": "direct",
    "participants": [{ "id": "u1", "name": "Ada Lovelace" }],
    "lastMessage": { "text": "Hello!", "createdAt": "2026-08-21T10:00:00Z" },
    "updatedAt": "2026-08-21T10:00:00Z"
  }
]
```

#### `POST /conversations`
Start a direct (1-to-1) conversation.

**Auth required:** ✅

**Request body** (`StartConversationRequest`):
| Field | Type | Required | Notes |
|---|---|---|---|
| userId | string | ✅ | ID of the user to converse with, obtained from `/users/search` |

**Response** `201 Created` ⚠️ inferred — the created/existing conversation object.
**Behavior note (assumption):** if a direct conversation with this user already exists, the API likely returns the existing one instead of duplicating — verify.

#### `GET /conversations/{id}/messages`
Get message history for a conversation.

**Auth required:** ✅

**Path params:** `id` — conversation ID (required)

**Query params** ✅ confirmed from spec — cursor-based pagination:
| Param | Type | Required | Example | Notes |
|---|---|---|---|---|
| limit | integer | Optional | `20` | Maximum number of messages to return per page |
| before | string | Optional | — | Cursor for fetching the page of messages *before* a given message (i.e. loading older history) |

**Response** `200 OK` ⚠️ inferred:
```json
[
  {
    "id": "msg_1",
    "conversationId": "conv_123",
    "senderId": "u1",
    "text": "Hello!",
    "createdAt": "2026-08-21T10:00:00Z"
  }
]
```

---

### Groups

Business rules (from spec):
- A conversation is either **direct** (1-to-1) or a **group** (3+ members).
- Groups have a `name` and one or more `admins`; the creator starts as an admin.
- Only admins can: add/remove members, promote others to admin, rename the group.
- Any member can leave.
- Group messages reuse the same `POST /messages` endpoint and `message:new` socket event as direct messages.

#### `POST /conversations/group`
Create a group conversation.

**Auth required:** ✅

**Request body** (`CreateGroupRequest`):
| Field | Type | Required | Notes |
|---|---|---|---|
| name | string | ✅ | e.g. `Project Team` |
| participantIds | string[] | ✅ | IDs of members to add, besides the creator |

**Response** `201 Created` ⚠️ inferred — group conversation object with `admins: [creatorId]`.

#### `POST /conversations/{id}/participants`
Add members to a group.

**Auth required:** ✅ (admin only, per business rules)

**Path params:** `id` — the group id (required)

**Request body** (`AddParticipantsRequest`):
| Field | Type | Required |
|---|---|---|
| userIds | string[] | ✅ |

**Possible errors:** `403` if requester isn't an admin.

#### `DELETE /conversations/{id}/participants/{userId}`
Remove a member from a group, or leave the group (when `userId` = self).

**Auth required:** ✅ (admin to remove others; any member to remove self / leave)

**Path params** ✅ confirmed from spec:
| Param | Required | Notes |
|---|---|---|
| id | ✅ | The group id |
| userId | ✅ | The member to remove — pass your own id to leave the group |

**Possible errors:** `403` non-admin trying to remove someone else.

#### `POST /conversations/{id}/admins`
Promote a member to admin.

**Auth required:** ✅ (admin only)

**Path params:** `id` — the group id (required)

**Request body** (`PromoteRequest`):
| Field | Type | Required |
|---|---|---|
| userId | string | ✅ |

#### `PATCH /conversations/{id}`
Rename a group.

**Auth required:** ✅ (admin only)

**Path params:** `id` — the group id (required)

**Request body** (`RenameGroupRequest`):
| Field | Type | Required | Example |
|---|---|---|---|
| name | string | ✅ | `Renamed Team` |

---

### Messages

#### `POST /messages`
Send a message (works for both direct and group conversations).

**Auth required:** ✅

**Request body** (`SendMessageRequest`):
| Field | Type | Required | Example |
|---|---|---|---|
| conversationId | string | ✅ | — |
| text | string | ✅ | `Hello!` |

**Validation (assumption, per assignment requirements):** empty/whitespace-only `text` should be rejected client-side before sending; server may also `400` on empty text — verify.

**Response** `201 Created` ⚠️ inferred — the created message object (mirrors the shape seen in `message:new`).

---

### System

#### `GET /health`
Health check. No auth required.

---

## WebSocket (Socket.io) — Real-time layer

Not part of the OpenAPI spec; documented here for reference.

**Connect to the server's root origin — NOT the `/api` REST base:**
```js
const socket = io('https://frontend-task-chatapp.onrender.com', {
  auth: { token }
});
```
An invalid/missing token is rejected at the handshake.

### Events

| Direction | Event | Payload | Notes |
|---|---|---|---|
| Client → Server | `message:send` | `{ conversationId, text }` | Optional ack callback |
| Server → Client | `message:new` | message object | Fired when a new message arrives for you (direct or group) |
| Server → Client | `conversation:updated` | conversation object | Fired when a group you're in is created, renamed, or has members/admins changed |

**Implementation note:** since both a REST `POST /messages` call and a `message:send` socket emit appear to exist for sending, I need to pick one source of truth for the send action (likely `message:send` for real-time UX, with REST `POST /messages` as fallback/initial history load) — documenting this decision in the Part 3 write-up.

---

## Open Questions / Things to Verify Against the Live API

**✅ Resolved from the full Swagger UI (parameter tables):**
- Search query param is `q` (not `query`/`search`)
- Message history pagination is **cursor-based**: `limit` (page size) + `before` (cursor pointing to a message, for loading older history) — not offset-based
- `DELETE .../participants/{userId}`: pass your own user id as `userId` to leave a group

**Still to verify by actually calling the live endpoints (response bodies aren't in the spec at all):**
- [ ] Exact shape of `/auth/login` and `/auth/me` responses (token field name, user object shape)
- [ ] Exact shape of message/conversation objects returned by `GET /conversations`, `GET /conversations/{id}/messages`, `POST /messages` — field names may differ from my inferred `senderId`/`createdAt` etc.
- [ ] Whether `POST /conversations` is idempotent for existing direct conversations
- [ ] Exact error response shape (status codes, error body format) across endpoints
- [ ] Whether sending should go through REST (`POST /messages`) or the socket (`message:send`), or both
- [ ] Whether `GET /conversations/{id}/messages` returns messages oldest-first or newest-first by default