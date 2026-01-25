/**
 * PetalsFall Component
 * Creates falling cherry blossom petals effect for Tet season
 * Petals fall diagonally from left to right with random directions
 */

import { useEffect, useRef } from 'react';
import { isTetSeason } from '../utils/seasonalTheme';

function PetalsFall(): React.ReactElement | null {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isTetSeason()) return;

        const container = containerRef.current;
        if (!container) return;

        let intervalId: NodeJS.Timeout | null = null;

        function createPetal() {
            if (!container) return;

            const petal = document.createElement('div');
            petal.className = 'petal';

            const size = Math.random() * 8 + 5;
            const duration = Math.random() * 4 + 4; // Slightly longer for smoother fall

            const startX = Math.random() * 90 - 10;
            const driftX = Math.random() * 30 + 10;

            petal.style.left = startX + '%';
            petal.style.width = size + 'px';
            petal.style.height = size + 'px';
            petal.style.animationDuration = duration + 's';
            petal.style.opacity = String(Math.random() * 0.5 + 0.3);
            petal.style.setProperty('--drift-x', driftX + 'vw');

            container.appendChild(petal);

            petal.onanimationend = () => petal.remove();
        }

        const startInterval = () => {
            if (!intervalId) {
                intervalId = setInterval(createPetal, 150); // Slightly slower generation
            }
        };

        const stopInterval = () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                container?.classList.remove('paused');
                startInterval();
            } else {
                container?.classList.add('paused');
                stopInterval();
            }
        };

        // Initial start
        startInterval();

        // Initial batch
        for (let i = 0; i < 15; i++) {
            setTimeout(createPetal, i * 100);
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopInterval();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (container) {
                container.innerHTML = '';
            }
        };
    }, []);

    if (!isTetSeason()) return null;

    return <div ref={containerRef} className="petals-container" />;
}

export default PetalsFall;
