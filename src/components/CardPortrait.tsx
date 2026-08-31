'use client'

import { useState, useEffect } from 'react'

interface CardPortraitProps {
  imageUrl?: string | null
  name: string
  size?: 'sm' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<CardPortraitProps['size']>, string> = {
  sm: 'w-10 h-10 text-xs rounded',
  lg: 'w-20 h-20 text-lg corner-clip-sm',
};

export default function CardPortrait({ imageUrl, name, size = 'sm' }: CardPortraitProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => { setFailed(false); }, [imageUrl]);

  const showImage = !!imageUrl && !failed;

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 overflow-hidden ${SIZE_CLASSES[size]}`}
      style={{ background: '#111608', border: '1px solid #3a4a2a' }}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={`${name} - Imagem`}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-mono" style={{ color: '#3a5a2a' }}>—</span>
      )}
    </div>
  )
}
