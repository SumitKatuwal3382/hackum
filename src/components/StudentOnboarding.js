import React, { useState } from 'react';
import { useData } from '../store';
import Badge from './Badge';

export default function StudentOnboarding({ onCreated, onCancel }) {
  const { courses, concepts, courseConcepts, addStudent, addEnrollment, addWeakness, addAvailability } = useData();
  const [name, setName] = useState('');
  const [major, setMajor] = useState('Undeclared');
  const [gpa, setGpa] = useState('3.0');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [weakConcepts, setWeakConcepts] = useState([]); // {concept_id, mastery}
  const [availabilityRows, setAvailabilityRows] = useState([]); // {day,hour_start,hour_end}

  const toggleCourse = (id) => {
    setSelectedCourses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleWeakConcept = (id) => {
    setWeakConcepts(prev => prev.some(w => w.concept_id === id) ? prev.filter(w => w.concept_id !== id) : [...prev, { concept_id: id, mastery: 0.4 }]);
  };

  const updateMastery = (id, val) => {
    setWeakConcepts(prev => prev.map(w => w.concept_id === id ? { ...w, mastery: Number(val) } : w));
  };

  const addAvailRow = () => {
    setAvailabilityRows(prev => [...prev, { day: 'Mon', hour_start: 14, hour_end: 16 }]);
  };

  const updateAvail = (idx, field, value) => {
    setAvailabilityRows(prev => prev.map((r,i)=> i===idx ? { ...r, [field]: field.includes('hour') ? Number(value) : value } : r));
  };

  const removeAvail = (idx) => setAvailabilityRows(prev => prev.filter((_,i)=>i!==idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!name.trim()) return;
    const id = 'U' + Date.now().toString().slice(-5); // simple id gen
    addStudent({ id, name: name.trim(), gpa: Number(gpa), major });
    const term = 'FALL25';
    selectedCourses.forEach(cid => addEnrollment({ student_id: id, course_id: cid, term, grade_num: 0 }));
    weakConcepts.forEach(w => addWeakness({ student_id: id, concept_id: w.concept_id, mastery: w.mastery }));
    availabilityRows.forEach(a => addAvailability({ student_id: id, ...a }));
    onCreated && onCreated(id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Add Yourself</h2>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="fullName" className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
          <input id="fullName" value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Jane Doe" />
        </div>
        <div>
          <label htmlFor="major" className="block text-xs font-medium text-gray-600 mb-1">Major</label>
          <input id="major" value={major} onChange={e=>setMajor(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label htmlFor="gpa" className="block text-xs font-medium text-gray-600 mb-1">GPA</label>
            <input id="gpa" type="number" step="0.01" min="0" max="4" value={gpa} onChange={e=>setGpa(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900 text-sm">Courses</h3>
          <Badge>{selectedCourses.length} selected</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {courses.map(c => (
            <button key={c.id} type="button" onClick={()=>toggleCourse(c.id)} className={`px-3 py-1 rounded-full text-xs border ${selectedCourses.includes(c.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}>{c.id}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900 text-sm">Weak Concepts</h3>
          <Badge>{weakConcepts.length} selected</Badge>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {concepts.map(k => (
            <button key={k.id} type="button" onClick={()=>toggleWeakConcept(k.id)} className={`px-3 py-1 rounded-full text-xs border ${weakConcepts.some(w=>w.concept_id===k.id) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700'}`}>{k.name}</button>
          ))}
        </div>
        {weakConcepts.length > 0 && (
          <div className="space-y-2">
            {weakConcepts.map(w => {
              const concept = concepts.find(c => c.id === w.concept_id);
              return (
                <div key={w.concept_id} className="flex items-center gap-3 text-xs">
                  <span className="w-32 text-gray-700 truncate">{concept.name}</span>
                  <input type="range" min={0} max={1} step={0.01} value={w.mastery} onChange={e=>updateMastery(w.concept_id, e.target.value)} className="flex-1" />
                  <span className="tabular-nums text-gray-600 w-12 text-right">{(1 + w.mastery * 9).toFixed(1)}/10</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900 text-sm">Availability</h3>
          <button type="button" onClick={addAvailRow} className="px-2 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50">Add Slot</button>
        </div>
        {availabilityRows.length === 0 && <p className="text-xs text-gray-500">No availability added yet.</p>}
        <div className="space-y-2">
          {availabilityRows.map((r,i)=>(
            <div key={i} className="flex items-center gap-2 text-xs">
              <select value={r.day} onChange={e=>updateAvail(i,'day',e.target.value)} className="border rounded px-2 py-1">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=> <option key={d}>{d}</option>)}
              </select>
              <input type="number" min={0} max={23} value={r.hour_start} onChange={e=>updateAvail(i,'hour_start',e.target.value)} className="w-16 border rounded px-2 py-1" />
              <span>to</span>
              <input type="number" min={0} max={23} value={r.hour_end} onChange={e=>updateAvail(i,'hour_end',e.target.value)} className="w-16 border rounded px-2 py-1" />
              <button type="button" onClick={()=>removeAvail(i)} className="text-red-500 hover:underline">Remove</button>
            </div>
          ))}
        </div>
      </div>

    </form>
  );
}
