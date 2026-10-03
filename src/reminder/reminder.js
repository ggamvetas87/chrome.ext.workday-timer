const REMINDER_30_MINUTES = 30;
const REMINDER_10_MINUTES = 10;

const params = new URLSearchParams(window.location.search);

const minutes = Number(params.get("minutes"));
const expired = params.get("expired") === "1";

const title = document.getElementById("title");
const message = document.getElementById("message");
const dismiss = document.getElementById("dismiss");

if (expired) {
  title.textContent = "Clock-out time passed";
  message.textContent = "Your clock-out time has already passed";
} else if (minutes === REMINDER_30_MINUTES) {
  message.textContent = `You have ${REMINDER_30_MINUTES} minutes left until clock-out`;
} else {
  message.textContent = `You have only ${REMINDER_10_MINUTES} minute left until clock-out`;
}

if (dismiss) {
  dismiss.addEventListener("click", () => {
    void chrome.runtime.sendMessage({ type: "STOP_RING" });
    window.close();
  });
}
