
## What will change

### 1. Consistency Tracker -- Clickable day detail panel

Currently the heatmap only shows a hover tooltip. We will add a click-to-select interaction:

- Clicking a heatmap cell selects it and shows a **detail panel** below the grid with:
  - Full date (e.g. "Saturday, May 3, 2026")
  - Wellness score out of 10
  - All logged entries for that day: Sleep hours/quality, Mood, Craving intensity/trigger, Water, Exercise, Meditation, Meds, Notes
  - If no log exists: "No data logged for this day"
- The selected cell gets a visible ring highlight
- Clicking again or clicking another cell toggles selection

### 2. Consistency Tracker -- Fetch full year of data

The `useData` hook currently limits fetches to 30 rows (`LIMIT 30`). The heatmap covers the entire year, so most cells show empty even if data exists. We will:

- Increase the fetch limit to 1000 (covers a full year)
- This ensures the heatmap accurately reflects all logged days

### 3. Quick Log -- Make buttons actually work with feedback

The Quick Log buttons call `handleQuickLog` which silently calls `addLog` with hardcoded values and no user feedback. We will:

- Add **toast notifications** (using existing sonner) on each quick log tap confirming what was logged (e.g. "Logged: 8 glasses of water")
- For **Craving**, **Mood**, **Sleep** -- these already log preset values, we keep them but add toasts
- For **Journal** -- navigate to the Unified Journal page
- For **Water** -- increment today's water count by 1 glass instead of setting to 8
- For **Exercise** -- log 30 min exercise
- For **Meds** -- toggle `took_meds` to true

### Technical details

**Files modified:**
- `src/components/charts/YearHeatmap.tsx` -- Add `selectedDay` state, click handler, and detail panel rendering below the grid
- `src/hooks/useData.ts` -- Change `.limit(30)` to `.limit(1000)` on the fetch query
- `src/pages/Dashboard.tsx` -- Update `handleQuickLog` to add toast feedback for each action, handle journal navigation, fix water increment logic
