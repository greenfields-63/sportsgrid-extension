document.addEventListener('DOMContentLoaded', async () => {
    const soundListEl = document.getElementById('sound-list');
    try {
        const stored = await chrome.storage.local.get(["sportsgrid_urls", "sportsgrid_audio_index"]);
        const urls = stored.sportsgrid_urls || [];
        const currentAudioIndex = typeof stored.sportsgrid_audio_index === 'number' ? stored.sportsgrid_audio_index : 0;

        const names = ["Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"];

        for (let i = 0; i < 4; i++) {
            const url = urls[i] || "";
            let serviceName = names[i];
            if (url.includes("espn")) serviceName = "ESPN";
            else if (url.includes("dazn")) serviceName = "DAZN";
            else if (url.includes("cbssports")) serviceName = "CBS Sports";
            else if (url.includes("nbcsports")) serviceName = "NBC Sports";
            else if (url.includes("peacocktv")) serviceName = "Peacock";
            else if (url.includes("fox")) serviceName = "Fox One";
            else if (url.includes("tbs")) serviceName = "TBS";
            else if (url.includes("tntdrama")) serviceName = "TNT";
            else if (url.includes("xfinity")) serviceName = "Xfinity";
            else if (url.includes("primevideo")) serviceName = "Prime Video";
            else if (url.includes("apple")) serviceName = "Apple TV+";

            const btn = document.createElement('button');
            btn.className = `sound-btn ${i === currentAudioIndex ? 'active' : ''}`;
            btn.innerHTML = `<span>${names[i]}: ${serviceName}</span><span>${i === currentAudioIndex ? '🔊' : '🔇'}</span>`;

            btn.addEventListener('click', async () => {
                await chrome.storage.local.set({ sportsgrid_audio_index: i });
                chrome.runtime.sendMessage({ action: "update-audio", audioIndex: i }, () => {
                    window.close();
                });
            });

            soundListEl.appendChild(btn);
        }
    } catch (e) {}
});
