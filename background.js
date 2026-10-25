/**
 * SportsGrid Background Service Worker - Dynamic screen resolution detection, 1-to-1 quadrant mapping, Alt+M, and Alt+C.
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
        const stored = await chrome.storage.local.get(["sportsgrid_urls", "sportsgrid_audio_index"]);
        if (stored.sportsgrid_urls && Array.isArray(stored.sportsgrid_urls)) {
            urls = stored.sportsgrid_urls;
        }
        if (typeof stored.sportsgrid_audio_index === 'number') {
            defaultAudioIndex = stored.sportsgrid_audio_index;
        }
    } catch (e) {}

    // Dynamically query user's actual monitor screen dimensions
    let screenWidth = 1440;
    let screenHeight = 900;
    let startX = 0;
    let startY = 0;

    try {
        const displayInfo = await chrome.system.display.getInfo();
        const primary = displayInfo.find(d => d.isPrimary) || displayInfo[0];
        if (primary && primary.workArea) {
            screenWidth = primary.workArea.width;
            screenHeight = primary.workArea.height;
            startX = primary.workArea.left || 0;
            startY = primary.workArea.top || 0;
        }
    } catch (e) {}

    const halfWidth = Math.floor(screenWidth / 2);
    const halfHeight = Math.floor(screenHeight / 2);

    const boundsList = [
        { left: startX, top: startY, width: halfWidth, height: halfHeight },
        { left: startX + halfWidth, top: startY, width: screenWidth - halfWidth, height: halfHeight },
        { left: startX, top: startY + halfHeight, width: halfWidth, height: screenHeight - halfHeight },
        { left: startX + halfWidth, top: startY + halfHeight, width: screenWidth - halfWidth, height: screenHeight - halfHeight }
    ];

    let existingWindows = await getSortedSportsWindows();
    const newWindowIds = [null, null, null, null];

    for (let i = 0; i < 4; i++) {
        if (!urls[i]) continue;
        const targetUrl = urls[i];
        const b = boundsList[i];

        let targetHost = "";
        try { targetHost = new URL(targetUrl).hostname; } catch(e) {}

        let matchedWin = null;
        const matchingWinIndex = existingWindows.findIndex(win => {
            return win.tabs.some(tab => {
                if (!tab.url) return false;
                try {
                    const tabHost = new URL(tab.url).hostname;
                    return targetHost && (tabHost.includes(targetHost) || targetHost.includes(tabHost));
                } catch(e) {
                    return false;
                }
            });
        });

        if (matchingWinIndex !== -1) {
            matchedWin = existingWindows.splice(matchingWinIndex, 1)[0];
            try {
                await chrome.windows.update(matchedWin.id, {
                    left: b.left,
                    top: b.top,
                    width: b.width,
                    height: b.height,
                    focused: true
                });
                if (matchedWin.tabs && matchedWin.tabs[0]) {
                    const currentTabUrl = matchedWin.tabs[0].url || "";
                    let currentHost = "";
                    try { currentHost = new URL(currentTabUrl).hostname; } catch(e) {}

                    if (!targetHost || !currentHost || (!currentHost.includes(targetHost) && !targetHost.includes(currentHost))) {
                        await chrome.tabs.update(matchedWin.tabs[0].id, { url: targetUrl });
                    }
                }
                newWindowIds[i] = matchedWin.id;
            } catch (err) {}
        } else {
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

    for (const leftoverWin of existingWindows) {
        try { await chrome.windows.remove(leftoverWin.id); } catch (e) {}
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
