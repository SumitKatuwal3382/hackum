import React, { useState, useMemo } from "react";
import LogoConnect from './logo-connect.svg';
import { dayOrder } from "./data";
import { weakestConcepts, nextFreeSlot, peerMatches, enrolledCourses, conceptResources } from "./logic";
import { predictMastery } from "./ml/masteryPredictor";
import { scoreResource, fitToScale10, fitToLetter, fitLetterStyle } from "./ml/resourceRanker";
import Card from "./components/Card";
import Badge from "./components/Badge";
import GraphMini from "./components/GraphMini";
import Legend from "./components/Legend";
import StudentOnboarding from "./components/StudentOnboarding";
import { useData } from "./store";
import CoursePie from "./components/CoursePie";
import PeerInsights from "./components/PeerInsights";
// Removed QueryPlayground (Neo4j/query feature disabled)
import AIPlanner from "./components/AIPlanner";
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

  // helper to format mastery (stored 0-1) as 1-10 scale for display
  const formatMastery = (m) => (m == null ? '-' : (1 + m * 9).toFixed(1));

  return (
    <div className="min-h-screen app-bg p-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <div>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <img src={LogoConnect} alt="Connect and Learn logo" style={{width:46, height:46}} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold brand-title">Connect and Learn</h1>
              <p className="muted">Graph-powered daily study companion</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{`${s.name} (${s.id})`}</option>
            ))}
          </select>
          <button
            onClick={() => setShowOnboard((v) => !v)}
            className="px-3 py-2 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm"
            type="button"
          >
            {showOnboard ? 'Close' : 'Add Yourself'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {showOnboard && (
            <Card title="🧾 Onboarding">
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
                  className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-sm"
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
                  className="w-20 px-2 py-1 rounded-lg border border-gray-200 bg-white text-sm"
                />
                <Badge>Now: {day} {String(hourNow).padStart(2, "0")}:00</Badge>
              </div>
            }
          >
            <div className="mb-4">
              <p className="text-gray-700">
                {stu?.name ? (
                  <><span className="font-medium">{stu.name}</span> • Major: {stu.major} • GPA {Number(stu.gpa || 0).toFixed(2)}</>
                ) : (
                  <span className="text-gray-500">No student selected.</span>
                )}
              </p>
            </div>

            {slot ? (
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                  <span className="text-blue-700 font-medium">Suggested slot</span>
                  <span className="text-blue-800">
                    {slot.day} {String(slot.hour_start).padStart(2, "0")}:00–{String(slot.hour_end).padStart(2, "0")}:00
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-50 border border-yellow-100 text-yellow-800">
                  No upcoming availability found.
                </div>
              </div>
            )}

            {weak.map((w) => {
              const proj = predictMastery(w.mastery || 0, {});
              const projDisplay = (1 + (proj.projected)*9).toFixed(1);
              return (
                <div key={w.concept_id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-gray-900 font-medium">
                      Concept: {w.concept.name} <span className="text-gray-500">({w.concept_id})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>now {formatMastery(w.mastery)}/10</Badge>
                      <Badge>proj {projDisplay}/10</Badge>
                    </div>
                  </div>
                <div className="text-sm text-gray-700 mb-2">Resources</div>
                <ul className="space-y-1">
                  {conceptResources(w.concept_id, 3, { resources }).map((r) => {
                    const rawFit = scoreResource(r, { mastery: w.mastery, targetDifficulty: 2 + (w.mastery<0.5?0:1) });
                    const fit10 = fitToScale10(rawFit);
                    const letter = fitToLetter(rawFit);
                    return (
                      <li key={r.id} className="flex items-start gap-2 text-xs">
                        <div className="flex-1 min-w-0">
                          <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline font-medium">
                            {r.type.charAt(0).toUpperCase()+r.type.slice(1)}
                          </a>
                          <span className="text-gray-500"> • {r.duration}m</span>
                          <div className="mt-0.5 flex flex-wrap gap-1 items-center">
                            <span className={`px-1.5 py-0.5 rounded-md ${fitLetterStyle(letter)} font-medium`}>Fit {fit10} ({letter})</span>
                            {r.difficulty && (
                              <span className="px-1.5 py-0.5 rounded-md bg-gray-200 text-gray-700">D{r.difficulty}</span>
                            )}
                            {r.rating && (
                              <span className="px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-800">★ {r.rating.toFixed(1)}</span>
                            )}
                            {r.tags && r.tags.slice(0,2).map(t => (
                              <span key={t} className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600">{t}</span>
                            ))}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              );
            })}
          </Card>

          <Card title="🧠 Why these? (Graph neighborhood)">
            <GraphMini
              studentId={selectedStudent}
              conceptsToShow={targetConceptIds}
              students={students}
              courses={courses}
              concepts={concepts}
              enrollments={enrollments}
              courseConcepts={courseConcepts}
            />
            <div className="mt-4">
              <Legend />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="👥 Study Buddies">
            {peers.length === 0 ? (
              <p className="text-gray-600">No peers found yet.</p>
            ) : (
              <ul className="space-y-3">
                {peers.map((p) => (
                  <li key={`${p.student_id}-${p.concept_id}`} className="p-3 rounded-xl border border-gray-100 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{p.student.name}</div>
                        <div className="text-gray-600 text-sm">Also weak in {p.concept.name}</div>
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

          <Card title="📘 Enrolled Courses">
            <ul className="space-y-2">
              {enrolled.map((c) => (
                <li key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">{c.title}</div>
                    <div className="text-gray-600 text-sm">{c.id} • Level {c.level}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="📊 Course Load Breakdown">
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

          <Card title="🧮 AI Study Planner">
            <AIPlanner weaknesses={weaknesses.filter(w=> w.student_id === selectedStudent)} concepts={concepts} />
          </Card>

          <Card title="🔍 Concept Search (NL)">
            <ConceptSearch concepts={concepts} courses={courses} courseConcepts={courseConcepts} weaknesses={weaknesses.filter(w=> w.student_id === selectedStudent)} />
          </Card>
        </div>
      </main>
    </div>
  );
}
