import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';

// generate simple procedural texture on a canvas for planet surface
function makePlanetTexture(color1, color2) {
  const size = 512;
  const cvs = document.createElement('canvas');
  cvs.width = size; cvs.height = size;
  const ctx = cvs.getContext('2d');
  // base
  ctx.fillStyle = color1; ctx.fillRect(0,0,size,size);
  // noise
  for (let i=0;i<20000;i++){
    const x = Math.random()*size;
    const y = Math.random()*size;
    const a = Math.random()*0.6;
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.fillRect(x,y,1,1);
  }
  // swirls
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = color2;
  for (let i=0;i<200;i++){
    ctx.beginPath();
    ctx.arc(Math.random()*size, Math.random()*size, Math.random()*60, 0, Math.PI*2);
    ctx.fill();
  }
  // return the canvas element (we'll wrap it in a THREE.CanvasTexture)
  return cvs;
}

function Planet({ orbitRadius=2.8, angle=0, speed=0.2, size=1, color1='#89CFF0', color2='#2b6fb3', name, onHover }){
  const ref = useRef();
  const [texCanvas, setTexCanvas] = useState(null);
  const theta = useRef(angle);

  useEffect(()=>{
    const cvs = makePlanetTexture(color1, color2);
    setTexCanvas(cvs);
    return () => setTexCanvas(null);
  },[color1,color2]);

  const map = useMemo(() => {
    if (!texCanvas) return null;
    const t = new THREE.CanvasTexture(texCanvas);
    t.needsUpdate = true;
    return t;
  }, [texCanvas]);

  useEffect(() => {
    return () => {
      if (map) map.dispose();
    };
  }, [map]);

  // animate orbit and spin
  useFrame((state, dt)=>{
    theta.current += speed * dt * 0.2;
    const x = Math.cos(theta.current) * orbitRadius;
    const z = Math.sin(theta.current) * orbitRadius;
    if (ref.current) {
      ref.current.position.x = x;
      ref.current.position.z = z;
      ref.current.rotation.y += 0.05*dt; // spin
    }
  });

  return (
    <group ref={ref} position={[Math.cos(theta.current)*orbitRadius, 0, Math.sin(theta.current)*orbitRadius]}>
      <mesh onPointerOver={(e)=>{ e.stopPropagation(); onHover && onHover(name, true); }} onPointerOut={(e)=>{ e.stopPropagation(); onHover && onHover(null, false); }}>
        <sphereGeometry args={[size, 48, 48]} />
        <meshStandardMaterial map={map} metalness={0.08} roughness={0.55} envMapIntensity={0.6} />
      </mesh>
      {/* subtle ring */}
      <mesh rotation={[Math.PI/2,0,0]} position={[0,0,0]}>
        <ringGeometry args={[size*1.25, size*1.5, 64]} />
        <meshBasicMaterial color={'#9ed7ff'} opacity={0.06} transparent />
      </mesh>
      <Html distanceFactor={6} position={[0,-size*0.9,0]}>
        <div style={{fontSize:12, color:'#cfe7ff', fontWeight:700, textAlign:'center', textShadow: '0 2px 8px rgba(2,8,18,0.6)'}}>{name}</div>
      </Html>
    </group>
  );
}

function Stars({ count = 400 }){
  const points = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 15 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const x = Math.cos(theta) * Math.cos(phi) * r;
      const y = Math.sin(phi) * r;
      const z = Math.sin(theta) * Math.cos(phi) * r;
      positions[i*3] = x;
      positions[i*3+1] = y;
      positions[i*3+2] = z;
    }
    return positions;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={points} itemSize={3} count={points.length/3} />
      </bufferGeometry>
      <pointsMaterial size={0.12} color={'#cfe7ff'} sizeAttenuation depthWrite={false} opacity={0.9} transparent />
    </points>
  );
}

function Scene({data, onHover}){
  // orbit distances increment per planet
  const base = 2.6;
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight intensity={1.6} position={[0,2,4]} />
      <pointLight intensity={0.3} position={[-4,-2,-3]} />

      {/* Stars background */}
      <Stars count={600} />

      {/* Sun (student) with glow */}
      <mesh position={[0,0,0]}>
        <sphereGeometry args={[1.05, 64, 64]} />
        <meshStandardMaterial emissive={'#0b8ee6'} emissiveIntensity={0.9} color={'#05202b'} metalness={0.1} roughness={0.3} />
      </mesh>
      {/* subtle sun corona as transparent sphere */}
      <mesh>
        <sphereGeometry args={[1.6, 64, 64]} />
        <meshBasicMaterial color={'#9ed7ff'} transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {data.map((d,i)=>{
        const orbitRadius = base + i * 0.9 + (i%2)*0.3;
        const angle = (i/data.length) * Math.PI*2;
        const speed = 0.2 + (i%3)*0.08;
        const size = 0.35 + Math.log(1+d.conceptCount)*0.12;
        return (
          <Planet key={d.course_id} orbitRadius={orbitRadius} angle={angle} speed={speed} size={size} name={d.title} color1={'#2b6fb3'} color2={'#3b82f6'} onHover={onHover} />
        );
      })}
    </>
  );
}

export default function CoursePlanets3D({ studentId, enrollments, courses, courseConcepts = [], weaknesses = [], height = 320 }){
  const data = useMemo(()=>{
    const myEnrolls = (enrollments||[]).filter(e => e.student_id === studentId);
    const courseConceptCount = (courseConcepts||[]).reduce((acc, cc) => { acc[cc.course_id] = (acc[cc.course_id]||0)+1; return acc; }, {});
    return myEnrolls.map(e => {
      const course = courses.find(c => c.id === e.course_id);
      const conceptCount = courseConceptCount[e.course_id] || 1;
      const conceptIds = (courseConcepts||[]).filter(cc => cc.course_id === e.course_id).map(cc=>cc.concept_id);
      const masteryList = (weaknesses||[]).filter(w => w.student_id === studentId && conceptIds.includes(w.concept_id)).map(w=>w.mastery);
      const avgMastery = masteryList.length ? masteryList.reduce((a,b)=>a+b,0)/masteryList.length : null;
      return { course_id: e.course_id, title: course?.title || e.course_id, grade: e.grade_num, conceptCount, avgMastery };
    });
  },[studentId,enrollments,courses,courseConcepts,weaknesses]);

  const [hover, setHover] = useState(null);

  return (
    <div style={{width:'100%', height: height, position:'relative'}} className="vignette rounded-xl overflow-hidden">
      <Canvas style={{height: '100%'}} camera={{ position: [0, 2.2, 7], fov: 45 }}>
        {/* deep space backdrop color */}
        <color attach="background" args={[0.01,0.02,0.03]} />
        <OrbitControls enablePan={true} enableRotate={true} enableZoom={true} />
        <ambientLight intensity={0.35} />
        {/* rim and key lights for better contrast on dark bg */}
        <directionalLight intensity={0.9} position={[5, 6, 2]} color={'#cfefff'} />
        <pointLight intensity={0.7} position={[-3, -2, -4]} color={'#2b6fb3'} />
        <Scene data={data} onHover={(name,over)=> setHover(over?name:null)} />
      </Canvas>
      {hover && (
        <div style={{position:'absolute', left:20, bottom:20, background:'linear-gradient(180deg, rgba(6,12,20,0.9), rgba(4,8,14,0.9))', color:'#e6f6ff', padding:'10px 12px', borderRadius:8, border: '1px solid rgba(78,174,255,0.08)'}}>
          {hover}
        </div>
      )}
    </div>
  );
}
