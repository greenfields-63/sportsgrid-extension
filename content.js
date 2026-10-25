/**
 * SportsGrid Content Script - Quadrant-locked fullscreen and corner speaker button.
 */

(function() {
    if (window.sportsGridInjected) return;
    window.sportsGridInjected = true;

    // 1. Injected Corner Speaker Switcher
    function injectSpeakerToggle() {
        if (document.getElementById('sportsgrid-speaker-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'sportsgrid-speaker-btn';
        btn.innerHTML = '🔊';
        btn.title = 'Click to switch audio to this window';
        btn.style.cssText = `
            position: fixed !important;
            top: 10px !important;
            right: 10px !important;
            z-index: 2147483647 !important;
            background: rgba(0, 0, 0, 0.75) !important;
            color: #fff !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            width: 32px !important;
            height: 32px !important;
            border-radius: 50% !important;
            font-size: 14px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            backdrop-filter: blur(4px) !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.6) !important;
            transition: all 0.2s ease !important;
        `;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            chrome.runtime.sendMessage({ action: "make-active-audio" });
        });

        const targetRoot = document.documentElement || document.body;
        if (targetRoot) {
            targetRoot.appendChild(btn);
        }
    }

    injectSpeakerToggle();
    setInterval(injectSpeakerToggle, 1500);

    const observer = new MutationObserver(() => {
        injectSpeakerToggle();
    });
    if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "update-speaker-state") {
            const btn = document.getElementById('sportsgrid-speaker-btn');
            if (btn) {
                if (request.isMuted) {
                    btn.innerHTML = '🔇';
                    btn.style.background = 'rgba(0, 0, 0, 0.75) !important';
                    btn.style.opacity = '0.6';
                } else {
                    btn.innerHTML = '🔊';
                    btn.style.background = 'rgba(59, 130, 246, 0.85) !important';
                    btn.style.opacity = '1';
                }
            }
        }
    });

    // 2. Standard Quadrant-Locked Fullscreen Interception
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            const target = document.fullscreenElement;
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
            target.style.position = 'fixed';
            target.style.top = '0';
            target.style.left = '0';
            target.style.width = '100vw';
            target.style.height = '100vh';
            target.style.zIndex = '2147483646';
            target.style.backgroundColor = '#000';

            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    target.style.position = '';
                    target.style.top = '';
                    target.style.left = '';
                    target.style.width = '';
                    target.style.height = '';
                    target.style.zIndex = '';
                    target.style.backgroundColor = '';
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        }
    });
})();
