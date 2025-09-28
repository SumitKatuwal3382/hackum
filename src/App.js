import React, { useState, useMemo } from "react";
import LogoConnect from './logo-connect.svg';
import { dayOrder } from "./data";
import { weakestConcepts, nextFreeSlot, peerMatches, enrolledCourses, conceptResources } from "./logic";
import { predictMastery } from "./ml/masteryPredictor";
import { scoreResource, fitToScale10, fitToLetter, fitLetterStyle } from "./ml/resourceRanker";
import Card from "./components/Card";
import Badge from "./components/Badge";
import Legend from "./components/Legend";
import StudentOnboarding from "./components/StudentOnboarding";
import { useData } from "./store";
import CoursePie from "./components/CoursePie";
// CoursePlanets3D was replaced by CoursePie for the Course Load Breakdown card
// import CoursePlanets3D from "./components/CoursePlanets3D";
import PeerInsights from "./components/PeerInsights";
import CoursePlanets3D from "./components/CoursePlanets3D";
// Removed QueryPlayground (Neo4j/query feature disabled)
import AIPlanner from "./components/AIPlanner";
import StudySuggestion from "./components/StudySuggestion";
import { planStudy } from './ml/studyPlanner';
import ConceptSearch from "./components/ConceptSearch";

export default function App() {
  const { students, enrollments, weaknesses, availability, courses, concepts, courseConcepts, resources } = useData();
  const [selectedStudent, setSelectedStudent] = useState(() => students[0]?.id);
  const [day, setDay] = useState("Mon");
  const [hourNow, setHourNow] = useState(14);
  const [showOnboard, setShowOnboard] = useState(false);

  const stu = useMemo(() => students.find((s) => s.id === selectedStudent) || {}, [students, selectedStudent]);
  const weak = useMemo(() => selectedStudent ? weakestConcepts(selectedStudent, 3, { weaknesses, concepts }) : [], [selectedStudent, weaknesses, concepts]);
  const slot = useMemo(() => selectedStudent ? nextFreeSlot(selectedStudent, day, hourNow, { availability }) : null, [selectedStudent, day, hourNow, availability]);
  const targetConceptIds = weak.map((w) => w.concept_id);
  const peers = useMemo(() => selectedStudent ? peerMatches(selectedStudent, targetConceptIds, 3, { weaknesses, students, concepts }) : [], [selectedStudent, targetConceptIds, weaknesses, students, concepts]);
  const enrolled = useMemo(() => selectedStudent ? enrolledCourses(selectedStudent, { enrollments, courses }) : [], [selectedStudent, enrollments, courses]);
  // derive a lightweight plan (reuse logic from AIPlanner) for context to Gemini without duplicating UI state
  const geminiPlanContext = useMemo(()=>{
    const weakConcepts = weak.map(w => ({
      concept_id: w.concept_id,
      name: w.concept?.name || w.concept_id,
      mastery: w.mastery,
      difficultyGuess: 2.5
    }));
    const plan = planStudy({ concepts: weakConcepts, totalMinutes: 120, slice: 15 });
    return { plan };
  }, [weak]);

  // helper to format mastery (stored 0-1) as 1-10 scale for display
  const formatMastery = (m) => (m == null ? '-' : (1 + m * 9).toFixed(1));
  const [hoverRes, setHoverRes] = useState(null);

  // apply the starfield image at runtime so the CSS loader doesn't try to resolve it at build-time
  // include dark radial and linear overlays before the image to keep UI contrast
  const rootBgStyle = {
    background: "radial-gradient(1200px 600px at 10% 10%, rgba(14,30,52,0.35), transparent 10%), linear-gradient(180deg, rgba(2,4,8,0.55), rgba(7,8,12,0.75)), url('/starfield.jpg') center center / cover no-repeat",
  };

  return (
    <div className="min-h-screen app-bg p-6" style={rootBgStyle}>
      <header className="topbar">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <div className="logo-badge"><img src="/placeholder-logo.svg" alt="logo" style={{width:34,height:34}}/></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold brand-title">Connect and Learn</h1>
              <p className="brand-sub">Cosmic knowledge exploration platform</p>
            </div>
          </div>
        </div>
  <div className="flex items-center gap-3">
          <select
            className="px-3 py-2 rounded-xl border border-gray-700 bg-transparent text-gray-200"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{`${s.name} (${s.id})`}</option>
            ))}
          </select>
          <button
            onClick={() => setShowOnboard((v) => !v)}
            className="btn-primary"
            type="button"
          >
            {showOnboard ? 'Close' : 'Add Yourself'}
          </button>
        </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {showOnboard && (
                      <Card title="Courses">
              <StudentOnboarding
                onCreated={(id) => {
                  setSelectedStudent(id);
                  setShowOnboard(false);
                }}
                onCancel={() => setShowOnboard(false)}
              />
            </Card>
          )}
          <Card
            title="🗓️ Today’s Plan"
            right={
              <div className="flex items-center gap-2">
                <select
                  className="px-2 py-1 rounded-lg border border-gray-700 bg-transparent text-sm text-gray-200"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                >
                  {dayOrder.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={hourNow}
                  onChange={(e) => setHourNow(Number(e.target.value))}
                  className="w-20 px-2 py-1 rounded-lg border border-gray-700 bg-transparent text-sm text-gray-200"
                />
                <Badge>Now: {day} {String(hourNow).padStart(2, "0")}:00</Badge>
              </div>
            }
          >
            <div className="mb-4 student-header">
              {stu?.name ? (
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <div className="avatar-circle">{(stu.name || '').split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                  <div>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <div className="student-name">{stu.name}</div>
                      <div className="pill major-pill">{stu.major ? `${stu.major} Major` : 'Undeclared'}</div>
                      <div className="pill gpa-pill">GPA {Number(stu.gpa || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">No student selected.</span>
              )}
            </div>

            {slot ? (
              <div className="mb-4">
                <div className="session-card rounded-xl p-5">
                  <div style={{display:'flex', alignItems:'center', gap:16}}>
                    <div className="session-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10h10v2H7z" fill="#9ed7ff"/><path d="M7 14h6v2H7z" fill="#9ed7ff"/><path d="M3 6h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6zm2-3h2v2H5V3zm10 0h2v2h-2V3z" fill="#9ed7ff"/></svg>
                    </div>
                    <div>
                      <div className="session-title">Optimized Study Session</div>
                      <div className="session-subtext">{slot.day} {String(slot.hour_start).padStart(2, "0")}:00–{String(slot.hour_end).padStart(2, "0")}:00 • AI-recommended focus time</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.02)] text-yellow-300">
                  No upcoming availability found.
                </div>
              </div>
            )}

            {weak.map((w) => {
              const proj = predictMastery(w.mastery || 0, {});
              const projDisplay = (1 + (proj.projected)*9).toFixed(1);
              const resourcesList = conceptResources(w.concept_id, 3, { resources });
              return (
                <div key={w.concept_id} className="p-4 rounded-xl border border-[rgba(255,255,255,0.03)] bg-[rgba(255,255,255,0.01)] mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-lg font-extrabold text-gray-100">{w.concept.name} <span className="text-gray-400 text-sm">({w.concept_id})</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="pill-muted">now {formatMastery(w.mastery)}/10</div>
                      <div className="pill">proj {projDisplay}/10</div>
                    </div>
                  </div>

                  {/* thin progress line */}
                  <div className="progress-wrap mb-4" style={{height:8}}>
                    <div className="progress-fill" style={{width: `${Math.min(100, ( (w.mastery||0) * 100))}%`}} />
                  </div>

                  <div className="mb-2 text-sm text-gray-300">Resources</div>
                    <ul className="space-y-3">
                    {resourcesList.map(r => {
                      const rawFit = scoreResource(r, { mastery: w.mastery, targetDifficulty: 2 + (w.mastery<0.5?0:1) });
                      const fit10 = fitToScale10(rawFit);
                      const letter = fitToLetter(rawFit);
                      return (
                        <li key={r.id} className="flex items-center justify-between res-row">
                          <div className="flex items-center gap-4">
                            <div className="res-icon">
                              {r.type === 'video' ? (
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7-11-7z" fill="#9ed7ff"/></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h12v14H6z" fill="#9ed7ff"/></svg>
                              )}
                            </div>
                            <div>
                              <a href={r.url} target="_blank" rel="noreferrer" className="text-gray-100 font-medium text-[15px] link-underline">{r.type.charAt(0).toUpperCase()+r.type.slice(1)}</a>
                              <div className="text-sm text-gray-400 text-[13px]">{r.duration}m</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={"pill-fit fit-" + (letter || 'C')}>
                              Fit {fit10} ({letter})
                            </div>
                            {r.difficulty && <div className="pill-muted">D{r.difficulty}</div>}
                            {r.rating && <div className="pill-star">★ {r.rating.toFixed(1)}</div>}
                            {r.tags && r.tags.slice(0,2).map(t => <div key={t} className="tag-pill">{t}</div>)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          <Card title="🧮 AI Study Planner" className="mt-6">
            <AIPlanner studentId={selectedStudent} weaknesses={weaknesses.filter(w=> w.student_id === selectedStudent)} concepts={concepts} />
          </Card>
          </Card>

          {/* Graph neighborhood removed — using Knowledge Universe (3D planets) instead */}
          {/* Knowledge Universe (3D planets) placed to appear alongside the Course Load Breakdown */}
          <Card title="Courses">
            <div style={{height: 360}} className="rounded-xl overflow-hidden">
                <CoursePlanets3D height={420} studentId={selectedStudent} students={students} courses={courses} concepts={concepts} enrollments={enrollments} courseConcepts={courseConcepts} weaknesses={weaknesses} />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Study Buddies">
            {peers.length === 0 ? (
              <p className="text-gray-500">No peers found yet.</p>
            ) : (
              <ul className="space-y-3">
                {peers.map((p) => (
                  <li key={`${p.student_id}-${p.concept_id}`} className="p-3 rounded-xl border border-[rgba(255,255,255,0.02)] bg-[rgba(255,255,255,0.01)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-100">{p.student.name}</div>
                        <div className="text-gray-400 text-sm">Also weak in {p.concept.name}</div>
                      </div>
                      <Badge>mastery {formatMastery(p.mastery)}/10</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          

          <Card title="🤝 Peer Insights (Prototype)">
            <PeerInsights studentId={selectedStudent} students={students} enrollments={enrollments} />
          </Card>

          <Card title="� Course Load Breakdown" className="right-card center">
            {selectedStudent ? (
              <CoursePie
                studentId={selectedStudent}
                enrollments={enrollments}
                courses={courses}
                courseConcepts={courseConcepts}
                weaknesses={weaknesses}
                concepts={concepts}
              />
            ) : (
              <p className="text-gray-500 text-sm">Select a student to view course distribution.</p>
            )}
            <p className="mt-4 text-[11px] text-gray-500 leading-snug">
              Slice size = concept count in course. Color = grade (red low → green high). Tooltip shows average mastery (1–10 scale) for concepts the student is weak in.
            </p>
          </Card>

          <Card title="�📘 Enrolled Courses">
            <ul className="space-y-2">
              {enrolled.map((c) => (
                <li key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.02)]">
                  <div>
                    <div className="font-medium text-gray-100">{c.title}</div>
                    <div className="text-gray-400 text-sm">{c.id} • Level {c.level}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          

          <Card title="💡 AI Suggestion">
            <StudySuggestion
              student={stu}
              weaknesses={weak}
              planContext={geminiPlanContext}
              day={day}
              hourNow={hourNow}
            />
          </Card>

          <Card title="🔍 Concept Search (NL)">
            <ConceptSearch concepts={concepts} courses={courses} courseConcepts={courseConcepts} weaknesses={weaknesses.filter(w=> w.student_id === selectedStudent)} />
          </Card>
        </div>
      </main>
    </div>
  );
}
