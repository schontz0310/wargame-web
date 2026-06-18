'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Center, useGLTF, Html } from '@react-three/drei'
import { Unit } from '@/lib/api'

interface Unit3DViewerProps {
  unit: Unit
  modelPath?: string
  className?: string
}

function Model({ url, unitId }: { url: string; unitId: string }) {
  let scene;
  let error;
  
  try {
    const gltf = useGLTF(url)
    scene = gltf.scene
  } catch (err) {
    error = err
  }
  
  if (error) {
    return (
      <Html center>
        <div className="text-red-500 text-center p-4">
          <p className="font-bold text-sm">Modelo 3D não encontrado</p>
          <p className="text-xs text-gray-400 mt-1">Adicione {unitId}.glb</p>
        </div>
      </Html>
    )
  }

  if (!scene) {
    return (
      <Html center>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-1"></div>
          <p className="text-xs">Carregando...</p>
        </div>
      </Html>
    )
  }

  return (
    <primitive 
      object={scene} 
      scale={[1.5, 1.5, 1.5]}
      rotation={[0, Math.PI / 4, 0]}
    />
  )
}

export default function Unit3DViewer({ unit, modelPath, className = "" }: Unit3DViewerProps) {
  // Default path if not provided - use expansion + collectionNumber format like VG049
  const unitCode = `${unit.expansion}${String(unit.collectionNumber).padStart(3, '0')}`;
  const defaultModelPath = `/models/units/${unitCode}.glb`
  const finalModelPath = modelPath || defaultModelPath

  return (
    <div className={`w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [0, 2, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <Suspense 
          fallback={
            <Html center>
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-1"></div>
                <p className="text-xs">Carregando modelo 3D...</p>
              </div>
            </Html>
          }
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          <pointLight position={[0, 5, 0]} intensity={0.5} />
          
          <Center>
            <Model url={finalModelPath} unitId={unit.id} />
          </Center>
          
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={8}
            autoRotate={false}
            autoRotateSpeed={1}
            maxPolarAngle={Math.PI / 2}
          />
          
          <Environment preset="city" />
        </Suspense>
      </Canvas>
      
      {/* Unit Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
        <h3 className="text-white font-bold text-sm truncate">{unit.name}</h3>
        <p className="text-gray-300 text-xs">{unit.faction} • {unit.type}</p>
      </div>
    </div>
  )
}
