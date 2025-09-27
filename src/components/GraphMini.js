import React, { useState } from "react";
export default function GraphMini({ studentId, conceptsToShow, width = 520, height = 280, students, courses, concepts, enrollments, courseConcepts }) {
  const [hover, setHover] = useState(null); // { type: 'course'|'concept'|'student', id, label, x, y }
  const s = students.find((x) => x.id === studentId);
  const cEnroll = enrollments.filter((e) => e.student_id === studentId).map((e) => courses.find((c) => c.id === e.course_id));
  const cConcepts = courseConcepts.filter(
    (cc) => cEnroll.some((c) => c.id === cc.course_id) && conceptsToShow.includes(cc.concept_id)
  );

  const cx = width / 2, cy = height / 2;
  const courseAngle = (2 * Math.PI) / Math.max(1, cEnroll.length);
  const conceptAngle = (2 * Math.PI) / Math.max(1, cConcepts.length);

  const coursePositions = cEnroll.map((c, i) => ({
    id: c.id,
    x: cx + 110 * Math.cos(i * courseAngle),
    y: cy + 110 * Math.sin(i * courseAngle),
    title: c.title,
  }));
  const conceptPositions = cConcepts.map((cc, i) => {
    const k = concepts.find((x) => x.id === cc.concept_id);
    return {
      id: k.id,
      x: cx + 180 * Math.cos(i * conceptAngle + 0.5),
      y: cy + 180 * Math.sin(i * conceptAngle + 0.5),
      name: k.name,
      course_id: cc.course_id,
    };
  });

  const posById = (arr, id) => arr.find((n) => n.id === id);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-72 bg-white rounded-2xl shadow-sm"
      role="img"
      aria-label="Student course and concept relationship graph"
    >
      {coursePositions.map((cp) => (
        <line key={`sc-${cp.id}`} x1={cx} y1={cy} x2={cp.x} y2={cp.y} stroke="#d1d5db" strokeWidth={2} />
      ))}
      {conceptPositions.map((kp, i) => {
        const course = posById(coursePositions, kp.course_id);
        return <line key={`cc-${i}`} x1={course.x} y1={course.y} x2={kp.x} y2={kp.y} stroke="#e5e7eb" strokeWidth={2} />;
      })}
      <g
        onMouseEnter={() => setHover({ type: 'student', id: s.id, label: s.name, x: cx, y: cy })}
        onMouseLeave={() => setHover(null)}
      >
        <circle cx={cx} cy={cy} r={24} fill="#111827" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fill="#fff">{s.name.split(" ")[0]}</text>
      </g>
      {coursePositions.map((cp) => (
        <g
          key={cp.id}
          onMouseEnter={() => setHover({ type: 'course', id: cp.id, label: cp.title, x: cp.x, y: cp.y })}
          onMouseLeave={() => setHover(null)}
          cursor="pointer"
        >
          <circle cx={cp.x} cy={cp.y} r={18} fill="#2563eb" opacity={0.9} />
          <text x={cp.x} y={cp.y + 4} textAnchor="middle" fontSize="10" fill="#fff">{cp.id}</text>
        </g>
      ))}
      {conceptPositions.map((kp) => (
        <g
          key={kp.id}
          onMouseEnter={() => setHover({ type: 'concept', id: kp.id, label: kp.name, x: kp.x, y: kp.y })}
          onMouseLeave={() => setHover(null)}
          cursor="pointer"
        >
          <circle cx={kp.x} cy={kp.y} r={14} fill="#10b981" opacity={0.9} />
          <text x={kp.x} y={kp.y + 4} textAnchor="middle" fontSize="9" fill="#fff">{kp.name.split(" ")[0]}</text>
        </g>
      ))}

      {hover && (
        <foreignObject x={hover.x - 60} y={hover.y - 44} width={120} height={40} pointerEvents="none">
          <div className="animate-fade-in pointer-events-none rounded-lg bg-gray-900/90 text-white text-xs px-2 py-1 shadow-md text-center">
            {hover.label}
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
