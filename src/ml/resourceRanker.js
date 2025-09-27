// Resource fit scoring: combines mastery gap, rating, difficulty alignment, tag boosts

export function scoreResource(resource, { mastery = 0.4, targetDifficulty = 2, preferredTags = [] } = {}){
  const gap = 1 - mastery; // bigger gap => higher value
  const rating = (resource.rating || 3) / 5; // 0..1
  const diffAlignment = 1 - Math.min(1, Math.abs((resource.difficulty||2) - targetDifficulty)/4);
  const tagBoost = preferredTags.length ? (resource.tags||[]).some(t=> preferredTags.includes(t)) ? 0.15 : 0 : 0;
  const score = (0.45*gap + 0.30*rating + 0.20*diffAlignment + tagBoost);
  return +score.toFixed(3);
}

export function rankResources(resources, ctx){
  return [...resources].map(r=> ({ ...r, fitScore: scoreResource(r, ctx) }))
    .sort((a,b)=> b.fitScore - a.fitScore);
}

// Convert raw 0-1 fit score to a 1-10 scale (rounded to one decimal)
export function fitToScale10(score){
  if(score == null || isNaN(score)) return '-';
  return (1 + score * 9).toFixed(1); // analogous to mastery formatting
}

// Map score to letter grade (tunable bands)
export function fitToLetter(score){
  if(score == null || isNaN(score)) return '—';
  if(score >= 0.80) return 'A';
  if(score >= 0.70) return 'B';
  if(score >= 0.55) return 'C';
  if(score >= 0.40) return 'D';
  return 'E';
}

// Provide a Tailwind color style for letter grade (soft semantic mapping)
export function fitLetterStyle(letter){
  switch(letter){
    case 'A': return 'bg-green-50 text-green-700';
    case 'B': return 'bg-emerald-50 text-emerald-700';
    case 'C': return 'bg-yellow-50 text-yellow-700';
    case 'D': return 'bg-orange-50 text-orange-700';
    case 'E': return 'bg-red-50 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
