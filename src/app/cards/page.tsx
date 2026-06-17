'use client'

import { useRouter } from 'next/navigation'

const CARD_TYPES = [
  {
    id: 'faction-pride',
    title: 'Faction Pride',
    description: 'Cartas de orgulho de facção que concedem bônus baseados na afiliação.',
    icon: '🏴',
    color: 'from-blue-600 to-blue-700',
    border: 'border-blue-200',
    hover: 'hover:border-blue-400 hover:shadow-blue-100',
    route: '/cards/faction-pride',
  },
  {
    id: 'mercenary-contract',
    title: 'Mercenary Contract',
    description: 'Contratos mercenários que permitem recrutar unidades de outras facções.',
    icon: '📜',
    color: 'from-amber-600 to-amber-700',
    border: 'border-amber-200',
    hover: 'hover:border-amber-400 hover:shadow-amber-100',
    route: '/cards/mercenary-contract',
  },
];

export default function CardsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              🃏 Cartas
            </h1>
            <p className="text-gray-300 text-sm mt-1">Selecione o tipo de carta que deseja visualizar</p>
          </div>
          <button
            onClick={() => router.push('/search')}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            🔍 Buscar Unidades
          </button>
        </div>
      </div>

      {/* Card Type Grid */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CARD_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => router.push(type.route)}
              className={`group bg-white rounded-xl border-2 ${type.border} ${type.hover} shadow-sm hover:shadow-lg transition-all duration-200 p-6 text-left`}
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${type.color} text-3xl mb-4 shadow`}>
                {type.icon}
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-700">
                {type.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {type.description}
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
                Ver cartas <span className="ml-1">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
