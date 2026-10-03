const RING_SOUND_KEY = "selectedRingSound";

let activeAudio = null;
let activeAudioContext = null;
let activeOscillator = null;
let activePreviewId = null;
let activePlaybackToken = 0;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "PLAY_RING" || message.type === "PREVIEW_RING") {
    void playRing(message.soundPath, message.previewId ?? null);
    return;
  }

  if (message.type === "STOP_RING") {
    activePlaybackToken += 1;
    stopRing(message.previewId ?? activePreviewId);
  }
});

async function playRing(soundPath, previewId) {
  activePlaybackToken += 1;
  const playbackToken = activePlaybackToken;

  stopCurrentPlayback();
  activePreviewId = previewId;

  if (soundPath) {
    const played = await playAudioSound(soundPath, previewId, playbackToken);
    if (played) return;

    if (playbackToken === activePlaybackToken) {
      console.error(`Could not play selected sound: ${soundPath}`);
    }

    return;
  }

  await playDefaultTone(previewId);
}

async function playAudioSound(soundPath, previewId, playbackToken) {
  try {
    const soundUrl = chrome.runtime.getURL(soundPath);

    activeAudio = new Audio(soundUrl);
    activeAudio.preload = "auto";
    activeAudio.volume = 1;

    activeAudio.addEventListener("ended", () => notifyRingStopped(previewId), { once: true });

    await activeAudio.play();
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return false;
    if (playbackToken !== activePlaybackToken) return false;

    console.error(`Could not play selected sound: ${soundPath}`, error);
    return false;
  }
}

async function playDefaultTone(previewId) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  activeAudioContext = new AudioContext();

  await activeAudioContext.resume();

  activeOscillator = activeAudioContext.createOscillator();
  const gain = activeAudioContext.createGain();

  activeOscillator.type = "sine";
  activeOscillator.frequency.value = 880;

  gain.gain.setValueAtTime(0.001, activeAudioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.25, activeAudioContext.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, activeAudioContext.currentTime + 0.7);

  activeOscillator.connect(gain);
  gain.connect(activeAudioContext.destination);

  activeOscillator.addEventListener("ended", () => {
    stopRing(previewId);
  });

  activeOscillator.start();
  activeOscillator.stop(activeAudioContext.currentTime + 0.7);
}

function stopCurrentPlayback() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }

  if (activeOscillator) {
    try {
      activeOscillator.stop();
    } catch {
      // ignored
    }

    activeOscillator = null;
  }

  if (activeAudioContext) {
    void activeAudioContext.close();
    activeAudioContext = null;
  }
}

function stopRing(previewId) {
  stopCurrentPlayback();
  notifyRingStopped(previewId);
  activePreviewId = null;
}

function notifyRingStopped(previewId) {
  void chrome.runtime.sendMessage({
    type: "RING_STOPPED",
    previewId
  });
}
