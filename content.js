/**
 * SportsGrid Content Script - Listens for fullscreenchange events,
 * exits true monitor fullscreen, and forces the player to fill the quadrant window.
 */

(function() {
    if (window.sportsGridInjected) return;
    window.sportsGridInjected = true;

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            console.log("[SportsGrid] Fullscreen detected. Locking to quadrant.");
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

    document.addEventListener('webkitfullscreenchange', () => {
        if (document.webkitFullscreenElement) {
            const target = document.webkitFullscreenElement;
            if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            target.style.position = 'fixed';
            target.style.top = '0';
            target.style.left = '0';
            target.style.width = '100vw';
            target.style.height = '100vh';
            target.style.zIndex = '999999';
            target.style.backgroundColor = '#000';
        }
    });
})();
