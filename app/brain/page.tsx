'use client'

import dynamic from 'next/dynamic'

// Dynamically import the component with SSR disabled
const NeuralNetwork = dynamic(
  () => import('@/components/brain/NeuralNetwork'),
  { ssr: false }
)

export default function BrainPage() {
  return (
    <div className="relative h-[calc(100vh-100px)] w-full">
      {/* HUD Label */}
      <div className="absolute top-4 left-4 z-10">
        <p className="text-xs text-subtle tracking-widest font-mono">
          NEURAL INDEX // ACTIVE
        </p>
      </div>
      
      {/* The 3D Graph */}
      <NeuralNetwork />
    </div>
  )
}
