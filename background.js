/**
 * SportsGrid Background Service Worker - Bulletproof 2x2 grid window creation, Alt+M, Alt+C, and audio focus.
 */

let activeGridWindowIds = [];

chrome.runtime.onInstalled.addListener(() => {
    console.log("[SportsGrid] Extension installed.");
});

chrome.commands.onCommand.addListener(async (command) => {
    if (command === "open-menu") {
        await chrome.windows.create({
            url: "popup.html",
            type: "popup",
            width: 300,
            height: 420
        });
    } else if (command === "close-grid") {
        closeGridWindows();
    }
});

async function closeGridWindows() {
    for (const winId of activeGridWindowIds) {
        try {
            await chrome.windows.remove(winId);
        } catch (e) {}
    }
    activeGridWindowIds = [];
}

async function launchGrid() {
    await closeGridWindows();

    let urls = [
        "https://www.espn.com/watch/",
        "https://www.dazn.com/",
        "https://www.amazon.com/primevideo/",
        "https://tv.apple.com/"
    ];

    try {
        const stored = await chrome.storage.local.get("sportsgrid_urls");
        if (stored.sportsgrid_urls && Array.isArray(stored.sportsgrid_urls)) {
            urls = stored.sportsgrid_urls;
        }
    } catch (e) {}

    // Bulletproof standard dimensions
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

    for (let i = 0; i < urls.length; i++) {
        if (!urls[i]) continue;
        const b = boundsList[i];
        try {
            const newWin = await chrome.windows.create({
                url: urls[i],
                type: "popup",
                left: b.left,
                top: b.top,
                width: b.width,
                height: b.height
            });
            if (newWin && newWin.id) {
                activeGridWindowIds.push(newWin.id);
            }
        } catch (err) {
            console.error("[SportsGrid] Error creating window:", err);
        }
    }

    if (activeGridWindowIds.length > 0) {
        updateAudioState(activeGridWindowIds[0]);
    }
}

async function updateAudioState(focusedWinId) {
    for (const winId of activeGridWindowIds) {
        try {
            const tabs = await chrome.tabs.query({ windowId: winId, active: true });
            for (const tab of tabs) {
                const shouldMute = (winId !== focusedWinId);
                await chrome.tabs.update(tab.id, { muted: shouldMute });
            }
        } catch (e) {}
    }
}

chrome.windows.onFocusedChanged.addListener((windowId) => {
    if (activeGridWindowIds.includes(windowId)) {
        updateAudioState(windowId);
    }
});

chrome.windows.onRemoved.addListener((windowId) => {
    activeGridWindowIds = activeGridWindowIds.filter(id => id !== windowId);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "launch-grid") {
        launchGrid();
        sendResponse({ success: true });
    }
});
