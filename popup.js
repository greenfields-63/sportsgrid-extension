document.addEventListener('DOMContentLoaded', async () => {
    try {
        const stored = await chrome.storage.local.get("sportsgrid_urls");
        let urls = stored.sportsgrid_urls;
        if (!urls || !Array.isArray(urls) || urls.length < 4) {
            urls = [
                "https://www.espn.com/watch/",
                "https://www.dazn.com/",
                "https://www.amazon.com/primevideo/",
                "https://tv.apple.com/"
            ];
            await chrome.storage.local.set({ sportsgrid_urls: urls });
        }
        for (let i = 0; i < 4; i++) {
            if (urls[i]) {
                const selectEl = document.getElementById(`q${i}`);
                if (selectEl) {
                    selectEl.value = urls[i];
                }
            }
        }
    } catch (e) {}
});

document.getElementById('save-btn').addEventListener('click', async () => {
    const urls = [
        document.getElementById('q0').value,
        document.getElementById('q1').value,
        document.getElementById('q2').value,
        document.getElementById('q3').value
    ];

    await chrome.storage.local.set({ sportsgrid_urls: urls });
    chrome.runtime.sendMessage({ action: "launch-grid" }, (response) => {
        window.close();
    });
});
