import { useState } from 'react';
import { CombatState } from '../types';

export function useCombatState() {
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 3));
  const clearLogs = () => setLogs([]);

  return {
    combatState,
    setCombatState,
    logs,
    setLogs,
    addLog,
    clearLogs
  };
}
