import React, { useState, useMemo } from 'react';
import { buildConceptIndex, searchConcepts } from '../ml/embedder';
import Badge from './Badge';

export default function ConceptSearch({ concepts, courses, courseConcepts, weaknesses }){
  const [q,setQ] = useState('improve biology genetics');
  const index = useMemo(()=> buildConceptIndex(concepts, courses, courseConcepts), [concepts, courses, courseConcepts]);
  const results = useMemo(()=> q.trim()? searchConcepts(index, q, { topK: 6 }) : [], [index, q]);
  const weakMap = new Map(weaknesses.map(w=> [w.concept_id, w]));
  function formatMastery(m){
    if(m == null) return '-';
    return (1 + m*9).toFixed(1); // convert 0-1 → 1-10 scale
  }
  const WEAK_THRESHOLD = 0.5; // below this mastery considered weak
  return (
    <div className="space-y-3">
      <input value={q} onChange={e=> setQ(e.target.value)} placeholder="e.g. strengthen calculus series" className="w-full px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.03)] bg-transparent text-sm text-gray-200" />
      {results.length === 0 && <p className="text-gray-500 text-sm">Enter a learning goal phrase.</p>}
      <ul className="space-y-2">
        {results.map(r => {
          const weakEntry = weakMap.get(r.id);
          const mastery = weakEntry?.mastery;
          const isWeak = mastery != null ? mastery < WEAK_THRESHOLD : weakEntry != null;
          return (
            <li key={r.id} className="p-3 rounded-lg bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.02)] flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-100">{r.name}</div>
                <div className="text-[11px] text-gray-400 flex items-center gap-2">
                  <span>Similarity {(r.score).toFixed(2)}</span>
                  {mastery != null && (
                    <span className="text-gray-300">Mastery {formatMastery(mastery)}/10</span>
                  )}
                </div>
              </div>
              {isWeak ? (
                <Badge>Weak</Badge>
              ) : (
                <span className="text-xs text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-md">OK</span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-gray-500 leading-snug">Concept search uses token cosine similarity over concept + related course titles. Mastery shown on 1–10 scale (derived from internal 0–1).</p>
    </div>
  );
}
