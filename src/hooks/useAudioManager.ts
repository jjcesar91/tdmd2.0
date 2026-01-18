import { useRef, useEffect } from 'react';
import clickSfx from '../assets/sounds/sfx/click1.mp3';
import themeMusic from '../assets/sounds/theme/main.mp3';

export const useAudioManager = (introPhase: string) => {
    const themeAudioRef = useRef<HTMLAudioElement | null>(null);

    const playClick = () => {
        const audio = new Audio(clickSfx);
        audio.play().catch(e => console.log("Audio play failed", e));
    };

    const startMusic = () => {
        if (!themeAudioRef.current) {
            themeAudioRef.current = new Audio(themeMusic);
            themeAudioRef.current.loop = true;
        }
        themeAudioRef.current.play().catch(e => console.log("Manual music start failed", e));
    };

    useEffect(() => {
        if (introPhase === 'SPLASH') {
           const musicTimer = setTimeout(() => {
             if (!themeAudioRef.current) {
               themeAudioRef.current = new Audio(themeMusic);
               themeAudioRef.current.loop = true;
             }
             themeAudioRef.current.play().catch(() => {
                console.log("Audio autoplay prevented. Waiting for interaction to start music.");
                const playOnInteract = () => {
                    if (themeAudioRef.current) {
                      themeAudioRef.current.play().catch(e => console.error("Interacted play failed", e));
                    }
                    document.removeEventListener('click', playOnInteract);
                    document.removeEventListener('keydown', playOnInteract);
                    document.removeEventListener('touchstart', playOnInteract);
                };
                document.addEventListener('click', playOnInteract);
                document.addEventListener('keydown', playOnInteract);
                document.addEventListener('touchstart', playOnInteract);
             });
           }, 500);

           return () => { 
             clearTimeout(musicTimer);
           };
        }
    }, [introPhase]);

    return { playClick, startMusic };
};
