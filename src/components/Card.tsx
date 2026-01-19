import React, { useRef } from 'react';
import { Sword, Sparkles, Crown, FlaskConical } from 'lucide-react';
import { Card as CardModel } from '../types';

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
}

export const Card = ({ type, ownerId, name, desc, isHidden, onPreviewStart, onPreviewEnd, onClick, isSelected, disabled, isPotion, range, className = "", smallMode = false, previewMode = false }: CardProps) => {
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

  if (isHidden) {
    return (
      <div className={`relative bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 border-3 border-stone-600 rounded-xl shadow-2xl overflow-hidden ${className}`}>
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
    );
  }

  const isBasic = type === 'BASIC';
  const isSignature = type === 'SIGNATURE';
  const isUltimate = type === 'ULTIMATE';
  
  // Colors based on Tiers
  let iconColor = isPotion ? "text-emerald-400" : (isUltimate ? "text-amber-400" : (isSignature ? "text-cyan-400" : "text-stone-300"));
  let highlightColor = isPotion ? "shadow-emerald-500/30" : (isUltimate ? "shadow-amber-500/30" : (isSignature ? "shadow-cyan-500/30" : "shadow-stone-500/30"));
  let borderColor = isUltimate ? "border-amber-600" : (isSignature ? "border-cyan-700" : "border-stone-600");

  if (disabled) {
      iconColor = "text-stone-500";
      borderColor = "border-stone-700";
  }

  const typeLabel = type || 'CARD';

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      className={`
        relative rounded-xl shadow-2xl border-2 transition-all duration-200 overflow-hidden flex flex-col select-none
        bg-gradient-to-br from-stone-800 via-stone-900 to-black ${borderColor}
        ${isSelected ? `ring-4 ring-amber-400/80 scale-105 z-20 ${highlightColor}` : 'active:scale-95'}
        ${disabled ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:-translate-y-2 hover:shadow-2xl'}
        ${className}
      `}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      {/* Top corner indicator */}
      {!smallMode && range !== undefined && range > 0 && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-stone-950/80 border border-stone-600 flex items-center justify-center z-10">
          <span className={`${previewMode ? 'text-sm' : 'text-[8px]'} font-bold text-stone-300`}>R{range}</span>
        </div>
      )}

      {/* Main content - centered vertically */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 py-2 relative z-10">
         {/* Icon above name */}
         {!smallMode && (
           <div className={`${iconColor} drop-shadow-lg mb-2`}>
              {isPotion ? <FlaskConical size={32}/> : (isUltimate ? <Crown size={32} /> : (isSignature ? <Sparkles size={32}/> : <Sword size={32} />))}
           </div>
         )}
         
         {/* Icon for small mode */}
         {smallMode && (
           <div className={`${iconColor} drop-shadow-lg`}>
              {isPotion ? <FlaskConical size={20}/> : (isUltimate ? <Crown size={20} /> : (isSignature ? <Sparkles size={20}/> : <Sword size={20} />))}
           </div>
         )}

         {/* Card Name - Always centered */}
         {!smallMode && (
           <div className="px-1 py-0.5 bg-stone-950/90 border border-stone-700 mb-1">
             <span className={`${previewMode ? 'text-sm' : 'text-[5px]'} font-bold text-stone-100 uppercase tracking-wide font-serif`}>{name}</span>
           </div>
         )}
          
         {/* Description below name */}
         {!smallMode && (
           <div className={`${previewMode ? 'text-base' : 'text-[7px]'} text-center text-stone-300 leading-tight w-full px-2 ${previewMode ? '' : 'line-clamp-3'}`}>
             {desc}
           </div>
         )}
      </div>

      {/* Bottom Info Bar */}
      {!smallMode && (
        <div className="w-full px-2 py-1 bg-black/40 border-t border-stone-800 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-1">
            <span className={`${previewMode ? 'text-xs' : 'text-[7px]'} ${isUltimate ? 'text-amber-500 font-bold' : (isSignature ? 'text-cyan-500 font-bold' : 'text-stone-400')} uppercase tracking-wider`}>{typeLabel}</span>
          </div>
          {ownerId && (
            <div className={`${previewMode ? 'text-xs' : 'text-[7px]'} font-bold text-stone-500 uppercase tracking-wider`}>
              {ownerId === 'crusader' ? 'KNIGHT' : ownerId.toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
