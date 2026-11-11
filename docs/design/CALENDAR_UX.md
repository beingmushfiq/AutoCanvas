# AutoCanvas — Publishing Calendar UX

> The Publishing Calendar provides multi-channel visibility, drag-and-drop scheduling, and timezone-aware editorial planning.

---

## 1. Calendar Views
1. **Month Grid (`dayGridMonth`):** Broad visual overview of scheduled cadence across all channels.
2. **Week / Day Agenda:** Detailed hourly slot breakdown showing channel conflicts.
3. **Accessible List View:** Non-drag tabular alternative for keyboard users and screen readers.

---

## 2. Post Lifecycle Status Badges

Every post in the calendar displays an explicit status:
- `Draft` (`--foreground-muted`): Work in progress, not queued for dispatch.
- `Scheduled` (`--status-info`): Confirmed slot with distributed Redis lock key generated.
- `Publishing` (`--brand-accent`): Worker currently transmitting payload to platform OAuth API.
- `Published` (`--status-success`): Confirmed receipt from social network with external post URL.
- `Failed` (`--status-danger`): Platform error with one-click retry affordance.

---

## 3. Rescheduling & Non-Drag Operations
- Dragging an event updates its `scheduled_at` timestamp.
- For keyboard users: Clicking or pressing `Enter` on a calendar event opens the **Schedule Drawer**, which features explicit native Date and Time picker inputs, timezone selector, and "Reschedule Post" confirmation button.

