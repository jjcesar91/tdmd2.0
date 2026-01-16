import React from 'react';

interface StatBadgeProps {
  icon: any;
  value: number | string;
  color: string;
}

export const StatBadge: React.FC<StatBadgeProps> = ({ icon: Icon, value, color }) => (
  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/80 border border-stone-600 shadow-sm backdrop-blur-md ${color}`}>
    <Icon size={10} />
    {value && <span className="text-[10px] font-bold font-serif">{value}</span>}
  </div>
);
