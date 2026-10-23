/**
 * SportsGrid Background Service Worker - Manages 2x2 grid window creation, Alt+M menu, and Alt+C batch close.
 */

let activeGridWindowIds = [];

chrome.runtime.onInstalled.addListener(() => {
    console.log("[SportsGrid] Extension installed.");
});

chrome.commands.onCommand.addListener(async (command) => {
    if (command === "open-menu") {
        // Open setup popup as a small window
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
    // Close any existing grid windows first
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

    let screenWidth = 1440;
    let screenHeight = 900;

    try {
        const display = await chrome.system.display.getInfo();
        const primary = display.find(d => d.isPrimary) || display[0];
        screenWidth = primary.workArea.width;
        screenHeight = primary.workArea.height;
    } catch (e) {}

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
    }
}

chrome.windows.onRemoved.addListener((windowId) => {
    activeGridWindowIds = activeGridWindowIds.filter(id => id !== windowId);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "launch-grid") {
        launchGrid();
        sendResponse({ success: true });
    }
});
