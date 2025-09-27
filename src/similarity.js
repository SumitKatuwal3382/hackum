// Local similarity prototype (stand-in for Neo4j similarity relationships)
// Provides two functions:
//  - learningStyleSimilarity(students) -> map of studentId -> [{peerId, score}]
//  - performanceSimilarity(students, enrollments) -> map of studentId -> [{peerId, score, overlap}]
//
// Since current data lacks learningStyle & pace fields, we'll synthesize a deterministic style
// based on hash of student id into one of four buckets.

const STYLES = ['Visual','Auditory','Reading/Writing','Kinesthetic'];
function styleFor(id){
  let h = 0; for(let i=0;i<id.length;i++){ h = (h*31 + id.charCodeAt(i)) >>> 0; }
  return STYLES[h % STYLES.length];
}

export function annotateLearningStyles(students){
  return students.map(s => ({...s, learningStyle: s.learningStyle || styleFor(s.id)}));
}

export function learningStyleSimilarity(students){
  const withStyle = annotateLearningStyles(students);
  const out = new Map();
  for(const s of withStyle){
    const peers = [];
    for(const t of withStyle){
      if(s.id === t.id) continue;
      const base = s.learningStyle === t.learningStyle ? 0.8 : 0.2;
      // simple distance on GPA as mild modifier
      const gpaDiff = Math.abs((s.gpa||0)-(t.gpa||0));
      const score = +(Math.max(0, base - gpaDiff*0.05)).toFixed(3);
      peers.push({ peerId: t.id, score });
    }
    peers.sort((a,b)=> b.score - a.score);
    out.set(s.id, peers.slice(0,5));
  }
  return out;
}

function gradeBucket(num){
  if(num >= 3.5) return 'A';
  if(num >= 3.0) return 'B';
  if(num >= 2.5) return 'C';
  if(num >= 2.0) return 'D';
  return 'F';
}

export function performanceSimilarity(students, enrollments){
  const byStudent = new Map();
  for(const e of enrollments){
    if(!byStudent.has(e.student_id)) byStudent.set(e.student_id, []);
    byStudent.get(e.student_id).push(e);
  }
  const out = new Map();
  for(const s of students){
    const mine = byStudent.get(s.id) || [];
    const mineIdx = new Map(mine.map(e=> [e.course_id, e]));
    const peers = [];
    for(const t of students){
      if(t.id === s.id) continue;
      const theirs = byStudent.get(t.id) || [];
      let common = 0; let scoreAccum = 0;
      for(const e of theirs){
        const m = mineIdx.get(e.course_id);
        if(m){
          common++;
          const g1 = gradeBucket(m.grade_num);
            const g2 = gradeBucket(e.grade_num);
          const diff = Math.abs(m.grade_num - e.grade_num); // numeric diff basis
          const gradeAlign = g1 === g2 ? 1 : 1 - Math.min(diff/4, 0.8);
          scoreAccum += gradeAlign;
        }
      }
      if(common >= 2){
        const score = +( (scoreAccum / common) * (1 + common*0.05) ).toFixed(3);
        peers.push({ peerId: t.id, score, overlap: common });
      }
    }
    peers.sort((a,b)=> b.score - a.score);
    out.set(s.id, peers.slice(0,5));
  }
  return out;
}

export function topSimilar(students, enrollments, studentId){
  const perf = performanceSimilarity(students, enrollments).get(studentId) || [];
  const style = learningStyleSimilarity(students).get(studentId) || [];
  // merge by peerId combining scores (weighted)
  const map = new Map();
  for(const p of perf){ map.set(p.peerId, { peerId: p.peerId, perf: p.score, overlap: p.overlap }); }
  for(const s of style){
    const base = map.get(s.peerId) || { peerId: s.peerId };
    base.style = s.score;
    map.set(s.peerId, base);
  }
  const merged = [...map.values()].map(m => ({
    ...m,
    combined: +(((m.perf||0)*0.6 + (m.style||0)*0.4).toFixed(3))
  }));
  merged.sort((a,b)=> b.combined - a.combined);
  return merged.slice(0,5);
}
