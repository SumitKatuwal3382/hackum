import React, { useState, useMemo } from 'react';
import { planStudy } from '../ml/studyPlanner';
import Badge from './Badge';

export default function AIPlanner({ weaknesses, concepts }){
  const [minutes, setMinutes] = useState(120);
  const [slice, setSlice] = useState(15);
  const weakConcepts = useMemo(()=> weaknesses.map(w => ({
    concept_id: w.concept_id,
    name: concepts.find(c=> c.id === w.concept_id)?.name || w.concept_id,
    mastery: w.mastery,
    difficultyGuess: 2.5 + (Math.random()*0.8 - 0.4) // light variation
  })), [weaknesses, concepts]);

  const plan = useMemo(()=> planStudy({ concepts: weakConcepts, totalMinutes: minutes, slice }), [weakConcepts, minutes, slice]);

  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-end flex-wrap">
        <label className="flex flex-col text-xs text-gray-600">Total Minutes
          <input type="number" min={15} step={15} value={minutes} onChange={e=> setMinutes(Number(e.target.value)||0)} className="mt-1 px-2 py-1 rounded-md border border-gray-200 text-sm" />
        </label>
        <label className="flex flex-col text-xs text-gray-600">Slice (min)
          <input type="number" min={5} step={5} value={slice} onChange={e=> setSlice(Number(e.target.value)||0)} className="mt-1 px-2 py-1 rounded-md border border-gray-200 text-sm" />
        </label>
        <Badge>Gain ≈ {(plan.projectedGain*9).toFixed(1)} mastery pts total</Badge>
      </div>
      {plan.allocations.length === 0 && <p className="text-gray-500 text-sm">Not enough time or no weak concepts to allocate.</p>}
      <ul className="space-y-2">
        {plan.allocations.map(a => (
          <li key={a.concept_id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900">{a.name}</span>
              <span className="text-xs text-gray-600">{a.minutes}m</span>
            </div>
            <div className="h-2 w-full bg-white rounded overflow-hidden border border-gray-200">
              <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (a.minutes / minutes)*100)}%` }} />
            </div>
            <div className="mt-1 text-[11px] text-gray-600">Projected: {(1 + a.projected*9).toFixed(1)}/10 (was {(1 + a.current*9).toFixed(1)}/10)</div>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-gray-500 leading-snug">Planner uses a greedy heuristic maximizing marginal mastery gain per 15-minute slice. Tune slice size for more granularity.</p>
    </div>
  );
}
