'use client'

import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Center, useGLTF, Html, useTexture } from '@react-three/drei'
import { Unit } from '@/lib/api'
import * as THREE from 'three'

interface Unit3DModalProps {
  unit: Unit
  isOpen: boolean
  onClose: () => void
  modelPath?: string
}

function Model({ url, unitId }: { url: string; unitId: string }) {
  let scene;
  let error;
  
  try {
    const gltf = useGLTF(url)
    scene = gltf.scene
    
    // Apply custom materials/textures if available
    scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        // Check if there's a custom texture for this unit
        const texturePath = `/models/units/textures/${unitId}_color.png`
        try {
          const texture = useTexture(texturePath)
          if (child.material) {
            const material = child.material as THREE.MeshStandardMaterial
            material.map = texture
            material.needsUpdate = true
          }
        } catch (e) {
          // No custom texture found, use default
          console.log(`No custom texture found for ${unitId}`)
        }
        
        // Enhance material properties
        if (child.material) {
          const material = child.material as THREE.MeshStandardMaterial
          material.metalness = 0.3
          material.roughness = 0.7
          material.envMapIntensity = 1.0
          material.needsUpdate = true
        }
      }
    })
  } catch (err) {
    error = err
  }
  
  if (error) {
    return (
      <Html center>
        <div className="text-red-500 text-center p-6 bg-black/80 rounded-lg">
          <p className="font-bold text-lg mb-2">Modelo 3D não encontrado</p>
          <p className="text-sm text-gray-300">Adicione {unitId}.glb</p>
          <p className="text-xs text-gray-400 mt-2">em /public/models/units/</p>
        </div>
      </Html>
    )
  }

  if (!scene) {
    return (
      <Html center>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Carregando modelo 3D...</p>
        </div>
      </Html>
    )
  }

  return (
    <primitive 
      object={scene} 
      scale={[0.3, 0.3, 0.3]}
      rotation={[0, Math.PI / 4, 0]}
    />
  )
}

export default function Unit3DModal({ unit, isOpen, onClose, modelPath }: Unit3DModalProps) {
  // Add ESC key support
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset'; // Restore scroll
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Generate unit code from expansion + collectionNumber
  const unitCode = `${unit.expansion}${String(unit.collectionNumber).padStart(3, '0')}`;
  const defaultModelPath = `/models/units/${unitCode}.glb`
  const finalModelPath = modelPath || defaultModelPath;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
      {/* Backdrop click area */}
      <div 
        className="absolute inset-0 z-0" 
        onClick={onClose}
        aria-label="Fechar clicando no fundo"
      />
      
      {/* Modal content - 80% screen size */}
      <div 
        className="relative z-10 w-[80vw] h-[80vh] bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevent close on content click
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
          aria-label="Fechar visualização 3D"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Unit info header */}
        <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-sm p-3 rounded-lg">
          <h2 className="text-white font-bold text-lg">{unit.name}</h2>
          <p className="text-gray-300 text-sm">{unit.faction} • {unit.type}</p>
          <p className="text-gray-400 text-xs">{unitCode} • {unit.points} pts</p>
        </div>

        {/* Controls info */}
        <div className="absolute bottom-4 left-4 z-20 bg-black/60 backdrop-blur-sm p-2 rounded-lg">
          <p className="text-gray-300 text-xs">
            <span className="font-semibold">Controles:</span><br/>
            🖱️ Arrastar para rotacionar | 🔍 Scroll para zoom
          </p>
        </div>

        {/* 3D Viewer Canvas */}
        <div className="w-full h-full">
          <Canvas
            camera={{ position: [0, 5, 15], fov: 40 }}
            gl={{ antialias: true, alpha: true }}
            className="w-full h-full"
          >
          <Suspense 
            fallback={
              <Html center>
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg">Carregando modelo 3D...</p>
                </div>
              </Html>
            }
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} />
            <directionalLight position={[-10, -10, -5]} intensity={0.4} />
            <pointLight position={[0, 5, 0]} intensity={0.6} />
            <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.8} />
            
            <Center>
              <Model url={finalModelPath} unitId={unitCode} />
            </Center>
            
            <OrbitControls 
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              minDistance={0.5}
              maxDistance={50}
              autoRotate={false}
              autoRotateSpeed={0.5}
              maxPolarAngle={Math.PI / 2.1}
              minPolarAngle={Math.PI / 8}
              enableDamping={true}
              dampingFactor={0.1}
              zoomSpeed={1.5}
              rotateSpeed={0.8}
            />
            
            <Environment preset="city" />
          </Suspense>
        </Canvas>
        </div>
      </div>
    </div>
  )
}
