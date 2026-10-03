const REMINDER_30 = "clockout-reminder-30";
const REMINDER_10 = "clockout-reminder-10";
const CLOCKOUT = "clockout-time";

const DEFAULT_REMINDER_30_MINUTES = 30;
const DEFAULT_REMINDER_10_MINUTES = 10;

const CLOCKOUT_TIMESTAMP_KEY = "clockoutTimestamp";
const REMINDER_30_MINUTES_KEY = "reminder30Minutes";
const REMINDER_10_MINUTES_KEY = "reminder10Minutes";
const RING_SOUND_KEY = "selectedRingSound";

const reminderTemplatePath = "src/reminder/reminder.html";
const offscreenTemplatePath = "src/offscreen/offscreen.html";
const settingsTemplatePath = "src/settings/settings.html";
const iconUrl = chrome.runtime.getURL("src/assets/img/icon128.png");

let audio = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "CLEAR_REMINDERS") {
    void clearReminders();
    return;
  }

  if (message.type === "RESCHEDULE_REMINDERS") {
    void rescheduleReminders();
    return;
  }

  if (message.type === "OPEN_SETTINGS") {
    void openSettingsWindow();
    return;
  }

  if (message.type !== "SCHEDULE_REMINDERS") return;

  void scheduleReminders(Number(message.clockOut));
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "PLAY_RING") {
    void playRing(message.soundPath);
    return;
  }

  if (message.type === "PREVIEW_RING") {
    void previewRing(message.soundPath);
    return;
  }
});

async function clearReminders() {
  await chrome.alarms.clear(REMINDER_30);
  await chrome.alarms.clear(REMINDER_10);
  await chrome.alarms.clear(CLOCKOUT);
  await chrome.storage.local.remove(CLOCKOUT_TIMESTAMP_KEY);
}

async function scheduleReminders(clockOutTimestamp) {
  if (!Number.isFinite(clockOutTimestamp)) return;

  await clearReminders();
  await chrome.storage.local.set({
    [CLOCKOUT_TIMESTAMP_KEY]: clockOutTimestamp
  });

  const now = Date.now();

  if (clockOutTimestamp <= now) {
    await showExpiredReminder();
    return;
  }

  const { reminder30Minutes, reminder10Minutes } = await getReminderThresholds();

  const reminder30 = clockOutTimestamp - reminder30Minutes * 60 * 1000;
  const reminder10 = clockOutTimestamp - reminder10Minutes * 60 * 1000;

  if (reminder30 > now) {
    await chrome.alarms.create(REMINDER_30, { when: reminder30 });
  }

  if (reminder10 > now) {
    await chrome.alarms.create(REMINDER_10, { when: reminder10 });
  }

  await chrome.alarms.create(CLOCKOUT, {
    when: clockOutTimestamp
  });
}

async function rescheduleReminders() {
  const storedValues = await chrome.storage.local.get(CLOCKOUT_TIMESTAMP_KEY);
  const clockOutTimestamp = Number(storedValues[CLOCKOUT_TIMESTAMP_KEY]);

  if (!Number.isFinite(clockOutTimestamp)) return;

  await scheduleReminders(clockOutTimestamp);
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REMINDER_30) {
    void showReminderForThreshold(REMINDER_30_MINUTES_KEY);
    return;
  }

  if (alarm.name === REMINDER_10) {
    void showReminderForThreshold(REMINDER_10_MINUTES_KEY);
    return;
  }

  if (alarm.name === CLOCKOUT) {
    void showExpiredReminder();
  }
});

async function showReminderForThreshold(thresholdKey) {
  const thresholds = await getReminderThresholds();
  const minutes = thresholds[thresholdKey];

  await playRing();

  try {
    await chrome.notifications.create(`clockout-${minutes}-${Date.now()}`, {
      type: "basic",
      iconUrl: iconUrl,
      title: "⏰ Clock-out reminder",
      message: `You have ${minutes} minute${minutes === 1 ? "" : "s"} left until your calculated clock-out time.`,
      priority: 2,
      requireInteraction: true
    });
  } catch (error) {
    console.error("Could not show notification:", error);
  }

  await openReminderWindow({ minutes });
}

async function showExpiredReminder() {
  await playRing();

  try {
    await chrome.notifications.create(`clockout-expired-${Date.now()}`, {
      type: "basic",
      iconUrl: iconUrl,
      title: "⏰ Clock-out reminder",
      message: "Your clock-out time has already passed.",
      priority: 2,
      requireInteraction: true
    });
  } catch (error) {
    console.error("Could not show notification:", error);
  }

  await openReminderWindow({ expired: true });
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
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) return fallback;

  return Math.floor(parsedValue);
}

async function playRing() {
  try {
    const hasDocument = await chrome.offscreen.hasDocument();

    if (!hasDocument) {
      await chrome.offscreen.createDocument({
        url: offscreenTemplatePath,
        reasons: ["AUDIO_PLAYBACK"],
        justification: "Play a reminder sound when a workday timer fires"
      });
    }

    const storedValues = await chrome.storage.local.get(RING_SOUND_KEY);
    const ringSound = storedValues[RING_SOUND_KEY];

    await chrome.runtime.sendMessage(
      ringSound ? { type: "PLAY_RING", soundPath: ringSound } : { type: "PLAY_RING" }
    );
  } catch (error) {
    console.error("Could not play reminder sound:", error);
  }
}

function getDefaultSoundUrl() {
  return chrome.runtime.getURL("src/assets/sounds/<your-default-sound-file>.mp3");
}

async function openReminderWindow({ minutes, expired = false }) {
  const params = expired ? "expired=1" : `minutes=${minutes}`;
  const url = chrome.runtime.getURL(`${reminderTemplatePath}?${params}`);

  const existingWindow = await findExistingReminderWindow();

  if (existingWindow) {
    const [tab] = existingWindow.tabs;

    if (tab?.id != null) {
      await chrome.tabs.update(tab.id, { url });
    }

    if (existingWindow.id != null) {
      await chrome.windows.update(existingWindow.id, {
        focused: true
      });
    }

    return;
  }

  await chrome.windows.create({
    url,
    type: "popup",
    width: 420,
    height: 300,
    focused: true
  });
}

async function openSettingsWindow() {
  const url = chrome.runtime.getURL(settingsTemplatePath);
  const existingWindow = await findExistingSettingsWindow();

  if (existingWindow) {
    const [tab] = existingWindow.tabs;

    if (tab?.id != null) {
      await chrome.tabs.update(tab.id, { url });
    }

    if (existingWindow.id != null) {
      await chrome.windows.update(existingWindow.id, {
        focused: true
      });
    }

    return;
  }

  await chrome.windows.create({
    url,
    type: "popup",
    width: 420,
    height: 320,
    focused: true
  });
}

async function findExistingReminderWindow() {
  const windows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ["popup"]
  });

  const reminderUrlPrefix = chrome.runtime.getURL(reminderTemplatePath);

  return windows.find((window) =>
    window.tabs?.some((tab) =>
      tab.url?.startsWith(reminderUrlPrefix)
    )
  );
}

async function findExistingSettingsWindow() {
  const windows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ["popup"]
  });

  const settingsUrlPrefix = chrome.runtime.getURL(settingsTemplatePath);

  return windows.find((window) =>
    window.tabs?.some((tab) =>
      tab.url?.startsWith(settingsUrlPrefix)
    )
  );
}

async function previewRing(soundPath) {
  try {
    const hasDocument = await chrome.offscreen.hasDocument();

    if (!hasDocument) {
      await chrome.offscreen.createDocument({
        url: offscreenTemplatePath,
        reasons: ["AUDIO_PLAYBACK"],
        justification: "Preview reminder sound from popup"
      });
    }

    await chrome.runtime.sendMessage({
      type: "PREVIEW_RING",
      soundPath: soundPath ?? ""
    });
  } catch (error) {
    console.error("Could not preview reminder sound:", error);
  }
}
