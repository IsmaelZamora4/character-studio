export type Mode = 'react' | 'three' | 'remotion';
export const samples: Record<Mode,string> = {
  react: `import React from 'react';

export default function App() {
  return <main className="stage" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',background:'linear-gradient(160deg,#151b2d,#252145)',color:'white',textAlign:'center'}}>
    <svg viewBox="0 0 400 500" width="320" role="img" aria-label="Personaje cartoon">
      <ellipse cx="200" cy="460" rx="110" ry="15" fill="#263248" opacity=".2" />
      <rect x="137" y="265" width="126" height="150" rx="42" fill="#7557F7" />
      <rect x="149" y="399" width="37" height="52" rx="15" fill="#4932A1" />
      <rect x="215" y="399" width="37" height="52" rx="15" fill="#4932A1" />
      <circle cx="200" cy="195" r="100" fill="#FFD18C" />
      <ellipse cx="163" cy="196" rx="10" ry="17" fill="#28233A" />
      <ellipse cx="237" cy="196" rx="10" ry="17" fill="#28233A" />
      <path d="M175 243 Q200 268 225 243" fill="none" stroke="#6A3F38" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 145 Q200 45 290 145" fill="none" stroke="#5A3D31" strokeWidth="34" strokeLinecap="round" />
    </svg>
    <h2>Mi primer personaje</h2>
    <p>Edita el código y mira cómo cambia.</p>
  </main>;
}`,
  three: `import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function Personaje() {
  const group = useRef<any>(null);
  useFrame((state) => {
    if (group.current) group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.3;
  });
  return <group ref={group}>
    <mesh position={[0, 0.85, 0]} castShadow>
      <capsuleGeometry args={[0.65, 0.65, 8, 24]} />
      <meshStandardMaterial color="#7557F7" roughness={0.7} />
    </mesh>
    <mesh position={[0, 2.05, 0]} castShadow>
      <sphereGeometry args={[0.82, 40, 28]} />
      <meshStandardMaterial color="#FFD18C" roughness={0.8} />
    </mesh>
    {[-0.3,0.3].map((x) => <mesh key={x} position={[x,2.1,0.72]}>
      <sphereGeometry args={[0.085, 16, 16]} />
      <meshStandardMaterial color="#30273C" />
    </mesh>)}
    {[-0.38,0.38].map((x) => <mesh key={x} position={[x,0.0,0]}>
      <capsuleGeometry args={[0.15, 0.45, 6, 16]} />
      <meshStandardMaterial color="#423278" />
    </mesh>)}
  </group>;
}

export default function App() {
  return <div style={{width:'100%',height:'100vh',background:'#141a2c'}}>
    <Canvas shadows camera={{position:[3,2.5,5],fov:45}}>
      <ambientLight intensity={1.2}/>
      <directionalLight position={[4,7,6]} intensity={2} castShadow/>
      <Personaje />
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.55,0]} receiveShadow>
        <planeGeometry args={[200,200]}/>
        <meshStandardMaterial color="#222b46"/>
      </mesh>
      <OrbitControls makeDefault target={[0,1,0]} enableDamping dampingFactor={0.08} enableZoom enablePan rotateSpeed={0.8}/>
    </Canvas>
  </div>;
}`,
  remotion: `import React from 'react';
import { Player } from '@remotion/player';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

function Animacion() {
  const frame = useCurrentFrame();
  const bounce = Math.sin(frame / 8) * 22;
  const rotation = interpolate(frame,[0,150],[-10,350]);
  return <AbsoluteFill style={{background:'linear-gradient(160deg,#17152d,#35295a)',display:'flex',justifyContent:'center',alignItems:'center'}}>
    <div style={{transform:\`translateY(\${bounce}px) rotate(\${rotation}deg)\`,fontSize:130}}>🚀</div>
    <div style={{position:'absolute',bottom:75,color:'white',fontSize:34,fontFamily:'sans-serif',fontWeight:800}}>Mi animación</div>
  </AbsoluteFill>;
}

export default function App() {
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#101526',padding:16}}>
    <Player component={Animacion} compositionWidth={540} compositionHeight={960}
      durationInFrames={150} fps={30} controls loop autoPlay
      style={{width:'min(100%,320px)',aspectRatio:'9 / 16'}} />
  </main>;
}`
};
export const deps: Record<Mode,Record<string,string>> = {
  react: {},
  three: {three:'0.185.1','@react-three/fiber':'9.1.2','@react-three/drei':'10.0.7'},
  remotion: {remotion:'4.0.542','@remotion/player':'4.0.542'}
};
