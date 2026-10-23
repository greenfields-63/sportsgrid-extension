/**
 * SportsGrid Content Script - Quadrant-locked fullscreen and persistent SPA-proof Mute/Unmute button.
 */

(function() {
    if (window.sportsGridInjected) return;
    window.sportsGridInjected = true;

    // 1. Persistent Mute/Unmute Button Overlay with MutationObserver & Interval checks
    function injectAudioToggle() {
        if (document.getElementById('sportsgrid-audio-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'sportsgrid-audio-btn';
        btn.innerHTML = '🔊 Mute';
        btn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 999998;
            background: rgba(0, 0, 0, 0.75);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            backdrop-filter: blur(4px);
            box-shadow: 0 2px 10px rgba(0,0,0,0.6);
            transition: all 0.2s ease;
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
            btn.style.background = isMuted ? 'rgba(239, 68, 68, 0.85)' : 'rgba(0, 0, 0, 0.75)';
        });

        if (document.body) {
            document.body.appendChild(btn);
        }
    }

    injectAudioToggle();
    setInterval(injectAudioToggle, 1500);

    const observer = new MutationObserver(() => {
        injectAudioToggle();
    });
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 2. Fullscreen Interception
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
            target.style.zIndex = '999999';
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
