/**
 * SportsGrid Background Service Worker - Unrestricted custom URL support, smart window recycling, default audio selector, Alt+M, and Alt+C.
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
        let savedUrls = [];
        const stored = await chrome.storage.local.get("sportsgrid_urls");
        if (stored.sportsgrid_urls && Array.isArray(stored.sportsgrid_urls)) {
            savedUrls = stored.sportsgrid_urls.map(u => {
                try { return new URL(u).hostname; } catch(e) { return ""; }
            }).filter(Boolean);
        }

        const windows = await chrome.windows.getAll({ populate: true });
        for (const win of windows) {
            if (win.type === "popup" && win.tabs) {
                const isSportsWindow = win.tabs.some(tab => {
                    if (!tab.url) return false;
                    try {
                        const tabHost = new URL(tab.url).hostname;
                        // Match any popup window whose host matches any saved URL or custom domain
                        return savedUrls.some(h => tabHost.includes(h) || h.includes(tabHost));
                    } catch(e) {
                        return false;
                    }
                });
                if (isSportsWindow) {
                    await chrome.windows.remove(win.id);
                }
            }
        }
    } catch (e) {}
}

async function applyAudioFocus(defaultAudioIndex) {
    try {
        let savedUrls = [];
        const stored = await chrome.storage.local.get(["sportsgrid_urls", "sportsgrid_audio_index"]);
        if (stored.sportsgrid_urls && Array.isArray(stored.sportsgrid_urls)) {
            savedUrls = stored.sportsgrid_urls.map(u => {
                try { return new URL(u).hostname; } catch(e) { return ""; }
            }).filter(Boolean);
        }
        const audioIdx = typeof stored.sportsgrid_audio_index === 'number' ? stored.sportsgrid_audio_index : defaultAudioIndex;

        const windows = await chrome.windows.getAll({ populate: true });
        const sportsWindows = windows.filter(win => {
            return win.type === "popup" && win.tabs && win.tabs.some(tab => {
                if (!tab.url) return false;
                try {
                    const tabHost = new URL(tab.url).hostname;
                    return savedUrls.some(h => tabHost.includes(h) || h.includes(tabHost));
                } catch(e) {
                    return false;
                }
            });
        });

        for (let i = 0; i < sportsWindows.length; i++) {
            const shouldMute = (i !== audioIdx);
            const win = sportsWindows[i];
            for (const tab of win.tabs) {
                await chrome.tabs.update(tab.id, { muted: shouldMute });
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

    let savedHosts = [];
    try {
        savedHosts = urls.map(u => {
            try { return new URL(u).hostname; } catch(e) { return ""; }
        }).filter(Boolean);
    } catch(e) {}

    let existingWindows = [];
    try {
        const windows = await chrome.windows.getAll({ populate: true });
        existingWindows = windows.filter(win => {
            return win.type === "popup" && win.tabs && win.tabs.some(tab => {
                if (!tab.url) return false;
                try {
                    const tabHost = new URL(tab.url).hostname;
                    return savedHosts.some(h => tabHost.includes(h) || h.includes(tabHost));
                } catch(e) {
                    return false;
                }
            });
        });
    } catch (e) {}

    for (let i = 0; i < urls.length; i++) {
        if (!urls[i]) continue;
        const targetUrl = urls[i];
        const b = boundsList[i];
        let targetHost = "";
        try { targetHost = new URL(targetUrl).hostname; } catch(e) {}

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
            const matchedWin = existingWindows.splice(matchingWinIndex, 1)[0];
            try {
                await chrome.windows.update(matchedWin.id, {
                    left: b.left,
                    top: b.top,
                    width: b.width,
                    height: b.height,
                    focused: true
                });
            } catch (err) {}
        } else {
            try {
                await chrome.windows.create({
                    url: targetUrl,
                    type: "popup",
                    left: b.left,
                    top: b.top,
                    width: b.width,
                    height: b.height
                });
            } catch (err) {
                console.error("[SportsGrid] Error creating window:", err);
            }
        }
    }

    for (const leftoverWin of existingWindows) {
        try {
            await chrome.windows.remove(leftoverWin.id);
        } catch (e) {}
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
                let savedHosts = [];
                const stored = await chrome.storage.local.get("sportsgrid_urls");
                if (stored.sportsgrid_urls && Array.isArray(stored.sportsgrid_urls)) {
                    savedHosts = stored.sportsgrid_urls.map(u => {
                        try { return new URL(u).hostname; } catch(e) { return ""; }
                    }).filter(Boolean);
                }

                const windows = await chrome.windows.getAll({ populate: true });
                const sportsWindows = windows.filter(win => {
                    return win.type === "popup" && win.tabs && win.tabs.some(tab => {
                        if (!tab.url) return false;
                        try {
                            const tabHost = new URL(tab.url).hostname;
                            return savedHosts.some(h => tabHost.includes(h) || h.includes(tabHost));
                        } catch(e) {
                            return false;
                        }
                    });
                });
                const index = sportsWindows.findIndex(win => win.id === sender.tab.windowId);
                if (index !== -1) {
                    applyAudioFocus(index);
                }
            } catch (e) {}
        }
        sendResponse({ success: true });
    }
});
