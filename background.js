/**
 * SportsGrid Background Service Worker - Programmatic script injection (exclusive to grid windows), slot tracking, and Alt shortcuts.
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
    } else if (command === "close-grid") {
        closeGridWindows();
    }
});

async function getSortedSportsWindows() {
    try {
        const windows = await chrome.windows.getAll({ populate: true });
        const sportsWins = windows.filter(win => {
            return win.type === "popup" && win.tabs && win.tabs.some(tab => tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://")));
        });
        sportsWins.sort((a, b) => {
            const topDiff = (a.top || 0) - (b.top || 0);
            if (Math.abs(topDiff) > 50) return topDiff;
            return (a.left || 0) - (b.left || 0);
        });
        return sportsWins;
    } catch (e) {
        return [];
    }
}

async function closeGridWindows() {
    try {
        const sportsWins = await getSortedSportsWindows();
        for (const win of sportsWins) {
            try { await chrome.windows.remove(win.id); } catch (e) {}
        }
        await chrome.storage.local.remove("sportsgrid_window_ids");
    } catch (e) {}
}

async function applyAudioFocus(defaultAudioIndex) {
    try {
        const sportsWins = await getSortedSportsWindows();
        await chrome.storage.local.set({ sportsgrid_audio_index: defaultAudioIndex });

        for (let i = 0; i < sportsWins.length; i++) {
            const shouldMute = (i !== defaultAudioIndex);
            const win = sportsWins[i];
            for (const tab of win.tabs) {
                await chrome.tabs.update(tab.id, { muted: shouldMute });
                try {
                    await chrome.tabs.sendMessage(tab.id, { action: "update-speaker-state", isMuted: shouldMute });
                } catch (e) {}
            }
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

        let targetHost = "";
        try { targetHost = new URL(targetUrl).hostname; } catch(e) {}

        let windowExists = false;
        if (existingWinId) {
            try {
                const win = await chrome.windows.get(existingWinId, { populate: true });
                if (win && win.type === "popup") {
                    windowExists = true;
                    await chrome.windows.update(win.id, {
                        left: b.left,
                        top: b.top,
                        width: b.width,
                        height: b.height,
                        focused: true
                    });
                    if (win.tabs && win.tabs[0]) {
                        const currentTabUrl = win.tabs[0].url || "";
                        let currentHost = "";
                        try { currentHost = new URL(currentTabUrl).hostname; } catch(e) {}

                        if (!targetHost || !currentHost || (!currentHost.includes(targetHost) && !targetHost.includes(currentHost))) {
                            await chrome.tabs.update(win.tabs[0].id, { url: targetUrl });
                            setTimeout(async () => {
                                try {
                                    await chrome.scripting.executeScript({
                                        target: { tabId: win.tabs[0].id },
                                        files: ['content.js']
                                    });
                                } catch (e) {}
                            }, 2500);
                        } else {
                            try {
                                await chrome.scripting.executeScript({
                                    target: { tabId: win.tabs[0].id },
                                    files: ['content.js']
                                });
                            } catch (e) {}
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
                    setTimeout(async () => {
                        try {
                            const tabs = await chrome.tabs.query({ windowId: newWin.id });
                            if (tabs[0]) {
                                await chrome.scripting.executeScript({
                                    target: { tabId: tabs[0].id },
                                    files: ['content.js']
                                });
                            }
                        } catch (e) {}
                    }, 3000);
                }
            } catch (err) {
                console.error("[SportsGrid] Error creating window:", err);
            }
        }
    }

    await chrome.storage.local.set({ sportsgrid_window_ids: newWindowIds });

    let existingSportsWins = await getSortedSportsWindows();
    for (const win of existingSportsWins) {
        if (!newWindowIds.includes(win.id)) {
            try { await chrome.windows.remove(win.id); } catch (e) {}
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
                const sportsWins = await getSortedSportsWindows();
                const index = sportsWins.findIndex(win => win.id === sender.tab.windowId);
                if (index !== -1) {
                    applyAudioFocus(index);
                }
            } catch (e) {}
        }
        sendResponse({ success: true });
    }
});
