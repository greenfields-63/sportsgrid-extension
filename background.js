/**
 * SportsGrid Background Service Worker - Smart window recycling, corner speaker switcher, Alt+S quick audio switch, Alt+V VPN helper, Alt+M menu, and Alt+C.
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

const SPORTS_DOMAINS = [
    "dazn.com", "espn.com", "amazon.com", "apple.com", "peacocktv.com",
    "youtube.com", "ballysports.com", "cbssports.com", "nbcsports.com",
    "fox.com", "tbs.com", "tntdrama.com", "xfinity.com"
];

async function closeGridWindows() {
    try {
        const windows = await chrome.windows.getAll({ populate: true });
        for (const win of windows) {
            if (win.type === "popup" && win.tabs) {
                const isSportsWindow = win.tabs.some(tab => {
                    return tab.url && SPORTS_DOMAINS.some(domain => tab.url.includes(domain));
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
        const windows = await chrome.windows.getAll({ populate: true });
        const sportsWindows = windows.filter(win => {
            return win.type === "popup" && win.tabs && win.tabs.some(tab => {
                return tab.url && SPORTS_DOMAINS.some(domain => tab.url.includes(domain));
            });
        });

        await chrome.storage.local.set({ sportsgrid_audio_index: defaultAudioIndex });

        for (let i = 0; i < sportsWindows.length; i++) {
            const shouldMute = (i !== defaultAudioIndex);
            const win = sportsWindows[i];
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

    let existingWindows = [];
    try {
        const windows = await chrome.windows.getAll({ populate: true });
        existingWindows = windows.filter(win => {
            return win.type === "popup" && win.tabs && win.tabs.some(tab => {
                return tab.url && SPORTS_DOMAINS.some(domain => tab.url.includes(domain));
            });
        });
    } catch (e) {}

    for (let i = 0; i < urls.length; i++) {
        if (!urls[i]) continue;
        const targetUrl = urls[i];
        const b = boundsList[i];

        const matchingWinIndex = existingWindows.findIndex(win => {
            return win.tabs.some(tab => tab.url && tab.url.includes(new URL(targetUrl).hostname));
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
                const windows = await chrome.windows.getAll({ populate: true });
                const sportsWindows = windows.filter(win => {
                    return win.type === "popup" && win.tabs && win.tabs.some(tab => {
                        return tab.url && SPORTS_DOMAINS.some(domain => tab.url.includes(domain));
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
