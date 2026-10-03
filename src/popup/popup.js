const timeInput = document.getElementById("time");
const clearTimeButton = document.getElementById("clear-time");

const workDurationInput = document.getElementById("workDuration");
const clearWorkDurationButton = document.getElementById("clear-work-duration");

const reminder30Input = document.getElementById("reminder30Minutes");
const clearReminder30Button = document.getElementById("clear-reminder30");

const reminder10Input = document.getElementById("reminder10Minutes");
const clearReminder10Button = document.getElementById("clear-reminder10");

const ringSoundSelect = document.getElementById("ringSound");

const calculateButton = document.getElementById("calculate");
const startNowButton = document.getElementById("start-now");
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
const DEFAULT_WORK_DURATION_MINUTES = 8 * 60 + 30;

const WORK_DURATION_KEY = "workDurationMinutes";
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
  { value: "src/assets/sounds/ti-les-more-maimou-tou-pharao.mp3", label: "Ti Les More Maimou Tou Pharao" },
  { value: "src/assets/sounds/snoop-dog.mp3", label: "Snoop Dog" },
  { value: "src/assets/sounds/e33-lumiere.mp3", label: "Expedition 33 - Lumiere" },
  { value: "src/assets/sounds/monoco-theme.mp3", label: "Expedition 33 - Monoco theme" },
  { value: "src/assets/sounds/final-fantasy-vii-victory-fanfare.mp3", label: "FFVII Victory fanfare" },
  { value: "src/assets/sounds/mgs-rules-of-nature.mp3", label: "MGS - Rules of nature" },
  { value: "src/assets/sounds/mgs-gameover.mp3", label: "MGS - Gameover" }
];

const backButton = document.getElementById("back-button");
const previewRingSoundButton = document.getElementById("preview-ring-sound");
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
    reminderStatus.classList.add("hidden");
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
function calculateDate(startTime, workDurationMinutes) {
  const now = new Date();

  const start = new Date(now);

  start.setHours(
    startTime.hours,
    startTime.minutes,
    0,
    0
  );

  const clockOut = new Date(
    start.getTime() + workDurationMinutes * 60 * 1000
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
    error.textContent = "Please enter a valid time, e.g. 08:30.";
    error.classList.remove("hidden");
    result.classList.add("hidden");
    return;
  }

  error.classList.add("hidden");

  const workDurationMinutes = await getWorkDurationMinutes();
  const clockOutDate = calculateDate(parsed, workDurationMinutes);
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
  workDurationInput instanceof HTMLInputElement &&
  resetDefaultsButton instanceof HTMLButtonElement &&
  settingsStatus instanceof HTMLDivElement
) {
  void loadReminderSettings(reminder30Input, reminder10Input);
  void loadWorkDurationSetting(workDurationInput);

  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveReminderSettings(reminder30Input, reminder10Input, settingsStatus);
    void saveWorkDurationSetting(workDurationInput, settingsStatus);
  });

  resetDefaultsButton.addEventListener("click", () => {
    reminder30Input.value = String(DEFAULT_REMINDER_30_MINUTES);
    reminder10Input.value = String(DEFAULT_REMINDER_10_MINUTES);
    workDurationInput.value = formatDuration(DEFAULT_WORK_DURATION_MINUTES);
  });
}

function showSettingsView() {
  if (mainView instanceof HTMLElement) mainView.classList.add("hidden");
  if (settingsView instanceof HTMLElement) settingsView.classList.remove("hidden");
}

function showMainView() {
  if (settingsView instanceof HTMLElement) settingsView.classList.add("hidden");
  if (mainView instanceof HTMLElement) mainView.classList.remove("hidden");
}

if (settingsButton instanceof HTMLButtonElement) {
  settingsButton.addEventListener("click", showSettingsView);
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

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

function parseDuration(value) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function normalizeDuration(value, fallback) {
  const parsedValue = Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) return fallback;

  return parsedValue;
}

function getWorkDurationMinutes() {
  return chrome.storage.local.get(WORK_DURATION_KEY).then((storedValues) =>
    normalizeDuration(storedValues[WORK_DURATION_KEY], DEFAULT_WORK_DURATION_MINUTES)
  );
}

/**
 * Calculate clock-out date
 */
function calculateDate(startTime, workDurationMinutes) {
  const now = new Date();

  const start = new Date(now);

  start.setHours(
    startTime.hours,
    startTime.minutes,
    0,
    0
  );

  const clockOut = new Date(
    start.getTime() + workDurationMinutes * 60 * 1000
  );

  return clockOut;
}

/**
 * Calculate and save timer
 */
async function calculate() {
  const parsed = parseTime(timeInput.value);

  if (!parsed) {
    error.textContent = "Please enter a valid time, e.g. 08:30.";
    error.classList.remove("hidden");
    result.classList.add("hidden");
    return;
  }

  error.classList.add("hidden");

  const workDurationMinutes = await getWorkDurationMinutes();
  const clockOutDate = calculateDate(parsed, workDurationMinutes);
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

async function loadWorkDurationSetting(input) {
  const storedValues = await chrome.storage.local.get(WORK_DURATION_KEY);
  input.value = formatDuration(
    normalizeDuration(storedValues[WORK_DURATION_KEY], DEFAULT_WORK_DURATION_MINUTES)
  );
}

async function saveWorkDurationSetting(input, statusElement) {
  const parsedDuration = parseDuration(input.value);

  const workDurationMinutes = parsedDuration ?? DEFAULT_WORK_DURATION_MINUTES;

  input.value = formatDuration(workDurationMinutes);

  await chrome.storage.local.set({
    [WORK_DURATION_KEY]: workDurationMinutes
  });

  statusElement.textContent = "Settings saved!";
  statusElement.classList.remove("hidden");
  setTimeout(() => {
    statusElement.classList.add("hidden");
  }, 2000);
}

if (
  settingsForm instanceof HTMLFormElement &&
  reminder30Input instanceof HTMLInputElement &&
  reminder10Input instanceof HTMLInputElement &&
  workDurationInput instanceof HTMLInputElement &&
  resetDefaultsButton instanceof HTMLButtonElement &&
  settingsStatus instanceof HTMLDivElement
) {
  void loadReminderSettings(reminder30Input, reminder10Input);
  void loadWorkDurationSetting(workDurationInput);

  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveReminderSettings(reminder30Input, reminder10Input, settingsStatus);
    void saveWorkDurationSetting(workDurationInput, settingsStatus);
  });

  resetDefaultsButton.addEventListener("click", () => {
    reminder30Input.value = String(DEFAULT_REMINDER_30_MINUTES);
    reminder10Input.value = String(DEFAULT_REMINDER_10_MINUTES);
    workDurationInput.value = formatDuration(DEFAULT_WORK_DURATION_MINUTES);
  });
}

let isPreviewPlaying = false;
let activePreviewId = 0;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "RING_STOPPED") return;

  isPreviewPlaying = false;

  if (previewRingSoundButton instanceof HTMLButtonElement) {
    previewRingSoundButton.textContent = "Play sound";
  }
});

function togglePreviewSound() {
  if (
    !(ringSoundSelect instanceof HTMLSelectElement) ||
    !(previewRingSoundButton instanceof HTMLButtonElement)
  ) return;

  if (isPreviewPlaying) {
    void chrome.runtime.sendMessage({
      type: "STOP_RING",
      previewId: activePreviewId
    });

    isPreviewPlaying = false;
    previewRingSoundButton.textContent = "Play sound";
    return;
  }

  activePreviewId += 1;

  void chrome.runtime.sendMessage({
    type: "PREVIEW_RING",
    soundPath: ringSoundSelect.value,
    previewId: activePreviewId
  });

  isPreviewPlaying = true;
  previewRingSoundButton.textContent = "Stop sound";
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

  void loadSelectedSound(ringSoundSelect).finally(() => {
    isLoadingRingSound = false;
  });

  if (previewRingSoundButton instanceof HTMLButtonElement) {
    previewRingSoundButton.addEventListener("click", togglePreviewSound);
  }

  ringSoundSelect.addEventListener("change", () => {
    if (isLoadingRingSound) return;

    stopPreviewSound();
    void saveSelectedSound(ringSoundSelect);
  });

  if (settingsForm instanceof HTMLFormElement) {
    settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      void saveSelectedSound(ringSoundSelect);
    });
  }
});

if (startNowButton instanceof HTMLButtonElement && timeInput instanceof HTMLInputElement) {
  startNowButton.addEventListener("click", () => {
    timeInput.value = getCurrentTimeValue();
    timeInput.dispatchEvent(new Event("input", { bubbles: true }));
    timeInput.focus();
    void calculate();

    // Send a message to the active tab to trigger the check-in action
    // Used for triggering the HRMS Hub ClockIn / CheckIn for myErgani
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const [activeTab] = tabs;

      if (!activeTab?.id) return;

      chrome.tabs.sendMessage(activeTab.id, { type: "CLICK_CHECKIN" }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        }
      });
    });
  });
}

function getCurrentTimeValue() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function attachFormattedTimeInput(input, onValueChanged) {
  if (!(input instanceof HTMLInputElement)) return;

  input.addEventListener("input", () => {
    const caretPosition = input.selectionStart ?? input.value.length;
    const digitIndex = getDigitIndex(input.value, caretPosition);

    input.value = formatTimeInput(input.value);

    const nextCaretPosition = getCaretPosition(input.value, digitIndex);
    input.setSelectionRange(nextCaretPosition, nextCaretPosition);

    if (typeof onValueChanged === "function") onValueChanged();
  });

  input.addEventListener("paste", (event) => {
    event.preventDefault();

    const pastedText = event.clipboardData.getData("text");
    input.value = formatTimeInput(pastedText);

    if (typeof onValueChanged === "function") onValueChanged();
  });

  input.addEventListener("blur", () => {
    input.value = formatTimeInput(input.value);
  });
}

// Replace the existing start time listeners with this:
attachFormattedTimeInput(timeInput, () => {
  error.classList.add("hidden");
});

// Add this for work duration too:
attachFormattedTimeInput(workDurationInput);

document.addEventListener("DOMContentLoaded", () => {
  bindClearButton(timeInput, clearTimeButton);
  bindClearButton(workDurationInput, clearWorkDurationButton);
  bindClearButton(reminder30Input, clearReminder30Button);
  bindClearButton(reminder10Input, clearReminder10Button);

  syncClearButtonVisibility(timeInput, clearTimeButton);
  syncClearButtonVisibility(workDurationInput, clearWorkDurationButton);
  syncClearButtonVisibility(reminder30Input, clearReminder30Button);
  syncClearButtonVisibility(reminder10Input, clearReminder10Button);
});

function bindClearButton(input, button) {
  if (!(input instanceof HTMLInputElement)) return;
  if (!(button instanceof HTMLButtonElement)) return;

  syncClearButtonVisibility(input, button);

  input.addEventListener("input", () => {
    syncClearButtonVisibility(input, button);
  });

  button.addEventListener("click", () => {
    if (input.value.trim() === "") return;

    clearInput(input, button);
  });
}

function syncClearButtonVisibility(input, button) {
  if (!(input instanceof HTMLInputElement)) return;
  if (!(button instanceof HTMLButtonElement)) return;

  button.hidden = input.value.trim() === "";
}

function clearInput(input, button) {
  if (!(input instanceof HTMLInputElement)) return;

  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));

  if (button instanceof HTMLButtonElement) {
    button.hidden = true;
  }

  input.focus();
}

function stopPreviewSound() {
  if (!isPreviewPlaying) return;

  void chrome.runtime.sendMessage({
    type: "STOP_RING",
    previewId: activePreviewId
  });

  isPreviewPlaying = false;

  if (previewRingSoundButton instanceof HTMLButtonElement) {
    previewRingSoundButton.textContent = "Play sound";
  }
}
