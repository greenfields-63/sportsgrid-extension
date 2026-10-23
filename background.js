/**
 * SportsGrid Background Service Worker - Robust window matching close (Alt+C), Alt+M menu, and 2x2 grid launcher.
 */

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
            await chrome.windows.create({
                url: urls[i],
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "launch-grid") {
        launchGrid();
        sendResponse({ success: true });
    }
});
