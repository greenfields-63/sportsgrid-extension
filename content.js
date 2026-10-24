/**
 * SportsGrid Content Script - Quadrant-locked fullscreen (zero UI overlays).
 */

(function() {
    if (window.sportsGridInjected) return;
    window.sportsGridInjected = true;

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
