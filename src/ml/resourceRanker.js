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
