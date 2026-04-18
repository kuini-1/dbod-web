# 🧠 Project Memory
> This file is maintained automatically by Cursor. Do not delete.
> Last updated: 2026-03-29
> Total rules: 0 active

---

## How To Read This File
- ⛔ CRITICAL — Hardcoded law, never deviate
- 🔴 HIGH — Always follow, no exceptions  
- 🟡 MEDIUM — Follow consistently
- 🟢 LOW — Follow when relevant

---

## 📋 Active Rules

<!-- Cursor will automatically add rules here as you correct it -->

## [Website] — Event Login Final Day Emphasis
- Importance: 🟢 LOW
- Correction count: 1
- Rule: In Event Daily Login UI, the final day reward card must stand out clearly as the most important card.
- Context: Website
- Example: Correct: last day has stronger glow/badge/special styling. Wrong: last day looks same as other days.
- Last updated: 2026-03-31

## [Website] — Event Login No Scroll Layout
- Importance: 🟢 LOW
- Correction count: 1
- Rule: Event Daily Login reward days should be visible on screen at once without horizontal scroll.
- Context: Website
- Example: Correct: fixed multi-column grid showing all days. Wrong: horizontally scrollable day row.
- Last updated: 2026-03-31

## [Website] — Event Login Metric Label
- Importance: 🟢 LOW
- Correction count: 1
- Rule: In Event Daily Login stats, use "Days Remaining" instead of "Current Step".
- Context: Website
- Example: Correct: Days Remaining = total rewards - claimed rewards.
- Last updated: 2026-03-31

## [Website] — Event Daily Auto Claim
- Importance: 🟢 LOW
- Correction count: 1
- Rule: Event daily login should auto-claim on login just like monthly daily login.
- Context: Website
- Example: Correct: call event auto-checkin during login flow and auto-claim next eligible event step.
- Last updated: 2026-03-31

## [Website] — Event Login Cursor Style
- Importance: 🟢 LOW
- Correction count: 1
- Rule: Do not force `cursor-not-allowed` on disabled event login reward cards; keep normal pointer behavior.
- Context: Website
- Example: Correct: disabled cards can keep visual disabled style without `disabled:cursor-not-allowed`.
- Last updated: 2026-03-31

## [Website] — Monthly Pass Insufficient CP CTA
- Importance: 🟢 LOW
- Correction count: 1
- Rule: In monthly daily login modal, show a donate button under purchase when CP is insufficient.
- Context: Website
- Example: Correct: secondary CTA appears only when `mallpoints < passPrice`.
- Last updated: 2026-03-31

## [Website] — Check-in Pass Persistence
- Importance: 🟢 LOW
- Correction count: 1
- Rule: Check-in pass must be recognized by activeUntil (not month-only purchase keys) so existing active users keep benefits.
- Context: Website
- Example: Correct: pass lookups use `activeUntil >= now`; wrong: filter by `purchaseYear/purchaseMonth` only.
- Last updated: 2026-03-31

## [Website] — Enchant Fetch Must Join Translation Table
- Importance: 🟢 LOW
- Correction count: 1
- Rule: When fetching `table_item_enchant_data`, also fetch `item_enchant_translations`, match by `tblidx`, and use `wszName_en`/`wszName_kr` by selected language.
- Context: Website
- Example: Correct: base enchant rows + translation rows joined on `tblidx`; Wrong: fetch only enchant rows without translation join.
- Last updated: 2026-04-09

## [Website] — Level-Up Admin Milestone Workflow
- Importance: 🟢 LOW
- Correction count: 1
- Rule: In admin level-up events, milestones are created by required level first; item selection must be handled in a separate donation-tier-like catalog section, not inside milestone creation rows.
- Context: Website
- Example: Correct: create level milestone -> pick item in separate catalog assignment panel. Wrong: milestone row directly requires choosing item at creation time.
- Last updated: 2026-04-15

## [Website] — WPS Keep Blocks Open While Dragging
- Importance: ⛔ CRITICAL
- Correction count: 1
- Rule: In the WPS editor, dragging blocks must not hide or collapse block params and children; keep opened block details visible while dragging so placement stays understandable.
- Context: Website
- Example: Correct: opened blocks remain visible during drag. Wrong: dragging temporarily closes or hides params/children.
- Last updated: 2026-04-16

---

## 📊 Correction Log
> Automatic log of all corrections made

| Date | Project | What Was Wrong | What Is Correct | Importance |
|------|---------|---------------|-----------------|------------|
| | | | | |

---

## 🏗️ Project Architecture Notes

### C++ Server
<!-- Cursor will document architecture decisions here -->

### Website
<!-- Cursor will document UI patterns, libraries, conventions here -->

### Web Bridge
<!-- Cursor will document API patterns here -->

### Launcher
<!-- Cursor will document launcher-specific patterns here -->

---

## ⛔ Never Use These

| Library/Pattern | Reason | Project | Importance |
|----------------|--------|---------|------------|
| | | | |

---

## ✅ Always Use These

| Library/Pattern | Instead Of | Project | Importance |
|----------------|-----------|---------|------------|
| | | | |