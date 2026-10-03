const RING_SOUND_KEY = "selectedRingSound";

let activeAudio = null;
let activeAudioContext = null;
let activeOscillator = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "PLAY_RING") {
    void playRing(message.soundPath);
    return;
  }

  if (message.type === "STOP_RING") {
    stopRing();
  }
});

async function playRing(soundPath) {
  stopRing();

  if (soundPath) {
    const played = await playAudioSound(soundPath);
    if (played) return;
  }

  await playDefaultTone();
}

async function playAudioSound(soundPath) {
  try {
    activeAudio = new Audio(chrome.runtime.getURL(soundPath));
    activeAudio.preload = "auto";
    activeAudio.volume = 1;

    await activeAudio.play();
    return true;
  } catch (error) {
    console.error("Could not play custom reminder sound:", error);
    return false;
  }
}

async function playDefaultTone() {
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

  activeOscillator.start();
  activeOscillator.stop(activeAudioContext.currentTime + 0.7);

  activeOscillator.addEventListener("ended", () => {
    stopRing();
  });
}

function stopRing() {
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
