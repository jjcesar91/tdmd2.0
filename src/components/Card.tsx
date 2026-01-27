import React, { useRef } from 'react';
import { Sword, Sparkles, Crown, FlaskConical, Zap, Lock } from 'lucide-react';
import { Card as CardModel } from '../types';
import { KEYWORDS } from '../data';

import crusaderIcon from '../assets/images/heroes/crusader/crusader-icon.png';
import rangerIcon from '../assets/images/heroes/loneranger/loneranger-icon.png';
import prophetIcon from '../assets/images/heroes/madprophet/madprophet-icon.png';
import alchemistIcon from '../assets/images/heroes/alchemist/alchemist-icon.png';

const HERO_ICONS: Record<string, string> = {
  crusader: crusaderIcon,
  ranger: rangerIcon,
  loneranger: rangerIcon,
  prophet: prophetIcon,
  madprophet: prophetIcon,
  alchemist: alchemistIcon
};

interface CardProps extends Partial<CardModel> {
  isHidden?: boolean;
  onPreviewStart?: () => void;
  onPreviewEnd?: () => void;
  onClick?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
  className?: string;
  smallMode?: boolean;
  previewMode?: boolean;
  compactPreview?: boolean;
  image?: string;
  detained?: number;
}

export const Card = ({ type, ownerId, name, desc, isHidden, onPreviewStart, onPreviewEnd, onClick, isSelected, disabled, isPotion, range, speed, className = "", smallMode = false, previewMode = false, compactPreview = false, image, detained }: CardProps) => {
  const timerRef = useRef<number | null>(null);

  const handleStart = (_e: React.MouseEvent | React.TouchEvent) => {
    if (!disabled && onPreviewStart) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        onPreviewStart();
      }, 1000);
    }
  };

  const handleEnd = (_e: React.MouseEvent | React.TouchEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (onPreviewEnd) onPreviewEnd();
  };

  const isSignature = type === 'SIGNATURE';
  const isUltimate = type === 'ULTIMATE';
  
  // Colors based on Tiers
  let iconColor = isPotion ? "text-emerald-400" : "text-stone-300";
  let highlightColor = isPotion ? "shadow-emerald-500/30" : "shadow-stone-500/30";
  let borderColor = "border-stone-600";

  if (disabled) {
      iconColor = "text-stone-500";
      borderColor = "border-stone-700";
  }

  const typeLabel = type || 'CARD';

  const renderDescription = () => {
    if (!desc) return null;
    const sortedKeys = Object.keys(KEYWORDS).sort((a, b) => b.length - a.length);
    const parts = desc.split(new RegExp(`(${sortedKeys.join('|')})`, 'g'));
    return (
        <>
            {parts.map((part, i) => {
                const match = KEYWORDS[part];
                if (match && (previewMode || !smallMode)) {
                     return <span key={i} className="text-amber-400 font-bold drop-shadow-sm cursor-help" title={`${part}: ${match}`}>{part}</span>;
                }
                return part;
            })}
        </>
    );
  };

  return (
    <div className={`perspective-1000 w-full h-full ${className} relative group`} 
         onMouseEnter={!disabled && !isHidden ? () => {} : undefined}
         onClick={!disabled && !isHidden ? onClick : undefined}
         onMouseDown={!isHidden ? handleStart : undefined}
         onMouseUp={!isHidden ? handleEnd : undefined}
         onMouseLeave={!isHidden ? handleEnd : undefined}
         onTouchStart={!isHidden ? handleStart : undefined}
         onTouchEnd={!isHidden ? handleEnd : undefined}
    >
      <div className={`w-full h-full transition-transform duration-700 transform-style-3d relative ${isHidden ? 'rotate-y-180' : ''} ${isHidden ? '' : (isSelected ? `scale-105 z-20` : 'group-active:scale-95 group-hover:-translate-y-2')}`}>
        
        {/* FRONT FACE */}
        <div className="absolute inset-0 backface-hidden">
          <div className={`
            w-full h-full relative rounded-xl shadow-2xl border-2 transition-all duration-200 overflow-hidden flex flex-col select-none
            bg-gradient-to-br from-stone-800 via-stone-900 to-black ${borderColor}
            ${isSelected ? `ring-4 ring-amber-400/80 ${highlightColor}` : ''}
            ${disabled ? 'opacity-60 cursor-not-allowed grayscale' : ''}
          `}>
            {/* Subtle texture overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />

            {/* DETAINED OVERLAY */}
            {detained && detained > 0 && (
              <div className="absolute inset-0 z-30 bg-black/60 flex flex-col items-center justify-center p-2 backdrop-blur-[1px]">
                  <div className="bg-stone-900 border-2 border-amber-600 rounded-full p-3 shadow-2xl animate-pulse">
                      <Lock size={compactPreview ? 16 : 32} className="text-amber-500" />
                  </div>
                  {!compactPreview && !smallMode && (
                      <div className="mt-2 text-amber-500 font-bold uppercase tracking-wider text-xs bg-black/80 px-2 py-1 rounded border border-amber-900/50">
                        Detained ({detained})
                      </div>
                  )}
              </div>
            )}



            {/* Top corner indicators - Speed & Range */}
            {!smallMode && (
              <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-center">
                  {/* Speed Icon (only if FAST) */}
                  {speed === 'FAST' && (
                      <div className="w-6 h-6 rounded-full bg-stone-950/90 border border-stone-600 flex items-center justify-center backdrop-blur-sm" title="FAST Speed">
                        <Zap size={previewMode ? (compactPreview ? 12 : 14) : 10} className="text-white" />
                      </div>
                  )}

                  {/* Range Badge */}
                  {range !== undefined && range > 0 && (
                      <div className="w-6 h-6 rounded-full bg-stone-950/80 border border-stone-600 flex items-center justify-center shadow-lg backdrop-blur-sm">
                        <span className={`${previewMode ? (compactPreview ? 'text-[10px]' : 'text-sm') : 'text-[8px]'} font-bold text-stone-300`}>R{range}</span>
                      </div>
                  )}
              </div>
            )}

            {/* Card Content - Icon Area (Top) */}
            {!smallMode ? (
              <>
                  <div className="flex-1 flex items-center justify-center relative z-10 overflow-hidden">
                    {image ? (
                        <img src={image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        <div className={`${iconColor} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform duration-300`}>
                            {isPotion ? <FlaskConical size={compactPreview ? 48 : 64}/> : (isUltimate ? <Crown size={compactPreview ? 48 : 64} /> : (isSignature ? <Sparkles size={compactPreview ? 48 : 64}/> : <Sword size={compactPreview ? 48 : 64} />))}
                        </div>
                    )}
                </div>

                {/* Card Content - Text Area (Bottom) - Solid Background */}
                <div className="relative z-20 w-full bg-stone-950/95 border-t border-stone-700 flex flex-col">
                    
                    {/* Name Strip */}
                    <div className="w-full bg-stone-900 border-b border-stone-800 py-0.5 px-2 text-center shadow-inner overflow-hidden">
                      <span className={`${
                        previewMode 
                          ? (compactPreview 
                              ? ((name?.length || 0) > 16 ? 'text-[6px] tracking-wide' : (name?.length || 0) > 12 ? 'text-[7px] tracking-wider' : 'text-[9px] tracking-widest') 
                              : 'text-xs tracking-widest') 
                          : 'text-[5px] tracking-widest'
                      } font-bold text-stone-100 uppercase font-serif block whitespace-nowrap`}>{name}</span>
                    </div>

                    {/* Description Body */}
                    <div className={`w-full px-2 py-2 flex items-center justify-center ${previewMode && compactPreview ? 'h-[50px] overflow-hidden' : 'min-h-[50px]'} ${previewMode ? '' : 'line-clamp-3'}`}>
                        <p className={`${
                          previewMode 
                            ? (compactPreview 
                                ? ((desc?.length || 0) > 85 ? 'text-[6px] leading-[1.1]' : (desc?.length || 0) > 50 ? 'text-[7px] leading-[1.2]' : 'text-[8px] leading-relaxed') 
                                : 'text-xs leading-relaxed') 
                            : 'text-[7px] leading-relaxed'
                        } text-center text-stone-300 font-medium w-full`}>
                          {renderDescription()}
                        </p>
                    </div>

                    {/* Stats / Footer - Integrated into bottom block */}
                    <div className="w-full px-2 py-1.5 bg-black/60 border-t border-stone-800 flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className={`${previewMode ? (compactPreview ? 'text-[8px]' : 'text-xs') : 'text-[7px]'} text-stone-400 uppercase tracking-wider`}>{typeLabel}</span>
                        </div>

                        {ownerId && HERO_ICONS[ownerId] && (
                          <div className="flex items-center justify-center bg-stone-800 rounded-full p-0.5 border border-stone-600">
                            <img 
                              src={HERO_ICONS[ownerId]} 
                              alt={ownerId} 
                              className={`${previewMode ? (compactPreview ? 'w-2.5 h-2.5' : 'w-4 h-4') : 'w-2.5 h-2.5'} object-contain`}
                              style={{ imageRendering: 'pixelated' }}
                            />
                          </div>
                        )}
                    </div>
                </div>
              </>
            ) : (
              /* Small Mode (Hand/Pile/Board) - Revised Layout */
              <div className="flex-1 flex flex-col w-full h-full relative z-10">
                  {/* Upper Half - Card Image */}
                  <div className="h-1/2 w-full relative flex items-center justify-center bg-stone-900 overflow-hidden border-b border-stone-800">
                    {image ? (
                        <img src={image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        <div className={`${iconColor} drop-shadow-sm transform scale-75`}>
                            {isPotion ? <FlaskConical size={24}/> : (isUltimate ? <Crown size={24} /> : (isSignature ? <Sparkles size={24}/> : <Sword size={24} />))}
                        </div>
                    )}
                  </div>

                  {/* Lower Half - Hero Icon */}
                  <div className="h-1/2 w-full flex items-center justify-center bg-stone-950/80">
                    {ownerId && HERO_ICONS[ownerId] ? (
                        <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-600 p-0.5 flex items-center justify-center shadow-lg">
                          <img 
                            src={HERO_ICONS[ownerId]} 
                            alt={ownerId} 
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>
                    ) : (
                        <div className="text-[8px] text-stone-600 font-bold">N/A</div>
                    )}
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* BACK FACE */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className={`relative w-full h-full bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 border-3 border-stone-600 rounded-xl shadow-2xl overflow-hidden`}>
            {/* Diagonal stripe pattern - more visible */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 10px, transparent 10px, transparent 20px)',
            }} />
            
            {/* Ornamental borders - more solid */}
            <div className="absolute inset-2 border-2 border-stone-600/80 rounded-lg" />
            <div className="absolute inset-4 border border-stone-500/60 rounded-md" />
            
            {/* Center symbol - more solid */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Outer diamond */}
                <div className="w-12 h-12 bg-stone-700/80 border-2 border-stone-500/80 rotate-45 shadow-lg" />
                {/* Inner diamond */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-stone-800/90 border-2 border-stone-400/70 rotate-45" />
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-stone-400 rounded-full shadow-inner" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
