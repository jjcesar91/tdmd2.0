import { useState } from 'react';
import { Card as CardModel } from '../types';
import { Card } from './Card';
import { X, Check } from 'lucide-react';

interface SelectionModalProps {
    cards: CardModel[];
    requiredCount: number;
    title: string;
    onConfirm: (indices: number[]) => void;
    onCancel: () => void;
}

export const SelectionModal = ({ cards, requiredCount, title, onConfirm, onCancel }: SelectionModalProps) => {
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    const handleToggle = (idx: number) => {
        if (selectedIndices.includes(idx)) {
            setSelectedIndices(prev => prev.filter(i => i !== idx));
        } else {
            if (selectedIndices.length < requiredCount) {
                setSelectedIndices(prev => [...prev, idx]);
            }
        }
    };

    const handleConfirm = () => {
        if (selectedIndices.length === requiredCount) {
            onConfirm(selectedIndices);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4">
            <div className="bg-stone-900 border-2 border-amber-600 rounded-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-stone-700 flex justify-between items-center bg-stone-950/50">
                    <h2 className="text-xl font-bold text-amber-500">{title} ({selectedIndices.length}/{requiredCount})</h2>
                    <button onClick={onCancel} className="bg-stone-800 hover:bg-stone-700 p-2 rounded-full transition-colors">
                        <X size={24} className="text-stone-400" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {cards.map((card, idx) => {
                            const isSelected = selectedIndices.includes(idx);
                            return (
                                <div key={card.uid || idx} 
                                     onClick={() => handleToggle(idx)}
                                     className={`relative cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-95' : 'hover:scale-105'}`}>
                                     <div className={`aspect-[2/3] pointer-events-none`}>
                                         <Card {...card} disabled={false} />
                                     </div>
                                     {isSelected && (
                                         <div className="absolute inset-0 bg-amber-500/20 rounded-xl border-4 border-amber-500 pointer-events-none z-20 flex items-center justify-center">
                                             <div className="bg-amber-500 rounded-full p-2 shadow-lg">
                                                 <Check size={32} className="text-black" />
                                             </div>
                                         </div>
                                     )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t border-stone-700 bg-stone-950/50 flex justify-end">
                    <button 
                        onClick={handleConfirm}
                        disabled={selectedIndices.length !== requiredCount}
                        className={`
                            px-8 py-3 rounded-lg font-bold text-lg transition-all duration-300 flex items-center gap-2
                            ${selectedIndices.length === requiredCount 
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/50 shadow-lg translate-y-0' 
                                : 'bg-stone-800 text-stone-500 cursor-not-allowed translate-y-1 opacity-50'}
                        `}
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    );
};
