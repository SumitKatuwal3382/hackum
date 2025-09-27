// Extremely lightweight token-based embed + cosine similarity for concept search.

function tokenize(text){
  return (text||'').toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(Boolean);
}

function vectorize(text){
  const tokens = tokenize(text);
  const freq = {};
  for(const t of tokens){ freq[t] = (freq[t]||0)+1; }
  return freq;
}

function cosine(a,b){
  let dot = 0; let na = 0; let nb = 0;
  for(const k in a){ na += a[k]*a[k]; if(b[k]) dot += a[k]*b[k]; }
  for(const k in b){ nb += b[k]*b[k]; }
  if(!na || !nb) return 0;
  return dot / (Math.sqrt(na)*Math.sqrt(nb));
}

export function buildConceptIndex(concepts, courses, courseConcepts){
  // augment concept text with course titles that include it
  const byCourse = new Map(courses.map(c=> [c.id, c]));
  const courseMap = new Map();
  for(const cc of courseConcepts){
    if(!courseMap.has(cc.concept_id)) courseMap.set(cc.concept_id, []);
    const c = byCourse.get(cc.course_id);
    if(c) courseMap.get(cc.concept_id).push(c.title);
  }
  return concepts.map(c => {
    const text = c.name + ' ' + (courseMap.get(c.id)||[]).join(' ');
    return { id: c.id, name: c.name, vec: vectorize(text) };
  });
}

export function searchConcepts(index, query, { topK = 5 } = {}){
  const qv = vectorize(query);
  return index.map(e => ({ id: e.id, name: e.name, score: cosine(e.vec, qv) }))
    .filter(r=> r.score > 0)
    .sort((a,b)=> b.score - a.score)
    .slice(0, topK);
}
