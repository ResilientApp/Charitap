import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { useAuth0 } from '@auth0/auth0-react';

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

export default function Home() {
  const { isAuthenticated } = useAuth0();

  return (
    <div className="page-content fade-in text-white mt-12">
      {/* HERO */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="slide-in-left self-start">
          {/* Text group with consistent spacing */}
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold">Charitap</h1>
            <p className="text-xl text-justify">
              A micro-donation platform that lets users round up everyday purchases
              and automatically donate the spare change to a charity of your choice.
            </p>
            <p className="text-gray-200 italic text-justify">
              Round up purchases and turn spare change into charity.
            </p>
          </div>

          {/* Button pushed down by its own margin */}
          <div className="mt-12">
            <a
              href="https://example.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <img
                src="/chrome-icon.png"
                alt="Chrome"
                className="h-5 w-5"
              />
              <span>Add to Chrome</span>
            </a>
          </div>
        </div>

        {/* 3D Coin */}
        <div className="w-full h-80 rounded-xl overflow-hidden">
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

      {/* HOW IT WORKS */}
      <h2 className="text-3xl font-semibold mb-6 fade-in text-center">
        How It Works
      </h2>

      {/* step connectors */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center w-full max-w-5xl px-8">
          <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center text-[#626F47] font-bold shadow-lg">
            1
          </div>
          <div className="flex-1 border-t-2 border-dotted border-gray-300 mx-2"></div>
          <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center text-[#626F47] font-bold shadow-lg">
            2
          </div>
          <div className="flex-1 border-t-2 border-dotted border-gray-300 mx-2"></div>
          <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center text-[#626F47] font-bold shadow-lg">
            3
          </div>
        </div>
      </div>

      {/* cards */}
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
    </div>
  );
}
