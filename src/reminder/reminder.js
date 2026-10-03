const REMINDER_30_MINUTES_KEY = "reminder30Minutes";
const REMINDER_10_MINUTES_KEY = "reminder10Minutes";
const DEFAULT_REMINDER_30_MINUTES = 30;
const DEFAULT_REMINDER_10_MINUTES = 10;

const params = new URLSearchParams(window.location.search);

const minutes = Number(params.get("minutes"));
const expired = params.get("expired") === "1";

const title = document.getElementById("title");
const message = document.getElementById("message");
const dismiss = document.getElementById("dismiss");

function normalizeMinutes(value, fallback) {
  const parsedValue = Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) return fallback;

  return parsedValue;
}

async function getReminderThresholds() {
  const storedValues = await chrome.storage.local.get([
    REMINDER_30_MINUTES_KEY,
    REMINDER_10_MINUTES_KEY
  ]);

  return {
    [REMINDER_30_MINUTES_KEY]: normalizeMinutes(
      storedValues[REMINDER_30_MINUTES_KEY],
      DEFAULT_REMINDER_30_MINUTES
    ),
    [REMINDER_10_MINUTES_KEY]: normalizeMinutes(
      storedValues[REMINDER_10_MINUTES_KEY],
      DEFAULT_REMINDER_10_MINUTES
    )
  };
}

/**
 * Render the saved/calculated timer
 */
async function renderDismiss() {
  const reminderThresholds = await getReminderThresholds();

  const reminder30Minutes = reminderThresholds[REMINDER_30_MINUTES_KEY];
  const reminder10Minutes = reminderThresholds[REMINDER_10_MINUTES_KEY];

  if (expired) {
    title.textContent = "Clock-out time passed";
    message.textContent = "Your clock-out time has already passed";
    return;
  }

  if (minutes === reminder30Minutes) {
    message.textContent = `You have ${reminder30Minutes} minute(s) left until clock-out`;
    return;
  }

  if (minutes === reminder10Minutes) {
    message.textContent = `You have ${reminder10Minutes} minute(s) left until clock-out`;
    return;
  }

  message.textContent = `You have ${minutes} minute(s) left until clock-out`;
}

document.addEventListener("DOMContentLoaded", () => {
  void init();
});

async function init() {
  await renderDismiss();

  if (dismiss instanceof HTMLButtonElement) {
    dismiss.addEventListener("click", () => {
      void chrome.runtime.sendMessage({ type: "STOP_RING" });
      window.close();
    });
  }
}
