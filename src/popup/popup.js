const timeInput = document.getElementById("time");
const calculateButton = document.getElementById("calculate");
const resetButton = document.getElementById("reset");

const result = document.getElementById("result");
const error = document.getElementById("error");

const clockOut = document.getElementById("clockOut");
const countdown = document.getElementById("countdown");
const reminder30 = document.getElementById("reminder30");
const reminder10 = document.getElementById("reminder10");
const reminder30Label = document.getElementById("reminder30Label");
const reminder10Label = document.getElementById("reminder10Label");
const popupStatus = document.getElementById("popup-status");
const reminderStatus = document.getElementById("reminder-status");

const REMINDER_30_MINUTES_KEY = "reminder30Minutes";
const REMINDER_10_MINUTES_KEY = "reminder10Minutes";
const DEFAULT_REMINDER_30_MINUTES = 30;
const DEFAULT_REMINDER_10_MINUTES = 10;
// const WORK_DURATION_MINUTES = 8 * 60 + 30;
const WORK_DURATION_MINUTES = 3;

const RING_SOUND_KEY = "selectedRingSound";

const SOUND_OPTIONS = [
  { value: "src/assets/sounds/ff8-victory-fanfare.ogg", label: "FFVIII Victory fanfare" },
  { value: "src/assets/sounds/homer-lets-the-barts-out.mp3", label: "Homer Lets the Barts Out" },
  { value: "src/assets/sounds/mgs-alert.mp3", label: "MGS Alert" },
  { value: "src/assets/sounds/min-chirodikeite.mp3", label: "Min Chirodikeite" },
  { value: "src/assets/sounds/outro-song.mp3", label: "Outro Song" },
  { value: "src/assets/sounds/yeah-boiii-i-i-i.mp3", label: "Yeah Boiii I I I" },
  { value: "src/assets/sounds/dexter-meme.mp3", label: "Dexter Meme" },
  { value: "src/assets/sounds/hub-intro-sound.mp3", label: "Hub Intro Sound" },
  { value: "src/assets/sounds/metal-pipe-clang.mp3", label: "Metal Pipe Clang" },
  { value: "src/assets/sounds/run-vine-sound-effect.mp3", label: "Run Vine Sound Effect" },
  { value: "src/assets/sounds/spongebob-fail.mp3", label: "Spongebob Fail" },
  { value: "src/assets/sounds/stamataaaaaaa.mp3", label: "Stamataaaaaaa" },
  { value: "src/assets/sounds/taco-bell-bong-sfx.mp3", label: "Taco Bell Bong SFX" },
  { value: "src/assets/sounds/ti-les-more-maimou-tou-pharao.mp3", label: "Ti Les More Maimou Tou Pharao" }
];

const backButton = document.getElementById("back-button");
const reminder30Input = document.getElementById("reminder30Minutes");
const reminder10Input = document.getElementById("reminder10Minutes");
const ringSoundSelect = document.getElementById("ringSound");
const settingsButton = document.getElementById("settings-button");
const settingsForm = document.getElementById("settings-form");

const mainView = document.getElementById("main-view");
const settingsView = document.getElementById("settings-view");

const resetDefaultsButton = document.getElementById("reset-defaults");
const settingsStatus = document.getElementById("settings-status");

let countdownInterval = null;

/**
 * Parse HH:MM
 */
function parseTime(value) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return {
    hours,
    minutes
  };
}

/**
 * Format a Date as HH:MM
 */
function formatTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

/**
 * Format milliseconds as HH:MM:SS
 */
function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Update countdown
 */
function updateCountdown(clockOutTimestamp) {
  const remaining = clockOutTimestamp - Date.now();

  countdown.textContent = formatCountdown(remaining);

  if (remaining <= 0) {
    countdown.textContent = "00:00:00";

    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    popupStatus.textContent = "Timer has finished";
    popupStatus.classList.remove("hidden");
    popupStatus.classList.add("error");
  }
}

/**
 * Reset timer
 */
async function reset() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  await chrome.storage.local.remove([
    "startTime",
    "clockOut"
  ]);

  await chrome.runtime.sendMessage({
    type: "CLEAR_REMINDERS"
  });

  timeInput.value = "";

  clockOut.textContent = "--:--";
  countdown.textContent = "--:--:--";
  reminder30.textContent = "--:--";
  reminder10.textContent = "--:--";
  popupStatus.textContent = "";
  popupStatus.classList.remove("error", "success");
  popupStatus.classList.add("hidden");
  reminderStatus.classList.add("hidden");
  result.classList.add("hidden");
  error.classList.add("hidden");

  timeInput.focus();
}

/**
 * Start countdown
 */
function startCountdown(clockOutTimestamp) {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  updateCountdown(clockOutTimestamp);

  countdownInterval = setInterval(() => {
    updateCountdown(clockOutTimestamp);
  }, 1000);
}

/**
 * Calculate clock-out date
 */
function calculateDate(startTime) {
  const now = new Date();

  const start = new Date(now);

  start.setHours(
    startTime.hours,
    startTime.minutes,
    0,
    0
  );

  const clockOut = new Date(
    start.getTime() +
      WORK_DURATION_MINUTES * 60 * 1000
  );

  return clockOut;
}

/**
 * Render the saved/calculated timer
 */
async function renderTimer(clockOutTimestamp) {
  const reminderThresholds = await getReminderThresholds();

  const clockOutDate = new Date(clockOutTimestamp);

  const reminder30Minutes =
    reminderThresholds[REMINDER_30_MINUTES_KEY];
  const reminder10Minutes =
    reminderThresholds[REMINDER_10_MINUTES_KEY];

  const reminder30Date = new Date(
    clockOutTimestamp - reminder30Minutes * 60 * 1000
  );

  const reminder10Date = new Date(
    clockOutTimestamp - reminder10Minutes * 60 * 1000
  );

  clockOut.textContent = formatTime(clockOutDate);
  reminder30.textContent = formatTime(reminder30Date);
  reminder10.textContent = formatTime(reminder10Date);
  reminder30Label.textContent = `${reminder30Minutes} min reminder`;
  reminder10Label.textContent = `${reminder10Minutes} min reminder`;

  result.classList.remove("hidden");
  error.classList.add("hidden");

  startCountdown(clockOutTimestamp);

  const now = Date.now();

  if (clockOutTimestamp <= now) {
    popupStatus.textContent = "Timer has finished";
  } else if (reminder30Date.getTime() > now) {
    reminderStatus.textContent = "Reminders scheduled 🔔";
    reminderStatus.classList.remove("hidden");
  } else if (reminder10Date.getTime() > now) {
    reminderStatus.textContent = "Clock-out reminder active 🔔";
    reminderStatus.classList.remove("hidden");
  } else {
    reminderStatus.textContent = "Clock-out is coming up 🔔";
    reminderStatus.classList.remove("hidden");
  }
}

/**
 * Calculate and save timer
 */
async function calculate() {
  const parsed = parseTime(timeInput.value);

  if (!parsed) {
    error.textContent =
      "Please enter a valid time, e.g. 08:30.";

    error.classList.remove("hidden");
    result.classList.add("hidden");

    return;
  }

  error.classList.add("hidden");

  const clockOutDate = calculateDate(parsed);

  const clockOutTimestamp = clockOutDate.getTime();

  await chrome.storage.local.set({
    startTime: timeInput.value,
    clockOut: clockOutTimestamp
  });

  renderTimer(clockOutTimestamp);

  await chrome.runtime.sendMessage({
    type: "SCHEDULE_REMINDERS",
    clockOut: clockOutTimestamp
  });
}

/**
 * Restore timer when popup opens
 */
async function restoreTimer() {
  const saved = await chrome.storage.local.get([
    "startTime",
    "clockOut"
  ]);

  if (!saved.clockOut) return;

  if (saved.startTime) {
    timeInput.value = saved.startTime;
  }

  await renderTimer(saved.clockOut);
}

calculateButton.addEventListener("click", calculate);

resetButton.addEventListener("click", reset);

timeInput.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Enter") {
      calculate();
    }
  }
);

/**
 * Format time input as HH:MM
 */
function formatTimeInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/**
 * Count digits before caret
 */
function getDigitIndex(value, caretPosition) {
  return value
    .slice(0, caretPosition)
    .replace(/\D/g, "").length;
}

/**
 * Map digit index to masked caret position
 */
function getCaretPosition(maskedValue, digitIndex) {
  if (digitIndex <= 2) return digitIndex;
  return digitIndex + 1;
}

timeInput.addEventListener("input", () => {
  const caretPosition = timeInput.selectionStart ?? timeInput.value.length;
  const digitIndex = getDigitIndex(timeInput.value, caretPosition);

  timeInput.value = formatTimeInput(timeInput.value);

  const nextCaretPosition = getCaretPosition(timeInput.value, digitIndex);
  timeInput.setSelectionRange(nextCaretPosition, nextCaretPosition);

  error.classList.add("hidden");
});

timeInput.addEventListener("paste", (event) => {
  event.preventDefault();

  const pastedText = event.clipboardData.getData("text");
  timeInput.value = formatTimeInput(pastedText);
  error.classList.add("hidden");
});

timeInput.addEventListener("blur", () => {
  timeInput.value = formatTimeInput(timeInput.value);
});

// Restore previously scheduled timer
restoreTimer();

if (settingsButton && backButton && mainView && settingsView) {
  settingsButton.addEventListener("click", showSettingsView);
  backButton.addEventListener("click", showMainView);
}

if (
  settingsForm instanceof HTMLFormElement &&
  reminder30Input instanceof HTMLInputElement &&
  reminder10Input instanceof HTMLInputElement &&
  resetDefaultsButton instanceof HTMLButtonElement &&
  settingsStatus instanceof HTMLDivElement
) {
  void loadReminderSettings(reminder30Input, reminder10Input);

  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveReminderSettings(reminder30Input, reminder10Input, settingsStatus);
  });

  resetDefaultsButton.addEventListener("click", () => {
    reminder30Input.value = String(DEFAULT_REMINDER_30_MINUTES);
    reminder10Input.value = String(DEFAULT_REMINDER_10_MINUTES);
  });
}

function showSettingsView() {
  if (mainView) mainView.classList.add("hidden");
  if (settingsView) settingsView.classList.remove("hidden");
}

function showMainView() {
  if (settingsView) settingsView.classList.add("hidden");
  if (mainView) mainView.classList.remove("hidden");
}

async function loadReminderSettings(reminder30Input, reminder10Input) {
  const storedValues = await chrome.storage.local.get([
    REMINDER_30_MINUTES_KEY,
    REMINDER_10_MINUTES_KEY
  ]);

  reminder30Input.value = String(
    normalizeMinutes(
      storedValues[REMINDER_30_MINUTES_KEY],
      DEFAULT_REMINDER_30_MINUTES
    )
  );

  reminder10Input.value = String(
    normalizeMinutes(
      storedValues[REMINDER_10_MINUTES_KEY],
      DEFAULT_REMINDER_10_MINUTES
    )
  );
}

async function saveReminderSettings(reminder30Input, reminder10Input, statusElement) {
  const reminder30Minutes = normalizeMinutes(
    reminder30Input.value,
    DEFAULT_REMINDER_30_MINUTES
  );

  const reminder10Minutes = normalizeMinutes(
    reminder10Input.value,
    DEFAULT_REMINDER_10_MINUTES
  );

  await chrome.storage.local.set({
    [REMINDER_30_MINUTES_KEY]: reminder30Minutes,
    [REMINDER_10_MINUTES_KEY]: reminder10Minutes
  });

  await chrome.runtime.sendMessage({ type: "RESCHEDULE_REMINDERS" });
  statusElement.textContent = "Settings saved!";
  statusElement.classList.remove("hidden");
  setTimeout(() => {
    statusElement.classList.add("hidden");
  }, 2000);
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

function normalizeMinutes(value, fallback) {
  const parsedValue = Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) return fallback;

  return parsedValue;
}

function populateSoundOptions(select) {
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Default";

  const soundOptions = SOUND_OPTIONS.map((sound) => {
    const option = document.createElement("option");
    option.value = sound.value;
    option.textContent = sound.label;
    return option;
  });

  select.replaceChildren(defaultOption, ...soundOptions);
}

async function loadSelectedSound(select) {
  const storedValues = await chrome.storage.local.get(RING_SOUND_KEY);
  select.value = storedValues[RING_SOUND_KEY] ?? "";
}

async function saveSelectedSound(select) {
  const selectedSound = select.value;

  if (selectedSound) {
    await chrome.storage.local.set({ [RING_SOUND_KEY]: selectedSound });
    return;
  }

  await chrome.storage.local.remove(RING_SOUND_KEY);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!(ringSoundSelect instanceof HTMLSelectElement)) return;

  populateSoundOptions(ringSoundSelect);
  void loadSelectedSound(ringSoundSelect);

  if (settingsForm instanceof HTMLFormElement) {
    settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      void saveSelectedSound(ringSoundSelect);
    });
  }

  ringSoundSelect.addEventListener("change", () => {
    void saveSelectedSound(ringSoundSelect);
  });
});
