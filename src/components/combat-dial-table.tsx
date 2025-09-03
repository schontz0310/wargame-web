import React from 'react';
import { CombatDialStep } from '@/lib/api';
import Image from 'next/image';
import ballisticDamage from '@/images/ballisticDamage.png';
import energeticDamage from '@/images/energeticDamage.png';
import meleeDamage from '@/images/meleeDamage.png';

interface CombatDialTableProps {
  combatDial?: CombatDialStep[];
  currentStep: number;
  primaryDamageType?: 'ballistic' | 'energetic' | 'melee';
  secondaryDamageType?: 'ballistic' | 'energetic' | 'melee';
}

export const CombatDialTable: React.FC<CombatDialTableProps> = ({ combatDial, currentStep, primaryDamageType = 'ballistic', secondaryDamageType = 'ballistic' }) => {
  if (!combatDial || combatDial.length === 0) {
    return null;
  }

  // Criar array de 18 posições (1-18)
  const steps = Array.from({ length: 18 }, (_, i) => i + 1);
  
  // Mapear dados do combatDial por step
  const dialData = combatDial.reduce((acc, step) => {
    acc[step.step] = step;
    return acc;
  }, {} as Record<number, CombatDialStep>);

  const getIconForEquipType = (equipType: string) => {
    switch (equipType?.toLowerCase()) {
      case 'green':
        return '▲';
      case 'black':
        return '▲';
      default:
        return '';
    }
  };

  const getDamageIcon = (damageType: 'ballistic' | 'energetic' | 'melee') => {
    switch (damageType) {
      case 'ballistic':
        return ballisticDamage;
      case 'energetic':
        return energeticDamage;
      case 'melee':
        return meleeDamage;
      default:
        return ballisticDamage;
    }
  };

  const getCellClass = (step: number, rowType: string) => {
    const isCurrentStep = step === currentStep;
    const isDestroyedStep = step > 14; // Últimas 4 posições são destruição
    
    let baseClass = "w-10 h-8 border border-gray-400 text-center text-xs font-bold";
    
    if (isDestroyedStep) {
      baseClass += " bg-gray-800 text-white";
      return baseClass;
    }
    
    if (isCurrentStep) {
      if (rowType === 'movement') {
        baseClass += " bg-cyan-400 text-white";
      } else if (rowType === 'defense') {
        baseClass += " bg-black text-white";
      } else {
        baseClass += " bg-blue-400 text-white";
      }
    } else {
      baseClass += " bg-white text-black";
    }
    
    return baseClass;
  };

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <table className="border-collapse border border-gray-400 table-fixed">
            {/* Header com números 1-18 */}
            <thead>
              <tr>
                <th className="w-10 h-8 border border-gray-400 bg-gray-100 text-xs"></th>
                {steps.map(step => (
                  <th key={step} className="w-10 h-8 border border-gray-400 bg-gray-100 text-xs font-bold text-center">
                    {step}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Linha de Ataque Primário */}
              <tr>
                <td className="w-10 h-8 border border-gray-400 bg-black text-white text-xs font-bold text-center">
                  <div className="flex items-center justify-center h-full w-full">
                    <Image 
                      src={getDamageIcon(primaryDamageType)} 
                      alt="Primary damage type" 
                      width={primaryDamageType === 'melee' ? 16 : 6} 
                      height={primaryDamageType === 'melee' ? 16 : 6}
                      className="object-contain"
                    />
                  </div>
                </td>
                {steps.map(step => {
                  const data = dialData[step];
                  const isDestroyed = step > 14;
                  return (
                    <td key={step} className={getCellClass(step, 'primary')}>
                      {isDestroyed ? '💀' : (data?.primaryValue || 0)}
                    </td>
                  );
                })}
              </tr>
              
              {/* Linha de Ataque Secundário */}
              <tr>
                <td className="w-10 h-8 border border-gray-400 bg-black text-white text-xs font-bold text-center">
                  <div className="flex items-center justify-center h-full w-full">
                    <Image 
                      src={getDamageIcon(secondaryDamageType)} 
                      alt="Secondary damage type" 
                      width={secondaryDamageType === 'melee' ? 10 : 6} 
                      height={secondaryDamageType === 'melee' ? 10 : 6}
                      className="object-contain"
                    />
                  </div>
                </td>
                {steps.map(step => {
                  const data = dialData[step];
                  const isDestroyed = step > 14;
                  return (
                    <td key={step} className={getCellClass(step, 'secondary')}>
                      {isDestroyed ? '💀' : (data?.secondaryValue || 0)}
                    </td>
                  );
                })}
              </tr>
              
              {/* Linha de Movimento */}
              <tr>
                <td className="w-10 h-8 border border-gray-400 bg-black text-white text-xs font-bold text-center">
                  👟
                </td>
                {steps.map(step => {
                  const data = dialData[step];
                  const isDestroyed = step > 14;
                  return (
                    <td key={step} className={getCellClass(step, 'movement')}>
                      {isDestroyed ? '💀' : (data?.movementValue || 0)}
                    </td>
                  );
                })}
              </tr>
              
              {/* Linha de Defesa */}
              <tr>
                <td className="w-10 h-8 border border-gray-400 bg-black text-white text-xs font-bold text-center">
                  🛡️
                </td>
                {steps.map(step => {
                  const data = dialData[step];
                  const isDestroyed = step > 14;
                  return (
                    <td key={step} className={getCellClass(step, 'defense')}>
                      {isDestroyed ? '💀' : (data?.defenseValue || 0)}
                    </td>
                  );
                })}
              </tr>
              
              {/* Linha de Ataque */}
              <tr>
                <td className="w-10 h-8 border border-gray-400 bg-black text-white text-xs font-bold text-center">
                  ⚔️
                </td>
                {steps.map(step => {
                  const data = dialData[step];
                  const isDestroyed = step > 14;
                  return (
                    <td key={step} className={getCellClass(step, 'attack')}>
                      {isDestroyed ? '💀' : (data?.attackValue || 0)}
                    </td>
                  );
                })}
              </tr>
              
              {/* Linha de Equipamentos */}
              <tr>
                <td className="w-10 h-8 border border-gray-400 bg-gray-100"></td>
                {steps.map(step => {
                  const data = dialData[step];
                  const isDestroyed = step > 14;
                  return (
                    <td key={step} className="w-10 h-8 border border-gray-400 bg-white text-center text-xs">
                      {isDestroyed ? '' : getIconForEquipType(data?.movementEquipType)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
