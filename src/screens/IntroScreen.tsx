import React from 'react';
import splashScreenImage from '../assets/images/splashes/TDMD.png';
import rekodeLogo from '../assets/images/splashes/REKODE.png';

interface IntroScreenProps {
  phase: 'STUDIO' | 'SPLASH';
  onSplashClick: () => void;
  showTapLabel: boolean;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ phase, onSplashClick, showTapLabel }) => {
  if (phase === 'STUDIO') {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden relative z-[200]">
         <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full relative shadow-2xl bg-black flex items-center justify-center">
            <img 
              key="studio-logo"
              src={rekodeLogo} 
              alt="Rekode Studio" 
              className="w-2/3 object-contain opacity-0 animate-fade-in"
              style={{ animationDuration: '1.5s' }}
            />
         </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-screen bg-black flex items-center justify-center cursor-pointer overflow-hidden relative z-[200]"
      onClick={onSplashClick}
    >
       <div className="h-full max-w-[56.25vh] aspect-[9/16] w-full relative shadow-2xl">
          <img 
            key="splash-logo"
            src={splashScreenImage} 
            alt="The Dragon Must Die" 
            className="w-full h-full object-cover opacity-0 animate-fade-in"
            style={{ animationDuration: '1s' }}
          />
          {showTapLabel && (
              <div className="absolute bottom-16 left-0 right-0 text-center animate-pulse z-10">
                  <span className="text-white font-serif tracking-widest text-xl uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] border-b-2 border-transparent pb-1">
                      Tap to continue
                  </span>
              </div>
          )}
       </div>
    </div>
  );
};
