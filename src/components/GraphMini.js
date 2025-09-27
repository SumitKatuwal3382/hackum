import React, { useState, useRef, useLayoutEffect, useCallback, useEffect } from "react";

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
  const [rotating, setRotating] = useState(false);
  const panRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const rotateRef = useRef({ startX: 0, startRotation: 0 });
  const rotateVelocityRef = useRef(0);
  const inertiaRef = useRef(null);
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: fixedWidth || 520, h: fixedHeight || 280 });
  const [rotation, setRotation] = useState(0); // global rotation (radians)
  const [time, setTime] = useState(0); // 4th dimension time value
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    let last = performance.now();
    const loop = (t) => {
      const dt = (t - last) / 1000;
      last = t;
      setTime((v) => (v + dt * 8) % 100);
      setRotation((r) => r + dt * 0.2);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  }, [playing]);

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
  // compute positions with rotation and time-based orbit for a 3D-ish, planety look
  const coursePositions = cEnroll.map((c, i) => {
    const baseAngle = i * courseAngle;
    const a = baseAngle + rotation + time * 0.2; // rotate + time offset
    const z = 0.5 + 0.5 * Math.sin(a + i); // depth [0,1]
    const radius = 100 + 40 * z; // closer courses sit slightly further out
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a) * (0.75 + 0.25 * z); // slight ellipse for perspective
    return { id: c.id, x, y, z, title: c.title, baseAngle };
  });

  // deduplicate concepts (courseConcepts may include repeats across courses)
  const seenConcepts = new Set();
  const conceptPositions = [];
  for (let i = 0; i < cConcepts.length; i++) {
    const cc = cConcepts[i];
    const k = concepts.find((x) => x.id === cc.concept_id);
    if (!k) continue;
    if (seenConcepts.has(k.id)) continue; // skip duplicates
    seenConcepts.add(k.id);
    const weakness = weaknesses.find((w) => w.student_id === studentId && w.concept_id === k.id);
    const baseAngle = (conceptPositions.length) * conceptAngle + 0.5; // place based on unique index
    const a = baseAngle + rotation * 0.6 - time * 0.15;
    const z = 0.4 + 0.6 * Math.cos(a + i * 0.7);
    const radius = 150 + 60 * z;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a) * (0.7 + 0.3 * z);
    conceptPositions.push({
      id: k.id,
      x,
      y,
      z,
      name: k.name,
      course_id: cc.course_id,
      mastery: weakness?.mastery,
      baseAngle,
    });
  }

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

  const handleMouseDown = (e, opts = {}) => {
    // Decide rotate vs pan. Left button -> rotate, Right button (or Shift+left) -> pan
    const isRight = e.button === 2 || e.shiftKey || opts.forcePan;
    if (isRight) {
      if (!enablePan) return;
      setPanning(true);
      panRef.current.startX = e.clientX;
      panRef.current.startY = e.clientY;
      panRef.current.x = offset.x;
      panRef.current.y = offset.y;
    } else {
      // left button -> rotate
      // stop any running inertia when user starts interacting
      if (inertiaRef.current) {
        cancelAnimationFrame(inertiaRef.current);
        inertiaRef.current = null;
        rotateVelocityRef.current = 0;
      }
      setRotating(true);
      rotateRef.current.startX = e.clientX;
      rotateRef.current.lastX = e.clientX;
      rotateRef.current.lastT = performance.now();
      rotateRef.current.startRotation = rotation;
    }
  };
  const handleMouseMove = (e) => {
    if (panning) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setOffset({ x: panRef.current.x + dx, y: panRef.current.y + dy });
      return;
    }
    if (rotating) {
      const now = performance.now();
      const dx = e.clientX - (rotateRef.current.lastX ?? rotateRef.current.startX);
      const dt = Math.max(1, now - (rotateRef.current.lastT || now)) / 1000; // seconds
      // update rotation with sensitivity
      setRotation((r) => r + dx * 0.01);
      // velocity px/sec scaled to rotation/sec
      rotateVelocityRef.current = (dx / dt) * 0.01;
      rotateRef.current.lastX = e.clientX;
      rotateRef.current.lastT = now;
      return;
    }
  };
  const handleMouseUp = () => {
    setPanning(false);
    // start inertia if we have velocity from rotating
    if (rotating && Math.abs(rotateVelocityRef.current) > 0.02) {
      const start = performance.now();
      let last = start;
      const step = (t) => {
        const dt = (t - last) / 1000;
        last = t;
        // apply velocity to rotation
        setRotation((r) => r + rotateVelocityRef.current * dt);
        // apply exponential decay (friction)
        const decay = Math.exp(-3 * dt); // tuned decay
        rotateVelocityRef.current *= decay;
        if (Math.abs(rotateVelocityRef.current) < 0.0005) {
          rotateVelocityRef.current = 0;
          inertiaRef.current = null;
          return;
        }
        inertiaRef.current = requestAnimationFrame(step);
      };
      inertiaRef.current = requestAnimationFrame(step);
    }
    setRotating(false);
  };

  // Touch handlers (map to mouse behavior)
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    handleMouseDown({ clientX: t.clientX, clientY: t.clientY, button: 0 }, { forcePan: false });
  };
  const handleTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    handleMouseMove({ clientX: t.clientX, clientY: t.clientY });
    e.preventDefault();
  };
  const handleTouchEnd = (e) => { handleMouseUp(); };

  return (
  <div ref={containerRef} className="w-full h-72 relative select-none" onWheel={handleWheel} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onContextMenu={(e)=>e.preventDefault()} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full bg-white rounded-2xl shadow-sm"
        role="img"
        aria-label="Student course and concept relationship graph"
        onMouseDown={handleMouseDown}
        style={{ cursor: panning ? 'grabbing' : enablePan ? 'grab' : 'default' }}
      >
        <defs>
          {/* radial gradients for planets (course vs concept) */}
          <radialGradient id="grad-student" cx="30%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#111827" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="grad-course" cx="30%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#bbdefb" />
            <stop offset="70%" stopColor="#1565c0" />
          </radialGradient>
          <radialGradient id="grad-concept" cx="30%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="70%" stopColor="#059669" />
          </radialGradient>
        </defs>
        <g transform={`translate(${offset.x} ${offset.y}) scale(${scale})`}>
        {/* draw links (behind planets) */}
        {coursePositions.map((cp) => (
          <line
            key={`sc-${cp.id}`}
            x1={cx}
            y1={cy}
            x2={cp.x}
            y2={cp.y}
            stroke={relatedCourseIds.includes(cp.id) || !hover ? '#e9e5df' : 'rgba(233,229,223,0.35)'}
            strokeWidth={2}
          />
        ))}
        {conceptPositions.map((kp) => {
          const course = posById(coursePositions, kp.course_id) || { x: cx, y: cy };
          return (
            <line
              key={`cc-${kp.id}-${kp.course_id}`}
              x1={course.x}
              y1={course.y}
              x2={kp.x}
              y2={kp.y}
              stroke={relatedConceptIds.includes(kp.id) || relatedCourseIds.includes(kp.course_id) || !hover ? '#f1efe9' : 'rgba(241,239,233,0.25)'}
              strokeWidth={1.5}
            />
          );
        })}

        {/* create combined list with z for painter's algorithm (draw back to front) */}
        {[
          { type: 'student', id: s.id, x: cx, y: cy, z: 1.0, label: s.name },
          ...coursePositions.map((c) => ({ type: 'course', ...c })),
          ...conceptPositions.map((c) => ({ type: 'concept', ...c })),
        ]
          .sort((a, b) => (a.z || 0) - (b.z || 0))
          .map((node) => {
            // size and visual based on type and mastery
            let r = 14;
            let grad = 'grad-concept';
            if (node.type === 'student') { r = 28; grad = 'grad-student'; }
            else if (node.type === 'course') { r = 18; grad = 'grad-course'; }
            else if (node.type === 'concept') {
              r = 10 + Math.round((node.mastery != null ? (1 - node.mastery) : 0.5) * 10);
              grad = 'grad-concept';
            }
            const scaledR = r * (0.9 + 0.6 * (node.z || 0));
            const cxn = node.x;
            const cyn = node.y - (1 - (node.z || 0)) * 8; // slight vertical parallax
            const label = node.title || node.name || node.label;
            const nid = `${node.type}-${node.id}`;
            const isDimmed = hover && !((node.type === 'course' && relatedCourseIds.includes(node.id)) || (node.type === 'concept' && relatedConceptIds.includes(node.id)) || node.type === 'student');
            return (
              <g
                key={nid}
                transform={`translate(${cxn} ${cyn})`}
                opacity={isDimmed ? 0.28 : 1}
                cursor="pointer"
                onMouseEnter={() => {
                  const labelText = node.type === 'concept' && node.mastery != null ? `${label} (mastery ${(1 + node.mastery * 9).toFixed(1)}/10)` : label;
                  setHover({ type: node.type, id: node.id, label: labelText, x: cxn, y: cyn });
                }}
                onMouseLeave={() => setHover(null)}
              >
                {/* optional ring for courses */}
                {node.type === 'course' && (
                  <ellipse rx={scaledR * 1.8} ry={scaledR * 0.9} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={2} transform={`rotate(${(rotation * 180) / Math.PI})`} />
                )}
                {/* planet body */}
                <circle r={scaledR} fill={`url(#${grad})`} stroke="rgba(0,0,0,0.12)" strokeWidth={1.5} />
                {/* highlight */}
                <circle r={scaledR * 0.35} cx={-scaledR * 0.4} cy={-scaledR * 0.5} fill="rgba(255,255,255,0.65)" />
                {/* label: only show for student/course or if large or hovered */}
                { (node.type !== 'concept' || scaledR > 14 || (hover && hover.id === node.id && hover.type === node.type)) && (
                  <text x={0} y={scaledR + 12} textAnchor="middle" fontSize="10" fill="#111827">{(label || '').split(" ")[0]}</text>
                ) }
              </g>
            );
          })}

        {hover && (
          <foreignObject x={hover.x - 70} y={hover.y - 50} width={160} height={56} pointerEvents="none">
            <div className="pointer-events-none rounded-md bg-gray-900/90 text-white text-[11px] px-2 py-1 shadow-lg backdrop-blur-sm">
              {hover.label}
            </div>
          </foreignObject>
        )}
        </g>
      </svg>
      
    </div>
  );
}
