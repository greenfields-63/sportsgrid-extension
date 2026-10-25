/**
 * SportsGrid Background Service Worker - Persistent quadrant slot tracking (zero unedited reloads), Alt+M, and Alt+C.
 */

chrome.runtime.onInstalled.addListener(() => {
    console.log("[SportsGrid] Extension installed.");
});

chrome.commands.onCommand.addListener(async (command) => {
    if (command === "open-menu") {
        await chrome.windows.create({
            url: "popup.html",
            type: "popup",
            width: 320,
            height: 520
        });
    } else if (command === "sound-menu") {
        await chrome.windows.create({
            url: "sound.html",
            type: "popup",
            width: 280,
            height: 260
        });
    } else if (command === "vpn-toggle") {
        await chrome.windows.create({
            url: "vpn.html",
            type: "popup",
            width: 280,
            height: 180
        });
    } else if (command === "close-grid") {
        closeGridWindows();
    }
});

async function closeGridWindows() {
    try {
        const stored = await chrome.storage.local.get("sportsgrid_window_ids");
        if (stored.sportsgrid_window_ids && Array.isArray(stored.sportsgrid_window_ids)) {
            for (const winId of stored.sportsgrid_window_ids) {
                if (winId) {
                    try { await chrome.windows.remove(winId); } catch (e) {}
                }
            }
        }
        await chrome.storage.local.remove("sportsgrid_window_ids");
    } catch (e) {}
}

async function applyAudioFocus(defaultAudioIndex) {
    try {
        const stored = await chrome.storage.local.get(["sportsgrid_window_ids", "sportsgrid_audio_index"]);
        const windowIds = stored.sportsgrid_window_ids || [];
        const audioIdx = typeof stored.sportsgrid_audio_index === 'number' ? stored.sportsgrid_audio_index : defaultAudioIndex;

        await chrome.storage.local.set({ sportsgrid_audio_index: audioIdx });

        for (let i = 0; i < windowIds.length; i++) {
            const winId = windowIds[i];
            if (!winId) continue;
            const shouldMute = (i !== audioIdx);
            try {
                const tabs = await chrome.tabs.query({ windowId: winId, active: true });
                for (const tab of tabs) {
                    await chrome.tabs.update(tab.id, { muted: shouldMute });
                }
            } catch (e) {}
        }
    } catch (e) {}
}

async function launchGrid() {
    let urls = [
        "https://www.espn.com/watch/",
        "https://www.dazn.com/",
        "https://www.amazon.com/primevideo/",
        "https://tv.apple.com/"
    ];
    let defaultAudioIndex = 0;

    try {
        const stored = await chrome.storage.local.get(["sportsgrid_urls", "sportsgrid_audio_index", "sportsgrid_window_ids"]);
        if (stored.sportsgrid_urls && Array.isArray(stored.sportsgrid_urls)) {
            urls = stored.sportsgrid_urls;
        }
        if (typeof stored.sportsgrid_audio_index === 'number') {
            defaultAudioIndex = stored.sportsgrid_audio_index;
        }
    } catch (e) {}

    const screenWidth = 1440;
    const screenHeight = 900;
    const halfWidth = Math.floor(screenWidth / 2);
    const halfHeight = Math.floor(screenHeight / 2);

    const boundsList = [
        { left: 0, top: 0, width: halfWidth, height: halfHeight },
        { left: halfWidth, top: 0, width: screenWidth - halfWidth, height: halfHeight },
        { left: 0, top: halfHeight, width: halfWidth, height: screenHeight - halfHeight },
        { left: halfWidth, top: halfHeight, width: screenWidth - halfWidth, height: screenHeight - halfHeight }
    ];

    let currentWindowIds = [null, null, null, null];
    try {
        const stored = await chrome.storage.local.get("sportsgrid_window_ids");
        if (stored.sportsgrid_window_ids && Array.isArray(stored.sportsgrid_window_ids)) {
            currentWindowIds = stored.sportsgrid_window_ids;
        }
    } catch (e) {}

    const newWindowIds = [null, null, null, null];

    for (let i = 0; i < 4; i++) {
        if (!urls[i]) continue;
        const targetUrl = urls[i];
        const b = boundsList[i];
        const existingWinId = currentWindowIds[i];

        let windowExists = false;
        if (existingWinId) {
            try {
                const win = await chrome.windows.get(existingWinId, { populate: true });
                if (win && win.type === "popup") {
                    windowExists = true;
                    // Update bounds
                    await chrome.windows.update(win.id, {
                        left: b.left,
                        top: b.top,
                        width: b.width,
                        height: b.height,
                        focused: true
                    });
                    // Update URL ONLY if changed
                    if (win.tabs && win.tabs[0]) {
                        const currentTabUrl = win.tabs[0].url || "";
                        if (currentTabUrl !== targetUrl) {
                            await chrome.tabs.update(win.tabs[0].id, { url: targetUrl });
                        }
                    }
                    newWindowIds[i] = win.id;
                }
            } catch (err) {}
        }

        if (!windowExists) {
            try {
                const newWin = await chrome.windows.create({
                    url: targetUrl,
                    type: "popup",
                    left: b.left,
                    top: b.top,
                    width: b.width,
                    height: b.height
                });
                if (newWin && newWin.id) {
                    newWindowIds[i] = newWin.id;
                }
            } catch (err) {
                console.error("[SportsGrid] Error creating window:", err);
            }
        }
    }

    await chrome.storage.local.set({ sportsgrid_window_ids: newWindowIds });

    for (const oldId of currentWindowIds) {
        if (oldId && !newWindowIds.includes(oldId)) {
            try { await chrome.windows.remove(oldId); } catch (e) {}
        }
    }

    setTimeout(() => {
        applyAudioFocus(defaultAudioIndex);
    }, 1000);
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "launch-grid") {
        launchGrid();
        sendResponse({ success: true });
    } else if (request.action === "update-audio") {
        applyAudioFocus(request.audioIndex);
        sendResponse({ success: true });
    } else if (request.action === "make-active-audio") {
        if (sender.tab && sender.tab.windowId) {
            try {
                const stored = await chrome.storage.local.get("sportsgrid_window_ids");
                const windowIds = stored.sportsgrid_window_ids || [];
                const index = windowIds.indexOf(sender.tab.windowId);
                if (index !== -1) {
                    applyAudioFocus(index);
                }
            } catch (e) {}
        }
        sendResponse({ success: true });
    }
});
