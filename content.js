/**
 * SportsGrid Content Script - Quadrant-locked fullscreen and max-zindex persistent mute button.
 */

(function() {
    if (window.sportsGridInjected) return;
    window.sportsGridInjected = true;

    function injectAudioToggle() {
        if (document.getElementById('sportsgrid-audio-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'sportsgrid-audio-btn';
        btn.innerHTML = '🔊 Mute';
        btn.style.cssText = `
            position: fixed !important;
            top: 10px !important;
            right: 10px !important;
            z-index: 2147483647 !important;
            background: rgba(0, 0, 0, 0.85) !important;
            color: #fff !important;
            border: 1px solid rgba(255, 255, 255, 0.4) !important;
            padding: 6px 12px !important;
            border-radius: 6px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            backdrop-filter: blur(4px) !important;
            box-shadow: 0 2px 12px rgba(0,0,0,0.8) !important;
        `;

        let isMuted = false;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            isMuted = !isMuted;
            const mediaEls = document.querySelectorAll('video, audio');
            mediaEls.forEach(el => {
                el.muted = isMuted;
            });
            btn.innerHTML = isMuted ? '🔇 Unmute' : '🔊 Mute';
            btn.style.background = isMuted ? 'rgba(239, 68, 68, 0.9) !important' : 'rgba(0, 0, 0, 0.85) !important';
        });

        const targetRoot = document.documentElement || document.body;
        if (targetRoot) {
            targetRoot.appendChild(btn);
        }
    }

    injectAudioToggle();
    setInterval(injectAudioToggle, 1000);

    const observer = new MutationObserver(() => {
        injectAudioToggle();
    });
    if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // Fullscreen Interception
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
