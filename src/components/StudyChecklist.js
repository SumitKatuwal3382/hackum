import React, { useMemo, useCallback } from 'react';
import { useData } from '../store';
import Badge from './Badge';

// Displays checklist of study sessions derived from a plan
// Props: studentId, allocations (from plan.allocations)
export default function StudyChecklist({ studentId, allocations }){
  const { studySessions, createStudySessionsFromPlan, startStudySession, completeStudySession, updateStudySession } = useData();

  // Derive or create sessions corresponding to current allocations
  const sessions = useMemo(() => {
    if(!studentId) return [];
    return createStudySessionsFromPlan({ studentId, allocations }) || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, allocations]);

  const totalPlanned = sessions.reduce((a,s)=> a + s.plannedMinutes, 0);
  const totalDone = sessions.reduce((a,s)=> a + (s.status === 'done' ? s.completedMinutes : 0), 0);
  const pct = totalPlanned ? Math.round((totalDone/totalPlanned)*100) : 0;

  const handleManualMinutes = useCallback((id, value) => {
    const v = Math.max(0, Number(value)||0);
    updateStudySession(id, { completedMinutes: v });
  }, [updateStudySession]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-200">Study Checklist</h4>
        <Badge>{pct}%</Badge>
      </div>
      <div className="h-1.5 w-full bg-gray-700/40 rounded overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all" style={{ width: pct+'%' }} />
      </div>
      <ul className="space-y-2">
        {sessions.map(s => {
          const inProgress = s.status === 'in-progress';
          const done = s.status === 'done';
          return (
            <li key={s.id} className="p-3 rounded-lg bg-black/40 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => done ? updateStudySession(s.id,{ status:'pending', completedMinutes:0, startedAt:undefined, finishedAt:undefined }) : completeStudySession(s.id)}
                    className="h-4 w-4 rounded border-gray-500 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className={`text-sm ${done ? 'line-through text-gray-500' : 'text-gray-100'}`}>{s.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <span>{s.completedMinutes}/{s.plannedMinutes}m</span>
                  {!done && !inProgress && (
                    <button onClick={()=> startStudySession(s.id)} className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px]">Start</button>
                  )}
                  {inProgress && (
                    <button onClick={()=> completeStudySession(s.id)} className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px]">Done</button>
                  )}
                  {!done && (
                    <input
                      type="number"
                      min={0}
                      max={s.plannedMinutes}
                      value={s.completedMinutes}
                      onChange={e=> handleManualMinutes(s.id, e.target.value)}
                      className="w-14 px-1 py-0.5 rounded bg-gray-900 border border-gray-600 text-[11px] text-gray-200"
                    />
                  )}
                  {done && <span className="text-emerald-400">✔</span>}
                </div>
              </div>
              <div className="mt-2 h-1 w-full bg-gray-700/40 rounded overflow-hidden">
                <div className="h-full bg-emerald-400/70" style={{ width: Math.min(100, (s.completedMinutes / s.plannedMinutes)*100) + '%' }} />
              </div>
              {inProgress && <div className="mt-1 text-[10px] text-sky-400">In progress… mark Done when finished.</div>}
            </li>
          );
        })}
      </ul>
      {!sessions.length && <p className="text-xs text-gray-500">No sessions generated.</p>}
      <p className="text-[10px] text-gray-500">Adjust minutes manually if you under/over-shoot planned time.</p>
    </div>
  );
}
