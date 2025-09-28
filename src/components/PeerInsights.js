import React, { useMemo } from 'react';
import { topSimilar, annotateLearningStyles } from '../similarity';
import Badge from './Badge';

export default function PeerInsights({ studentId, students, enrollments }){
  const enriched = useMemo(()=> annotateLearningStyles(students), [students]);
  const peers = useMemo(()=> studentId ? topSimilar(enriched, enrollments, studentId) : [], [studentId, enriched, enrollments]);
  const me = enriched.find(s=> s.id === studentId);

  if(!studentId) return <p className="text-gray-500 text-sm">Select a student.</p>;

  return (
    <div className="space-y-3">
    {peers.length === 0 && <p className="text-gray-600 text-sm">Not enough overlap yet to compute similarities.</p>}
      {peers.map(p => {
        const stu = enriched.find(s=> s.id === p.peerId);
        return (
          <div key={p.peerId} className="p-3 rounded-xl border border-[rgba(255,255,255,0.02)] bg-[rgba(255,255,255,0.01)]">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-gray-100">{stu?.name || p.peerId}</div>
                <Badge>{Math.min(10, (p.combined*10)).toFixed(1)}/10</Badge>
              </div>
              <div className="text-xs text-gray-400 flex flex-wrap gap-2">
                <span>Style: {stu?.learningStyle}</span>
                {p.overlap && <span>Overlap courses: {p.overlap}</span>}
                {p.perf !== undefined && <span>Perf sim: {Math.min(10,(p.perf*10)).toFixed(1)}/10</span>}
                {p.style !== undefined && <span>Style sim: {Math.min(10,(p.style*10)).toFixed(1)}/10</span>}
              </div>
            </div>
        );
      })}
      {me && (
        <p className="mt-2 text-[11px] text-gray-500 leading-snug">
          Combined score = 60% performance + 40% learning style (local heuristic only; Neo4j removed).
        </p>
      )}
    </div>
  );
}
