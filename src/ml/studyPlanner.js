// Greedy study planner: allocate minutes to concepts maximizing predicted mastery gain per minute.
// Input concepts: [{concept_id, name, mastery, difficultyGuess?}]

import { predictMastery } from './masteryPredictor';

export function planStudy({ concepts, totalMinutes = 120, slice = 15 }){
  if(!concepts || concepts.length === 0) return { allocations: [], projectedGain: 0 };
  const allocs = concepts.map(c => ({ ...c, minutes: 0, current: c.mastery }));
  function marginalGain(c){
    // approximate gain if we add one slice
    const simulated = predictMastery(Math.min(0.999, c.current + (c.minutes/300)), {
      minutesLastWeek: c.minutes + slice,
      difficulty: c.difficultyGuess || 2.5
    });
    return simulated.delta / slice; // gain per minute
  }
  let remaining = totalMinutes;
  while(remaining >= slice){
    allocs.sort((a,b)=> marginalGain(b) - marginalGain(a));
    const best = allocs[0];
    if(marginalGain(best) <= 0.0005) break; // negligible gain left
    best.minutes += slice;
    remaining -= slice;
  }
  // compute final projected mastery
  let totalGain = 0;
  for(const a of allocs){
    const { projected } = predictMastery(Math.min(0.999, a.current + (a.minutes/300)), {
      minutesLastWeek: a.minutes,
      difficulty: a.difficultyGuess || 2.5
    });
    a.projected = projected;
    totalGain += (projected - a.current);
  }
  return { allocations: allocs.filter(a=> a.minutes>0).sort((a,b)=> b.minutes - a.minutes), projectedGain: totalGain };
}
