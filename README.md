# Workday Timer Chrome Extension

A Chrome extension that calculates a clock-out time from a clock-in/start time and schedules reminder alerts before the end of the workday.

## Capabilities

- Calculates clock-out time from a user-entered start time
- Shows a live countdown to clock-out
- Schedules reminder alerts before clock-out
- Supports two configurable reminder thresholds
- Persists settings in `chrome.storage.local`
- Supports a selectable reminder sound from `src/assets/sounds`
- Falls back to the default built-in reminder sound if no custom sound is selected
- Shows a reminder window when alerts fire
- Stops the sound when the reminder window is dismissed

## Settings

The extension stores the following values locally:

- `reminder30Minutes`
- `reminder10Minutes`
- `selectedRingSound`

Default reminder thresholds:

- First reminder: `30` minutes
- Second reminder: `10` minutes

## Sound selection

The settings UI includes a dropdown for reminder sound selection.  
Any audio file under `src/assets/sounds/` can be used if it is listed in the dropdown options.

If no custom sound is selected, the extension uses the default reminder tone.

## Main flow

1. Enter a clock-in time in the popup
2. Click **Calculate**
3. The extension shows:
   - clock-out time
   - countdown
   - reminder times
4. Reminder alerts are scheduled automatically
5. Dismissing the reminder window stops the sound

## Project structure

- `src/popup/` — main popup UI and timer logic
- `src/background/` — alarm scheduling and reminder window handling
- `src/reminder/` — reminder alert window
- `src/offscreen/` — audio playback
- `src/assets/sounds/` — custom reminder sounds
- `src/assets/img/` — extension icons

## Storage

The extension uses `chrome.storage.local` to persist:

- reminder thresholds
- selected sound
- saved clock-in / clock-out values

## Notes

- The extension relies on Chrome alarms and an offscreen document for audio playback.
- Reminder alerts are rescheduled automatically when settings change.