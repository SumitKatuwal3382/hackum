#!/usr/bin/env node
/**
 * Synthetic data generator for the React app.
 * Generates a file at src/generatedData.js mirroring the shape of data.js exports.
 *
 * Usage (after adding npm script):
 *   npm run generate:data -- --students 50 --courses 25 --concepts 120
 *
 * Defaults are chosen for a balanced demo dataset.
 */

const fs = require('fs');
const path = require('path');

// Lazy lightweight faker substitute (minimal) to avoid pulling large dependency
// If you prefer full faker, install '@faker-js/faker' and replace helpers.
function randomChoice(arr){return arr[Math.floor(Math.random()*arr.length)];}
function randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function randomFloat(min,max){return min+Math.random()*(max-min);} // 0-1 mastery etc.
const sampleFirst = ['Ava','Liam','Mia','Noah','Ethan','Isla','Mason','Zoe','Lucas','Ivy','Aria','Leo','Nora','Owen','Ruby','Ella','Finn','Luna','Jack','Mila'];
const sampleLast = ['Smith','Johnson','Lee','Patel','Garcia','Khan','Chen','Brown','Martin','Clark','Lewis','Walker','Young','Allen'];

function makeStudent(id){
  const first = randomChoice(sampleFirst);
  const last = randomChoice(sampleLast);
  return { id: `S${id}`, name: `${first} ${last}` };
}

function makeConcept(id){
  return { id: `K_${id}`, name: `Concept ${id}` };
}

function makeCourse(id, conceptPool){
  const conceptCount = randomInt(3,7);
  const picked = new Set();
  while(picked.size < conceptCount){ picked.add(randomChoice(conceptPool).id); }
  return { id: `C${id}`, code: `COUR${id}`, name: `Course ${id}`, conceptIds: [...picked] };
}

function gradeFromMastery(m){
  if(m>=0.9) return 'A';
  if(m>=0.8) return 'B';
  if(m>=0.7) return 'C';
  if(m>=0.6) return 'D';
  return 'F';
}

function makeResource(conceptId, idx){
  const types = ['video','article','exercise','tutorial'];
  const tags = ['fundamentals','practice','review','challenge','project'];
  return {
    id: `R_${conceptId}_${idx}`,
    conceptId,
    type: randomChoice(types),
    title: `Resource ${conceptId} #${idx}`,
    url: `https://example.com/${conceptId}/${idx}`,
    difficulty: randomInt(1,5),
    rating: +(randomFloat(2.5,5).toFixed(1)),
    tags: [randomChoice(tags), randomChoice(tags)].filter((v,i,a)=>a.indexOf(v)===i)
  };
}

function generate(opts){
  const students = Array.from({length: opts.students}, (_,i)=> makeStudent(i+1));
  const concepts = Array.from({length: opts.concepts}, (_,i)=> makeConcept(i+1));
  const courses = Array.from({length: opts.courses}, (_,i)=> makeCourse(i+1, concepts));

  // Flatten courseConcepts mapping
  const courseConcepts = courses.flatMap(c=> c.conceptIds.map(k=>({ courseId: c.id, conceptId: k })));

  // Enroll each student in 3-6 random courses
  const enrollments = [];
  const weaknesses = [];
  const availability = [];
  const resources = [];

  const today = new Date();
  function addDays(d,delta){ const nd = new Date(d); nd.setDate(nd.getDate()+delta); return nd; }
  function fmt(dt){ return dt.toISOString().split('T')[0]; }

  students.forEach(s=>{
    const courseSample = [...courses];
    const enrollCount = randomInt(3,6);
    const picked = [];
    while(picked.length < enrollCount && courseSample.length){
      const idx = randomInt(0, courseSample.length-1);
      picked.push(courseSample.splice(idx,1)[0]);
    }
    picked.forEach(c=>{
      // mastery per concept for this student+course stored indirectly via weaknesses list (low mastery) and random grade
      const mastery = randomFloat(0.4,0.98);
      enrollments.push({ studentId: s.id, courseId: c.id, grade: gradeFromMastery(mastery) });
    });

    // Weaknesses: pick 2-5 concepts from the student's enrolled courses
    const studentConcepts = new Set(picked.flatMap(c=> c.conceptIds));
    const weakCount = randomInt(2, Math.min(5, studentConcepts.size));
    const scArr = [...studentConcepts];
    for(let i=0;i<weakCount;i++){
      const cid = scArr[randomInt(0, scArr.length-1)];
      weaknesses.push({ studentId: s.id, conceptId: cid, mastery: +(randomFloat(0.15,0.55).toFixed(2)) });
    }

    // Weekly availability (simplified) Mon-Fri blocks
    const days = ['Mon','Tue','Wed','Thu','Fri'];
    days.forEach((d,di)=>{
      availability.push({ studentId: s.id, date: fmt(addDays(today, di)), hours: randomInt(1,3) });
    });
  });

  // Resources: 2-4 per concept
  concepts.forEach(con=>{
    const count = randomInt(2,4);
    for(let i=0;i<count;i++) resources.push(makeResource(con.id, i+1));
  });

  return { students, concepts, courses, courseConcepts, enrollments, weaknesses, availability, resources };
}

function main(){
  const args = process.argv.slice(2);
  const opts = { students: 30, courses: 15, concepts: 80 };
  for(let i=0;i<args.length;i++){
    const a = args[i];
    if(a === '--students') opts.students = parseInt(args[++i],10);
    else if(a === '--courses') opts.courses = parseInt(args[++i],10);
    else if(a === '--concepts') opts.concepts = parseInt(args[++i],10);
  }
  const data = generate(opts);
  const outPath = path.join(process.cwd(), 'src', 'generatedData.js');
  const header = `// AUTO-GENERATED FILE - do not edit manually.\n// Generated ${new Date().toISOString()} with options ${JSON.stringify(opts)}\n`;
  const exportLines = Object.entries(data).map(([k,v])=> `export const ${k} = ${JSON.stringify(v, null, 2)};`).join('\n\n');
  fs.writeFileSync(outPath, header + exportLines + '\n');
  console.log(`Generated synthetic dataset at src/generatedData.js (students=${opts.students}, courses=${opts.courses}, concepts=${opts.concepts})`);
}

if(require.main === module){
  main();
}
