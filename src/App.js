import React, { useState, useMemo } from "react";
import { dayOrder } from "./data";
import { weakestConcepts, nextFreeSlot, peerMatches, enrolledCourses, conceptResources } from "./logic";
import Card from "./components/Card";
import Badge from "./components/Badge";
import GraphMini from "./components/GraphMini";
import Legend from "./components/Legend";
import StudentOnboarding from "./components/StudentOnboarding";
import { useData } from "./store";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">📚 StudyMate Graph</h1>
          <p className="text-gray-600">Graph-powered daily study companion</p>
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

            {weak.map((w) => (
              <div key={w.concept_id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-gray-900 font-medium">
                    Concept: {w.concept.name} <span className="text-gray-500">({w.concept_id})</span>
                  </div>
                  <Badge>mastery {w.mastery.toFixed(2)}</Badge>
                </div>
                <div className="text-sm text-gray-700 mb-2">Resources</div>
                <ul className="list-disc pl-5 space-y-1">
                  {conceptResources(w.concept_id, 2, { resources }).map((r) => (
                    <li key={r.id}>
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                        {r.type}
                      </a>
                      {r.duration && <span className="text-gray-500"> • {r.duration} min</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
                      <Badge>mastery {p.mastery.toFixed(2)}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
        </div>
      </main>
    </div>
  );
}
