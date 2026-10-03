chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== "CLICK_CHECKIN") return;

    const button = document.querySelector('button[data-bind*="click:checkIn"]');

    if (!(button instanceof HTMLButtonElement)) return;
    if (button.disabled) return;

    button.click();
});
