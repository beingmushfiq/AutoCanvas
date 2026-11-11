# AutoCanvas — Unified Inbox UX

> The Unified Inbox consolidates social comments and direct messages into an actionable, AI-assisted customer engagement workspace.

---

## 1. 3-Pane Spatial Architecture

```
+-------------------------------------------------------------------------------------------------+
| Top Filters: All Channels | Unread | Needs Reply | High Priority | Assigned to Me               |
+---------------------------+------------------------------------+--------------------------------+
| PANE 1: Conversation List | PANE 2: Message Thread             | PANE 3: Context & AI Assistant |
| (320px)                   | (Flexible Center)                  | (300px)                        |
|                           |                                    |                                |
| - Platform Icon Badge     | - Post Context Preview card        | - Author Social Profile Card   |
| - Author Avatar & Name    | - Public Comment / DM stream       | - Brand Voice Memory Citations |
| - Message Snippet         | - Internal Team Notes tab          | - 3 AI Reply Suggestions       |
| - Timestamp (Geist Mono)  | - Reply Textarea with Quick Macros | - Sentiment (Positive/Neutral) |
| - Sentiment Dot           | - "Send & Close" Button            | - Escalation Action Button     |
+---------------------------+------------------------------------+--------------------------------+
```

---

## 2. Platform Capability Boundaries
- Public comments are visually marked with a `Share2` icon; Direct Messages (DMs) are marked with an `Inbox` envelope.
- If an account’s connected API tier does not permit sending DMs (e.g. Standard Instagram Basic Display vs Professional Messaging), the reply field renders a disabled state with an explicit explanation.

