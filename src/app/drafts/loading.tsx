'use client'

import { useT } from '@/hooks/useT'

export default function Loading() {
  const t = useT()
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">{t('common.loading')}</div>
    </div>
  );
}
