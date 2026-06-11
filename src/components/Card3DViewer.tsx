'use client'

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Center, useGLTF, Html } from '@react-three/drei'
import { Card } from '@/lib/api'

interface Card3DViewerProps {
  card: Card
  modelPath?: string
  className?: string
}

function Model({ url, cardName }: { url: string; cardName: string }) {
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
          <p className="font-bold">Erro ao carregar modelo 3D</p>
          <p className="text-sm">Modelo não encontrado: {cardName}</p>
          <p className="text-xs text-gray-400 mt-2">Adicione o arquivo em /public/models/cards/{cardName}.glb</p>
        </div>
      </Html>
    )
  }

  if (!scene) {
    return (
      <Html center>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Carregando modelo...</p>
        </div>
      </Html>
    )
  }

  return (
    <primitive 
      object={scene} 
      scale={[2, 2, 2]}
      rotation={[0, Math.PI / 6, 0]}
    />
  )
}

export default function Card3DViewer({ card, modelPath, className = "" }: Card3DViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  
  // Default path if not provided
  const defaultModelPath = `/models/cards/${card.id}.glb`
  const finalModelPath = modelPath || defaultModelPath

  return (
    <div className={`w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <Suspense 
          fallback={
            <Html center>
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Carregando modelo 3D...</p>
              </div>
            </Html>
          }
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          
          <Center>
            <Model url={finalModelPath} cardName={card.name} />
          </Center>
          
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
            autoRotate={false}
            autoRotateSpeed={2}
          />
          
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
      
      {/* Card Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <h3 className="text-white font-bold text-lg">{card.name}</h3>
        <p className="text-gray-300 text-sm">{card.faction} • {card.type}</p>
      </div>
    </div>
  )
}
