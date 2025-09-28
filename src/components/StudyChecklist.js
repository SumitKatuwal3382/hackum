import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useData } from '../store';
import Badge from './Badge';

// Improved checklist with reliable creation, reset, and live timer.
export default function StudyChecklist({ studentId, allocations }) {
  const {
    studySessions,
    createStudySessionsFromPlan,
    startStudySession,
    completeStudySession,
    updateStudySession,
    resetStudySessions
  } = useData();

  const signature = useMemo(() => allocations.map(a => a.concept_id + ':' + a.minutes).join('|'), [allocations]);

  // Ensure sessions exist for current plan.
  useEffect(() => {
    if (!studentId || allocations.length === 0) return;
    createStudySessionsFromPlan({ studentId, allocations });
  }, [studentId, allocations, createStudySessionsFromPlan]);

  // Filter sessions for student + current signature.
  const sessions = useMemo(() => studySessions.filter(s => s.studentId === studentId && s.signature === signature), [studySessions, studentId, signature]);

  const totalPlanned = sessions.reduce((a, s) => a + s.plannedMinutes, 0);
  const totalDone = sessions.reduce((a, s) => a + (s.status === 'done' ? s.completedMinutes : 0), 0);
  const pct = totalPlanned ? Math.round((totalDone / totalPlanned) * 100) : 0;

  // Live timer state (store elapsed for in-progress sessions visually only).
  const [, forceTick] = useState(0);
  useEffect(() => {
    const hasInProgress = sessions.some(s => s.status === 'in-progress');
    if(!hasInProgress) return; // no timer needed
    const id = setInterval(() => forceTick(t => t + 1), 60000); // tick every minute
    return () => clearInterval(id);
  }, [sessions]);

  const handleManualMinutes = useCallback((id, value) => {
    const v = Math.max(0, Number(value) || 0);
    updateStudySession(id, { completedMinutes: v });
  }, [updateStudySession]);

  const handleToggle = useCallback((s) => {
    if (s.status === 'pending') startStudySession(s.id);
    else if (s.status === 'in-progress') completeStudySession(s.id);
    else if (s.status === 'done') updateStudySession(s.id, { status: 'pending', completedMinutes: 0, startedAt: undefined, finishedAt: undefined });
  }, [startStudySession, completeStudySession, updateStudySession]);

  const handleReset = () => {
    resetStudySessions(studentId, signature);
  };

  function displayElapsed(s){
    if(s.status === 'in-progress' && s.startedAt){
      const mins = Math.ceil((Date.now() - s.startedAt)/60000);
      return Math.max(mins, s.completedMinutes || 0);
    }
    return s.completedMinutes || 0;
  }

  // Sequential gating logic: only first non-done session is "active".
  const firstIncomplete = sessions.find(s => s.status !== 'done');
  const activeSession = firstIncomplete ? firstIncomplete : null;
  const completedSessions = sessions.filter(s => s.status === 'done');
  const lockedSessions = sessions.filter(s => s.status !== 'done' && s !== activeSession);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-200">Study Checklist (Sequential)</h4>
        <div className="flex items-center gap-2">
          <Badge>{pct}%</Badge>
          {sessions.length > 0 && <button onClick={handleReset} className="text-[10px] px-2 py-1 rounded bg-gray-700/60 hover:bg-gray-600 text-gray-200">Reset</button>}
        </div>
      </div>
      <div className="h-1.5 w-full bg-gray-700/40 rounded overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all" style={{ width: pct + '%' }} />
      </div>
      {sessions.length === 0 && <p className="text-xs text-gray-500">No sessions yet (adjust minutes above to generate plan).</p>}
      {activeSession && (
        <div className="space-y-2">
          <p className="text-[11px] text-gray-400">Focus on this concept before moving on:</p>
          {(() => {
            const s = activeSession;
            const elapsed = displayElapsed(s);
            const progressPct = Math.min(100, (elapsed / s.plannedMinutes) * 100);
            const statusColor = s.status === 'done' ? 'text-emerald-400' : s.status === 'in-progress' ? 'text-sky-400' : 'text-gray-300';
            const label = s.status === 'done' ? 'Done' : s.status === 'in-progress' ? 'Stop' : 'Start';
            return (
              <div className="p-4 rounded-lg bg-black/50 border border-white/5 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(s)}
                      className={`px-3 py-1 rounded text-[11px] font-medium ${s.status==='pending'?'bg-blue-600 hover:bg-blue-700 text-white': s.status==='in-progress'?'bg-amber-600 hover:bg-amber-700 text-white':'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                    >{label}</button>
                    <span className={`text-sm ${s.status === 'done' ? 'line-through text-gray-500' : 'text-gray-100'}`}>{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span className={statusColor}>{elapsed}/{s.plannedMinutes}m</span>
                    {s.status !== 'done' && (
                      <input
                        type="number"
                        min={0}
                        max={s.plannedMinutes}
                        value={s.completedMinutes}
                        onChange={e => handleManualMinutes(s.id, e.target.value)}
                        className="w-16 px-1 py-0.5 rounded bg-gray-900 border border-gray-600 text-[11px] text-gray-200"
                      />
                    )}
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full bg-gray-700/40 rounded overflow-hidden">
                  <div className={`h-full ${s.status==='done'?'bg-emerald-400':'bg-emerald-400/70'}`} style={{ width: progressPct + '%' }} />
                </div>
                {s.status === 'in-progress' && <div className="mt-2 text-[10px] text-sky-400">Tracking… updates every minute. Finish or adjust minutes, then stop to unlock next.</div>}
                {s.status === 'pending' && <div className="mt-2 text-[10px] text-gray-500">Press Start to begin timing this concept.</div>}
              </div>
            );
          })()}
        </div>
      )}
      {completedSessions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-gray-500">Completed Concepts</p>
          <ul className="space-y-1">
            {completedSessions.map(s => (
              <li key={s.id} className="flex items-center justify-between text-[11px] bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1">
                <span className="text-emerald-300 line-through">{s.name}</span>
                <span className="text-emerald-400">{s.completedMinutes}m</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {lockedSessions.length > 0 && (
        <div className="space-y-2 opacity-40 pointer-events-none select-none">
          <p className="text-[10px] text-gray-500">Locked (finish current to unlock):</p>
          <ul className="space-y-1">
            {lockedSessions.map(s => (
              <li key={s.id} className="flex items-center justify-between text-[11px] bg-gray-800/40 border border-white/5 rounded px-2 py-1">
                <span className="text-gray-400">{s.name}</span>
                <span className="text-gray-500">{s.plannedMinutes}m</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[10px] text-gray-500">You must fully complete each concept (Stop to mark done) before progressing. Reset clears all for this plan.</p>
    </div>
  );
}
