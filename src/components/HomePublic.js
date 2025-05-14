import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';

function CoinModel() {
  const { scene } = useGLTF('/scene.gltf');
  return (
    <primitive
      object={scene}
      scale={1.0}
      position={[0, -0.2, 0]}
      rotation={[0, Math.PI, 0]}
    />
  );
}

export default function HomePublic() {
  return (
    <div className="page-content fade-in text-white">
      {/* HERO */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="slide-in-left">
          <h1 className="text-5xl font-extrabold mb-4">Charitap</h1>
          <p className="text-xl mb-6">
            A micro-donation platform that lets users round up everyday purchases
            and automatically donate the spare change to a charity of your choice.
          </p>
          <p className="text-gray-200 italic">
            Round up purchases and turn spare change into charity.
          </p>
        </div>
        <div className="w-full h-64 rounded-xl overflow-hidden">
          <Canvas
            gl={{ alpha: true }}
            style={{ background: 'transparent' }}
            camera={{ position: [5, 5, -10] }}
          >
            <ambientLight intensity={10} />
            <pointLight position={[5, 5, 5]} intensity={120} />
            <hemisphereLight skyColor="white" groundColor="gray" intensity={60} />
            <Suspense fallback={null}>
              <CoinModel />
            </Suspense>
            <OrbitControls autoRotate autoRotateSpeed={1} enableZoom={false} />
          </Canvas>
        </div>
      </section>

      <hr className="border-gray-500 mb-12" />

      {/* How It Works */}
      <h2 className="text-3xl font-semibold mb-8 fade-in text-center">
        How It Works
      </h2>

      {/* Three lift + zoom cards */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            ['Shop Normally', '/img/shop.png'],
            ['Automatic Round-Up', '/img/roundup.png'],
            ['Donate to Charity', '/img/donate.png'],
          ].map(([title, src], i) => (
            <div
              key={title}
              className="bg-card p-6 rounded-xl transform transition hover:-translate-y-2 hover:scale-105"
              style={{ transitionDuration: '300ms', animationDelay: `${i * 0.2}s` }}
            >
              <div className="w-full rounded-lg mb-4 overflow-hidden">
                <img src={src} alt={title} className="w-full object-contain tile-img" />
              </div>
              <h3 className="text-xl font-semibold text-center">{title}</h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
