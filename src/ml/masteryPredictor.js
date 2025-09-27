// Heuristic mastery predictor (0-1 internal scale)
// projectedMastery = current + predictedDelta (clamped 0..1)
// predictedDelta based on remaining headroom, resource quality proxy, difficulty, study minutes proxy (simulated)

export function predictMastery(current, {
  avgResourceRating = 4.3,
  difficulty = 2.5,
  minutesLastWeek = 40,
  conceptFrequency = 2,
} = {}){
  const headroom = Math.max(0, 1 - current);
  const ratingFactor = (avgResourceRating - 3) / 2; // ~0..1
  const difficultyPenalty = (difficulty - 2) * 0.08; // mild
  const minuteBoost = Math.min(1, minutesLastWeek / 120); // saturate at 2h
  const freqBoost = Math.log1p(conceptFrequency) / 3; // diminishing returns
  let delta = 0.18 * headroom + 0.10 * ratingFactor + 0.12 * minuteBoost + 0.06 * freqBoost - difficultyPenalty;
  delta = Math.max(0, delta) * 0.65; // soften
  const projected = Math.min(1, current + delta);
  return { projected, delta };
}

export function batchPredict(concepts){
  return concepts.map(c => ({ ...c, prediction: predictMastery(c.mastery || 0, {}) }));
}
