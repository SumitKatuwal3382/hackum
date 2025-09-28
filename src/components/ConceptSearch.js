import React, { useState, useMemo } from 'react';
import { buildConceptIndex, searchConcepts } from '../ml/embedder';
import Badge from './Badge';

export default function ConceptSearch({ concepts, courses, courseConcepts, weaknesses }){
  const [q,setQ] = useState('improve biology genetics');
  const index = useMemo(()=> buildConceptIndex(concepts, courses, courseConcepts), [concepts, courses, courseConcepts]);
  const results = useMemo(()=> q.trim()? searchConcepts(index, q, { topK: 6 }) : [], [index, q]);
  const weakSet = new Set(weaknesses.map(w=> w.concept_id));
  return (
    <div className="space-y-3">
      <input value={q} onChange={e=> setQ(e.target.value)} placeholder="e.g. strengthen calculus series" className="w-full px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.03)] bg-transparent text-sm text-gray-200" />
      {results.length === 0 && <p className="text-gray-500 text-sm">Enter a learning goal phrase.</p>}
      <ul className="space-y-2">
        {results.map(r => (
          <li key={r.id} className="p-3 rounded-lg bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.02)] flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-100">{r.name}</div>
              <div className="text-[11px] text-gray-400">Score {(r.score).toFixed(2)}</div>
            </div>
            {weakSet.has(r.id) ? <Badge>Weak</Badge> : <span className="text-xs text-green-300 bg-[rgba(34,197,94,0.08)] px-2 py-1 rounded-md">Not weak</span>}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-gray-500 leading-snug">Concept search uses token cosine similarity over concept + related course titles (no external model).</p>
    </div>
  );
}
