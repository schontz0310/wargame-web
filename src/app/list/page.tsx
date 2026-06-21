'use client'

import { AppDial, HeatModifiersTable } from '@/components/app-dial';
import { InfantryDial } from '@/components/infantry-dial';
import { useSelectedUnit } from '@/hooks/useSelectedUnit';
import { useColorMeanings } from '@/hooks/useColorMeanings';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Unit3DModal from '@/components/Unit3DModal';

function ListContent() {
  const searchParams = useSearchParams();
  const unitId = searchParams.get('unitId');
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  
  const {
    selectedUnit,
    loading,
    error,
    heatClicks,
    damageClicks,
    handleHeat,
    handleCooldown,
    handleDamage,
    handleRepair,
  } = useSelectedUnit(unitId);
  const { colorMapping } = useColorMeanings();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{background:'#0d1208'}}>
        <div className="font-mono text-[#7a9a5a] tracking-widest animate-pulse">[ CARREGANDO DADOS DA UNIDADE... ]</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{background:'#0d1208'}}>
        <div className="font-mono text-red-500 border border-red-900 px-4 py-2">ERRO: {error}</div>
      </div>
    );
  }

  if (!selectedUnit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{background:'#0d1208'}}>
        <div className="font-mono text-[#c9a84c] text-lg tracking-widest">// NENHUMA UNIDADE SELECIONADA</div>
        <div className="font-mono text-xs text-[#4a5e3a] tracking-widest">Selecione uma unidade na página de busca</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden p-2 sm:p-4 lg:p-8 gap-2 sm:gap-4 lg:gap-8" style={{background:'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)'}}>
      {/* Left Column - Unit Card */}
      <div className="w-full lg:w-[55%] p-3 sm:p-4 space-y-3 overflow-y-auto max-h-screen lg:max-h-screen" style={{background:'#111608',border:'1px solid #3a4a2a',boxShadow:'inset 0 1px 0 rgba(180,150,60,0.1),0 4px 20px rgba(0,0,0,0.6)'}}>
        {/* Unit Header */}
        <div className="border-b pb-4" style={{borderColor:'#2a3a1a'}}>
          <div className="flex flex-col sm:flex-row gap-3 sm:h-44">
            <div className="w-full sm:w-32 md:w-40 lg:w-44 h-32 sm:h-full bg-transparent rounded-lg flex items-center justify-center flex-shrink-0 p-2 overflow-hidden">
              {/* 3D Viewer Button */}
              <button
                onClick={() => setIs3DModalOpen(true)}
                className="absolute top-2 right-2 z-10 px-2 py-1 text-xs font-mono font-medium transition-colors corner-clip-sm"
                style={{background:'rgba(122,154,90,0.2)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
                title="Ver modelo 3D"
              >
                🎮 3D
              </button>

              {selectedUnit.imageUrl ? (
                <img 
                  src={selectedUnit.imageUrl} 
                  alt={selectedUnit.name}
                  className="w-full h-full object-contain"
                  style={{filter:'contrast(1.1) saturate(0.9)'}}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<span class="font-mono text-xs text-[#4a5e3a] text-center">[IMG]</span>';
                    }
                  }}
                />
              ) : (
                <span className="font-mono text-xs text-[#4a5e3a] text-center">[IMG]</span>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-evenly sm:pl-6 mt-3 sm:mt-0">
              <div className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold leading-tight" style={{color:'#e8d5a0'}}>{selectedUnit.name}{selectedUnit.isUnique && ' ★'}</h2>
                <div className="text-xs sm:text-sm font-mono" style={{color:'#7a9a5a'}}>{selectedUnit.variant}</div>
                <div className="text-xs sm:text-sm font-mono" style={{color:'#4a5e3a'}}>#{selectedUnit.collectionNumber}</div>
                <div className="text-lg sm:text-xl font-bold font-mono inline-block px-3 sm:px-4 py-1 sm:py-2 corner-clip-sm" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}>{selectedUnit.points} pts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="p-2 sm:p-3" style={{background:'rgba(0,0,0,0.3)',border:'1px solid #2a3a1a'}}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            <div className="sm:border-0 border-b pb-2 sm:pb-0" style={{borderColor:'#2a3a1a'}}>
              <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>TIPO</div>
              <div className="font-bold font-mono text-xs capitalize" style={{color:'#c9a84c'}}>{selectedUnit.type}</div>
            </div>
            <div className="sm:border-l sm:pl-2 sm:border-0 border-b pb-2 sm:pb-0" style={{borderColor:'#2a3a1a'}}>
              <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>CLASSE</div>
              <div className="font-bold font-mono text-xs" style={{color:'#c9a84c'}}>{selectedUnit.class}</div>
            </div>
            <div className="sm:border-l sm:pl-2" style={{borderColor:'#2a3a1a'}}>
              <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>RANK</div>
              <div className="font-bold font-mono text-xs" style={{color:'#c9a84c'}}>{selectedUnit.rank}</div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="p-2 sm:p-3" style={{background:'rgba(0,0,0,0.3)',border:'1px solid #2a3a1a'}}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            <div className="sm:border-0 border-b pb-2 sm:pb-0" style={{borderColor:'#2a3a1a'}}>
              <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>MODO</div>
              <div className="font-bold font-mono text-xs capitalize" style={{color:'#c9a84c'}}>{selectedUnit.speedMode}</div>
            </div>
            <div className="sm:border-l sm:pl-2 sm:border-0 border-b pb-2 sm:pb-0" style={{borderColor:'#2a3a1a'}}>
              <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>FACÇÃO</div>
              <div className="font-bold font-mono text-xs" style={{color:'#c9a84c'}}>{selectedUnit.faction}</div>
            </div>
            <div className="sm:border-l sm:pl-2" style={{borderColor:'#2a3a1a'}}>
              <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>EXPANSÃO</div>
              <div className="font-bold font-mono text-xs" style={{color:'#c9a84c'}}>{selectedUnit.expansion}</div>
            </div>
          </div>
        </div>

        {/* Combat Stats */}
        <div className="p-2 sm:p-3" style={{background:'rgba(0,0,0,0.3)',border:'1px solid #2a3a1a'}}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-1 text-center">
            <div className="sm:border-l sm:pl-1" style={{borderColor:'#2a3a1a'}}>
              <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>ATK</div>
              <div className="font-bold font-mono text-xs" style={{color:'#e8d5a0'}}>{selectedUnit.maxAttack}</div>
            </div>
            <div className="sm:border-l sm:pl-1" style={{borderColor:'#2a3a1a'}}>
              <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>DEF</div>
              <div className="font-bold font-mono text-xs" style={{color:'#e8d5a0'}}>{selectedUnit.maxDefense}</div>
            </div>
            <div className="sm:border-l sm:pl-1" style={{borderColor:'#2a3a1a'}}>
              <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>DMG</div>
              <div className="font-bold font-mono text-xs" style={{color:'#e8d5a0'}}>{selectedUnit.maxDamage}</div>
            </div>
            <div className="sm:border-l sm:pl-1" style={{borderColor:'#2a3a1a'}}>
              <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>VENT</div>
              <div className="font-bold font-mono text-xs" style={{color:'#e8d5a0'}}>{selectedUnit.ventCapacity}</div>
            </div>
          </div>
        </div>

        {/* Arc Information */}
        <div className="p-2 sm:p-3" style={{background:'rgba(0,0,0,0.3)',border:'1px solid #2a3a1a'}}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-center">
            <div className="sm:border-0 border-b pb-2 sm:pb-0" style={{borderColor:'#2a3a1a'}}>
              <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>ARCO FRONTAL</div>
              <div className="font-bold font-mono text-xs" style={{color:'#e8d5a0'}}>{selectedUnit.frontArc}°</div>
            </div>
            <div className="sm:border-l sm:pl-2" style={{borderColor:'#2a3a1a'}}>
              <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>ARCO TRASEIRO</div>
              <div className="font-bold font-mono text-xs" style={{color:'#e8d5a0'}}>{selectedUnit.rearArc}°</div>
            </div>
          </div>
        </div>

        {/* Heat Modifiers Table */}
        {selectedUnit.heatDial && selectedUnit.heatDial.length > 0 && (
          <div className="p-2 sm:p-3" style={{background:'rgba(0,0,0,0.3)',border:'1px solid #2a3a1a'}}>
            <HeatModifiersTable
              heatDial={selectedUnit.heatDial}
              heatClicks={heatClicks}
              damageClicks={damageClicks}
              combatDial={selectedUnit.combatDial}
              colorMapping={colorMapping}
            />
          </div>
        )}
      </div>

      {/* Right Column - Dial and Controls */}
      <div className="w-full lg:flex-1 flex flex-col items-center justify-center min-h-0 mt-4 lg:mt-0">
        {selectedUnit.type.toLowerCase() === 'infantry' ? (
          <div className="w-full flex justify-center p-6" style={{background:'#d8d0c0',border:'1px solid #3a4a2a'}}>
            <div className="scale-75 sm:scale-75 lg:scale-100 origin-center">
              <InfantryDial
                unitId={unitId || ''}
                dialSide="stats"
                externalDamageClicks={damageClicks}
                onDamageChange={(clicks) => clicks > damageClicks ? handleDamage() : handleRepair()}
              />
            </div>
          </div>
        ) : selectedUnit.type.toLowerCase() === 'mech' && 
         selectedUnit.speedMode.toLowerCase() === 'mech' && 
         selectedUnit.class.toLowerCase() !== 'colossal' ? (
          <div className="w-full flex justify-center p-6" style={{background:'#d8d0c0',border:'1px solid #3a4a2a'}}>
            <div className="scale-75 sm:scale-75 lg:scale-100 origin-center">
              <AppDial
                unitId={unitId || ''}
                dialSide="stats"
                externalHeatClicks={heatClicks}
                externalDamageClicks={damageClicks}
                onHeatChange={(clicks) => clicks > heatClicks ? handleHeat((selectedUnit?.heatDial?.length ?? 0) + 1) : handleCooldown()}
                onDamageChange={(clicks) => clicks > damageClicks ? handleDamage() : handleRepair()}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8" style={{background:'rgba(0,0,0,0.4)',border:'1px dashed #3a4a2a'}}>
            <div className="text-center max-w-md">
              <h3 className="text-lg sm:text-xl font-bold font-mono mb-2" style={{color:'#c9a84c'}}>// DIAL EM DESENVOLVIMENTO</h3>
              <p className="text-sm sm:text-base mb-4 font-mono" style={{color:'#5a7a4a'}}>
                Tipo: <span style={{color:'#7a9a5a'}}>{selectedUnit.type}</span> |
                Modo: <span style={{color:'#7a9a5a'}}>{selectedUnit.speedMode}</span> |
                Classe: <span style={{color:'#7a9a5a'}}>{selectedUnit.class}</span>
              </p>
              <div className="p-3 corner-clip-sm" style={{background:'rgba(122,154,90,0.1)',border:'1px solid #3a4a2a'}}>
                <p className="text-xs sm:text-sm font-mono" style={{color:'#6a8a4a'}}>
                  🚧 Módulo em construção. Em breve disponível.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 3D Modal - Outside all containers for full screen */}
      {selectedUnit && (
        <Unit3DModal
          unit={selectedUnit}
          isOpen={is3DModalOpen}
          onClose={() => setIs3DModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function List() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListContent />
    </Suspense>
  );
}
