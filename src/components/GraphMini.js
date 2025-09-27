import React, { useState, useRef, useLayoutEffect, useCallback } from "react";

// Utility: simple linear color scale from low (red) to high (green)
function masteryColor(m) {
  if (m == null) return '#10b981';
  const clamped = Math.max(0, Math.min(1, m));
  const r = Math.round(255 * (1 - clamped));
  const g = Math.round(160 + 95 * clamped); // start at softer 160 to 255
  return `rgb(${r},${g},120)`; // fixed blueish component to keep palette cohesive
}

export default function GraphMini({
  studentId,
  conceptsToShow,
  width: fixedWidth,
  height: fixedHeight,
  students,
  courses,
  concepts,
  enrollments,
  courseConcepts,
  weaknesses = [],
  enableZoom = true,
  enablePan = true
}) {
  const [hover, setHover] = useState(null); // { type, id, label, x, y }
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: fixedWidth || 520, h: fixedHeight || 280 });

  // Observe container size for responsiveness if width/height not forced
  useLayoutEffect(() => {
    if (fixedWidth && fixedHeight) return; // respect fixed size
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setSize({ w: cr.width, h: cr.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixedWidth, fixedHeight]);

  const width = fixedWidth || size.w;
  const height = fixedHeight || size.h;
  const s = students.find((x) => x.id === studentId);
  const cEnroll = enrollments.filter((e) => e.student_id === studentId).map((e) => courses.find((c) => c.id === e.course_id));
  const cConcepts = courseConcepts.filter(
    (cc) => cEnroll.some((c) => c.id === cc.course_id) && conceptsToShow.includes(cc.concept_id)
  );

  const cx = width / 2;
  const cy = height / 2;
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
    const weakness = weaknesses.find((w) => w.student_id === studentId && w.concept_id === k.id);
    return {
      id: k.id,
      x: cx + 180 * Math.cos(i * conceptAngle + 0.5),
      y: cy + 180 * Math.sin(i * conceptAngle + 0.5),
      name: k.name,
      course_id: cc.course_id,
      mastery: weakness?.mastery
    };
  });

  const posById = (arr, id) => arr.find((n) => n.id === id);

  const relatedConceptIds = hover && hover.type === 'course' ? conceptPositions.filter(c => c.course_id === hover.id).map(c => c.id) :
    hover && hover.type === 'concept' ? [hover.id] : [];
  const relatedCourseIds = hover && hover.type === 'concept' ? [conceptPositions.find(c => c.id === hover.id)?.course_id].filter(Boolean) :
    hover && hover.type === 'course' ? [hover.id] : [];

  const handleWheel = useCallback((e) => {
    if (!enableZoom) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.min(2.5, Math.max(0.5, s + delta)));
  }, [enableZoom]);

  const handleMouseDown = (e) => {
    if (!enablePan) return;
    setPanning(true);
    panRef.current.startX = e.clientX;
    panRef.current.startY = e.clientY;
    panRef.current.x = offset.x;
    panRef.current.y = offset.y;
  };
  const handleMouseMove = (e) => {
    if (!panning) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    setOffset({ x: panRef.current.x + dx, y: panRef.current.y + dy });
  };
  const handleMouseUp = () => setPanning(false);

  return (
    <div ref={containerRef} className="w-full h-72 relative select-none" onWheel={handleWheel} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full bg-white rounded-2xl shadow-sm"
        role="img"
        aria-label="Student course and concept relationship graph"
        onMouseDown={handleMouseDown}
        style={{ cursor: panning ? 'grabbing' : enablePan ? 'grab' : 'default' }}
      >
        <g transform={`translate(${offset.x} ${offset.y}) scale(${scale})`}>
        {coursePositions.map((cp) => (
          <line
            key={`sc-${cp.id}`}
            x1={cx}
            y1={cy}
            x2={cp.x}
            y2={cp.y}
            stroke={relatedCourseIds.includes(cp.id) || !hover ? '#d1d5db' : 'rgba(209,213,219,0.35)'}
            strokeWidth={2}
          />
        ))}
        {conceptPositions.map((kp, i) => {
          const course = posById(coursePositions, kp.course_id);
            return (
              <line
                key={`cc-${kp.id}-${kp.course_id}`}
                x1={course.x}
                y1={course.y}
                x2={kp.x}
                y2={kp.y}
                stroke={relatedConceptIds.includes(kp.id) || relatedCourseIds.includes(kp.course_id) || !hover ? '#e5e7eb' : 'rgba(229,231,235,0.25)'}
                strokeWidth={2}
              />
            );
        })}
        <g
        onMouseEnter={() => setHover({ type: 'student', id: s.id, label: s.name, x: cx, y: cy })}
        onMouseLeave={() => setHover(null)}
      >
        <circle cx={cx} cy={cy} r={24} fill="#111827" className="transition-all duration-200" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fill="#fff">{s.name.split(" ")[0]}</text>
        </g>
        {coursePositions.map((cp) => (
          <g
            key={cp.id}
            onMouseEnter={() => setHover({ type: 'course', id: cp.id, label: cp.title, x: cp.x, y: cp.y })}
            onMouseLeave={() => setHover(null)}
            cursor="pointer"
            opacity={hover && !relatedCourseIds.includes(cp.id) ? 0.35 : 1}
            className="transition-opacity duration-150"
          >
            <circle cx={cp.x} cy={cp.y} r={18} fill="#2563eb" />
            <text x={cp.x} y={cp.y + 4} textAnchor="middle" fontSize="10" fill="#fff">{cp.id}</text>
          </g>
        ))}
        {conceptPositions.map((kp) => (
          <g
            key={kp.id}
            onMouseEnter={() => setHover({ type: 'concept', id: kp.id, label: kp.name + (kp.mastery != null ? ` (mastery ${(1 + kp.mastery * 9).toFixed(1)}/10)` : ''), x: kp.x, y: kp.y })}
            onMouseLeave={() => setHover(null)}
            cursor="pointer"
            opacity={hover && !relatedConceptIds.includes(kp.id) && !relatedCourseIds.includes(kp.course_id) ? 0.25 : 1}
            className="transition-opacity duration-150"
          >
            <circle cx={kp.x} cy={kp.y} r={14} fill={masteryColor(kp.mastery)} />
            <text x={kp.x} y={kp.y + 4} textAnchor="middle" fontSize="9" fill="#fff">{kp.name.split(" ")[0]}</text>
          </g>
        ))}

        {hover && (
          <foreignObject x={hover.x - 70} y={hover.y - 50} width={140} height={48} pointerEvents="none">
            <div className="pointer-events-none rounded-md bg-gray-900/90 text-white text-[11px] px-2 py-1 shadow-lg backdrop-blur-sm animate-fade-in">
              {hover.label}
            </div>
          </foreignObject>
        )}
        </g>
      </svg>
      <div className="absolute top-2 right-2 flex gap-2 text-[10px] bg-white/80 backdrop-blur px-2 py-1 rounded-md border border-gray-200">
        <span>Zoom: {scale.toFixed(2)}x</span>
        {hover && <span>{hover.type}: {hover.id}</span>}
      </div>
    </div>
  );
}
