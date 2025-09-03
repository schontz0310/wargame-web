/* eslint-disable jsx-a11y/alt-text */
'use client'

import { Stage, Layer, Circle, TextPath, Arc, Line, Image, Text, Rect, RegularPolygon, Group } from 'react-konva';
import elite from '@/images/patent-tree.png';
import veteran from '@/images/patent-two.png'
import green from '@/images/patent-one.png'
import vent from '@/images/vent.png';
import ballisticIcon from '@/images/ballisticDamage.png'
import energeticIcon from '@/images/energeticDamage.png'
import meleeIcon from '@/images/bullet.png'
import mechSpeedIcon from '@/images/bullet.png'
import bullet from '@/images/bullet.png'
import { CombatDialStep } from '@/lib/api';
import useImage from 'use-image'
import { useSelectedUnit } from '@/hooks/useSelectedUnit'
import { useState, useEffect } from 'react'

const ANGLE_PER_CHARACTER = 4.5;
const UNIQUE_STAR_CHARACTER = "★";

// Dial dimensions
const DIAL_WIDTH = 500;
const DIAL_HEIGHT = 500;
const DIAL_CENTER_X = DIAL_WIDTH / 2;
const DIAL_CENTER_Y = DIAL_HEIGHT / 2;

// Function to convert faction name to image path following the pattern: logo-dial-<faction-with-dashes>-white.png
const getFactionLogoPath = (faction: string | undefined): string => {
  if (!faction) {
    return '/images/logo-dial-default-white.png'; // fallback image
  }
  const factionSlug = faction
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
    .replace(/[''`]/g, '') // Remove apostrophes and similar characters
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
  const path = `/images/logo-dial-${factionSlug}-white.png`;
  return path;
};

// Function to convert expansion abbreviation to image path following the pattern: logo-dial-<expansion>-white.png
const getExpansionImagePath = (expansion: string | undefined): string => {
  if (!expansion) {
    return '/images/logo-dial-default-white.png'; // fallback image
  }
  const expansionSlug = expansion
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
    .replace(/[''`]/g, '') // Remove apostrophes and similar characters
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
  const path = `/images/logo-dial-${expansionSlug}-white.png`;
  return path;
};

const BALLISTIC_WIDTH = 4.5;
// const BALLISTIC_OFFSET = -8;
// const BALLISTIC_PADDING = -13

const ENERGETIC_WIDTH = 5.5;
// const ENERGETIC_OFFSET = -8;
// const ENERGETIC_PADDING = -13

const MELEE_WIDTH = 16.5;
const MELEE_OFFSET = -16;
const MELEE_PADDING = -15;

// Interfaces reserved for future use
// interface HeatStat {
//   value: number,
//   collor: {
//     hasColor: boolean,
//     hexValue: string
//   }
// }

// interface DamageStats {
//   type: string,
//   targets: number,
//   range: {
//     minimum: number,
//     maximum: number
//   }
// }

// interface ClickValues {
//   primaryAttack: number,
//   secondaryAttack?: number,
//   tertiaryAttack?: number,
//   movement: number,
//   attack: number,
//   defense: number
// }

// interface ClickColors {
//   hasCollor: boolean,
//   collorHex?: string,
//   singleUse?: boolean,
// }

interface DialParams {
  unitId: string;
  dialSide?: 'name' | 'stats';
}

export function AppDial(dialParams: DialParams) {
  // Extract dialSide from dialParams
  const { unitId, dialSide } = dialParams;
  
  // Get equipment color by ID
  const getEquipmentColorById = (colorMeaningId?: string): string => {
    switch (colorMeaningId) {
      case '6724024d-1887-4150-829a-5485229b6f9d':
      case '6a51d7c5-00b2-428c-a60f-3ed7fdd877ca':
      case 'b5d55f08-a809-4230-b6f4-763204bbf590':
      case '0b7bd1c2-5159-4ee8-884c-b80544fa7d39':
      case '37adc6ad-b3c2-4ef2-90da-3c269534fe3f':
      case '80343ab1-1c48-41ce-9c78-2f6d7ee3432c':
      case 'a22f0c1b-3b57-451e-9d4e-70766cca4f99':
      case 'cbf53b69-c314-4e0b-bb89-6b44e427ce72':
      case '7605ac82-774b-4965-b933-bc6cd88c8cea':
        return '#ff0000'; // Red
      case '495ad354-768a-4eec-bfe2-cc3e96abdec4':
      case 'ba2f357e-87c8-4578-8373-29626038b8c4':
      case '83533d0d-69c0-4174-b834-725ea798f7c9':
      case 'f225198f-8013-4c6f-9b26-06721d535d87':
      case '175e2f4d-e2d1-4e11-a3f9-6eb5505bcc60':
      case '883f206e-4835-4036-875f-3e89534c39a3':
        return '#00EEFF'; // Blue
      case 'a426c4d7-9c45-43c7-8ac1-a38ec62196b1':
      case 'a104887a-682f-4c20-9e07-4ce87607f72d':
      case '966342d2-defc-4730-8e05-356d79e26882':
      case 'f8f0f78c-051c-4c1f-80ad-515d555f035e':
      case '62b1417c-b1db-4b9e-9aa3-a73b57f80338':
      case 'd8f82245-6cc9-4443-a608-ed2c9b499a09':
        return '#000000'; // Black
      case '26bfaaac-ef6a-469d-807b-2f5d02861275':
      case '67568b06-43a6-4b2a-bd6c-6ca1a128f5b6':
      case 'd057de00-6126-437d-b6ea-d05ffd0a45c0':
      case 'f1ea3a07-4233-490d-ba40-0e933d589fca':
      case '4853082e-8863-40ff-9fcd-eb78d6c14e93':
      case 'd7c9ec9e-11ac-428e-b133-61a62a95ff28':
      case 'ebff8de4-3217-4dc0-9de9-148257912517':
      case 'b5599269-d95c-4554-a6dd-a2af32c73088':
      case '757ae965-b8f9-4473-b5fb-87b36efd96a7':
        return '#00ff00'; // Green
      case '76f01d7b-ca06-421b-b381-29570edbbaf8':
      case '6f5b7c23-e721-4a0b-9a1f-f966aba1a749':
      case '4633adee-87ea-470a-8b6c-f3d645c571df':
      case '6205fd17-a246-450f-9d7c-a2eaee2b8a93':
      case '64d6be48-70cc-485a-8bf4-0b9feabf66b2':
      case 'b9b3e23e-2d8c-4146-a4a3-0adbc50a5238':
        return '#B4B4B4'; // Gray
      case '071000b0-f5f0-4815-93fd-5fac9bf263a9':
      case '023225ca-c455-4f8c-952c-1d1a1ebed381':
      case 'cea94143-24bc-4b4c-8169-d52bf6801593':
      case 'fdcebbf1-f2f7-431d-a11c-d45c878f83cf':
      case '881d1b60-879a-4b54-b9a0-a8591e35a673':
        return '#C200C6'; // Purple
      default:
        return '#ffffff'; // White default
    }
  };

  // Get text color for equipment (white text on black background)
  const getTextColorForEquipment = (equipmentColor: string): string => {
    return equipmentColor === '#000000' ? '#ffffff' : '#000000';
  };

  // Get primary damage color
  const getPrimaryDamageColor = (step: CombatDialStep) => {
    if (step.primaryEquipColorMeaningId) {
      const colorHex = getEquipmentColorById(step.primaryEquipColorMeaningId);
      const textColor = getTextColorForEquipment(colorHex);
      return { hasCollor: true, collorHex: colorHex, textColor, singleUse: false };
    }
    return { hasCollor: false, collorHex: "#ffffff", textColor: "#000000", singleUse: false };
  };

  // Get secondary damage color
  const getSecondaryDamageColor = (step: CombatDialStep) => {
    if (step.secondaryEquipColorMeaningId) {
      const colorHex = getEquipmentColorById(step.secondaryEquipColorMeaningId);
      const textColor = getTextColorForEquipment(colorHex);
      return { hasCollor: true, collorHex: colorHex, textColor, singleUse: false };
    }
    return { hasCollor: false, collorHex: "#ffffff", textColor: "#000000", singleUse: false };
  };

  // Get movement color
  const getMovementColor = (step: CombatDialStep) => {
    if (step.movementEquipColorMeaningId) {
      const colorHex = getEquipmentColorById(step.movementEquipColorMeaningId);
      const textColor = getTextColorForEquipment(colorHex);
      return { hasCollor: true, collorHex: colorHex, textColor, singleUse: false };
    }
    return { hasCollor: false, collorHex: "#ffffff", textColor: "#000000", singleUse: false };
  };

  // Get attack color
  const getAttackColor = (step: CombatDialStep) => {
    if (step.attackEquipColorMeaningId) {
      const colorHex = getEquipmentColorById(step.attackEquipColorMeaningId);
      const textColor = getTextColorForEquipment(colorHex);
      return { hasCollor: true, collorHex: colorHex, textColor, singleUse: false };
    }
    return { hasCollor: false, collorHex: "#ffffff", textColor: "#000000", singleUse: false };
  };

  // Get defense color
  const getDefenseColor = (step: CombatDialStep) => {
    if (step.defenseEquipColorMeaningId) {
      const colorHex = getEquipmentColorById(step.defenseEquipColorMeaningId);
      const textColor = getTextColorForEquipment(colorHex);
      return { hasCollor: true, collorHex: colorHex, textColor, singleUse: false };
    }
    return { hasCollor: false, collorHex: "#ffffff", textColor: "#000000", singleUse: false };
  };

  const { selectedUnit, loading, error, damageClicks, handleDamage, handleRepair } = useSelectedUnit(unitId);
  
  // Helper function to adjust color intensity based on damage level
  const adjustColorIntensity = (hexColor: string, intensity: number): string => {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Adjust intensity (0 = lighter, 1 = full intensity)
    const minIntensity = 0.3; // Minimum intensity to keep colors visible
    const adjustedIntensity = minIntensity + (intensity * (1 - minIntensity));
    
    const newR = Math.round(r * adjustedIntensity);
    const newG = Math.round(g * adjustedIntensity);
    const newB = Math.round(b * adjustedIntensity);
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };
  
  // Move all hooks to top before any conditional returns
  const [ventLogo] = useImage(vent.src, 'anonymous');
  const [ballisticDamage] = useImage(ballisticIcon.src, 'anonymous');
  const [energeticDamage] = useImage(energeticIcon.src, 'anonymous');
  const [meleeDamage] = useImage(meleeIcon.src, 'anonymous');
  const [mechMovement] = useImage(mechSpeedIcon.src, 'anonymous');
  const [factionImage] = useImage(selectedUnit ? getFactionLogoPath(selectedUnit.faction) : '', 'anonymous');
  const [patentGreen] = useImage(green.src, 'anonymous');
  const [patentVeteran] = useImage(veteran.src, 'anonymous');
  const [patentElite] = useImage(elite.src, 'anonymous');
  const [expansionImage] = useImage(selectedUnit ? getExpansionImagePath(selectedUnit.expansion) : '', 'anonymous');
  const [bulletImage] = useImage(bullet.src, 'anonymous');
  
  // Smooth transition states
  const [transitionValues, setTransitionValues] = useState({
    primaryAttack: 0,
    secondaryAttack: 0,
    movement: 0,
    attack: 0,
    defense: 0
  });
  
  const [transitionColors, setTransitionColors] = useState({
    primaryAttack: { hasCollor: false, collorHex: '#ffffff' },
    secondaryAttack: { hasCollor: false, collorHex: '#ffffff' },
    movement: { hasCollor: false, collorHex: '#ffffff' },
    attack: { hasCollor: false, collorHex: '#ffffff' },
    defense: { hasCollor: false, collorHex: '#ffffff' }
  });

  // Calculate dial values based on damage clicks using combat dial data
  const calculateDialValues = (damageClicks: number) => {
    // Only use combat dial if it exists, no fallbacks
    if (selectedUnit?.combatDial && selectedUnit.combatDial.length > 0) {
      const maxCombatDialStep = selectedUnit.combatDial.length;
      
      // Check if this is a death click (beyond combat dial)
      if (damageClicks >= maxCombatDialStep) {
        // Death clicks (15-18 for most units) - return special death click indicator
        return {
          movement: 0,
          attack: 0,
          defense: 0,
          primaryAttack: 0,
          secondaryAttack: 0,
          isDeathClick: true,
          deathClickNumber: damageClicks - maxCombatDialStep + 1
        };
      }
      
      // Find the appropriate step based on damage clicks (clamped to available steps)
      const stepIndex = Math.min(damageClicks, selectedUnit.combatDial.length - 1);
      
      // Extra safety check - ensure stepIndex is within bounds
      if (stepIndex < 0 || stepIndex >= selectedUnit.combatDial.length) {
        return null;
      }
      
      const currentStep = selectedUnit.combatDial[stepIndex];
      
      // Validate that currentStep exists and has required properties
      if (!currentStep) {
        // Instead of returning null, use the last valid step
        const lastValidIndex = selectedUnit.combatDial.length - 1;
        const lastValidStep = selectedUnit.combatDial[lastValidIndex];
        if (lastValidStep) {
          return {
            movement: lastValidStep.movementValue || 0,
            attack: lastValidStep.attackValue || 0,
            defense: lastValidStep.defenseValue || 0,
            primaryAttack: lastValidStep.primaryValue || 0,
            secondaryAttack: lastValidStep.secondaryValue || 0,
            isDeathClick: false
          };
        }
        return null;
      }
      
      return {
        movement: currentStep.movementValue || 0,
        attack: currentStep.attackValue || 0,
        defense: currentStep.defenseValue || 0,
        primaryAttack: currentStep.primaryValue || 0,
        secondaryAttack: currentStep.secondaryValue || 0,
        isDeathClick: false
      };
    } else {
      // Return null if no combat dial data - component should handle this
      return null;
    }
  };

  // Animate transitions when damageClicks changes - MUST be before any conditional returns
  useEffect(() => {
    if (loading || error || !selectedUnit) return;
    
    // Get current click values
    const dialValues = calculateDialValues(damageClicks);
    if (!dialValues) {
      return;
    }
    
    // Set values immediately without animation
    setTransitionValues({
      primaryAttack: dialValues.primaryAttack,
      secondaryAttack: dialValues.secondaryAttack,
      movement: dialValues.movement,
      attack: dialValues.attack,
      defense: dialValues.defense
    });
    
    const currentColors = (() => {
      if (selectedUnit?.combatDial && selectedUnit.combatDial.length > 0) {
        const stepIndex = Math.min(damageClicks, selectedUnit.combatDial.length - 1);
        
        // Extra safety check for stepIndex
        if (stepIndex < 0 || stepIndex >= selectedUnit.combatDial.length) {
          return {
            primaryAttack: { hasCollor: false, collorHex: '#ffffff' },
            secondaryAttack: { hasCollor: false, collorHex: '#ffffff' },
            movement: { hasCollor: false, collorHex: '#ffffff' },
            attack: { hasCollor: false, collorHex: '#ffffff' },
            defense: { hasCollor: false, collorHex: '#ffffff' }
          };
        }
        
        const currentStep = selectedUnit.combatDial[stepIndex];
        
        // If currentStep is undefined, use safe defaults
        if (!currentStep) {
          return {
            primaryAttack: { hasCollor: false, collorHex: '#ffffff' },
            secondaryAttack: { hasCollor: false, collorHex: '#ffffff' },
            movement: { hasCollor: false, collorHex: '#ffffff' },
            attack: { hasCollor: false, collorHex: '#ffffff' },
            defense: { hasCollor: false, collorHex: '#ffffff' }
          };
        }
        
        return {
          primaryAttack: getPrimaryDamageColor(currentStep),
          secondaryAttack: getSecondaryDamageColor(currentStep),
          movement: getMovementColor(currentStep),
          attack: getAttackColor(currentStep),
          defense: getDefenseColor(currentStep)
        };
      }
      return {
        primaryAttack: { hasCollor: false, collorHex: '#ffffff' },
        secondaryAttack: { hasCollor: false, collorHex: '#ffffff' },
        movement: { hasCollor: false, collorHex: '#ffffff' },
        attack: { hasCollor: false, collorHex: '#ffffff' },
        defense: { hasCollor: false, collorHex: '#ffffff' }
      };
    })();
    
    // Set colors immediately
    setTransitionColors(currentColors);
  }, [damageClicks, selectedUnit, calculateDialValues, error, getAttackColor, getDefenseColor, getMovementColor, getPrimaryDamageColor, getSecondaryDamageColor, loading]);

  if (loading) return <div>Carregando...</div>;
  if (error || !selectedUnit) return <div>Erro ao carregar unidade</div>;
  
  // Get marker color based on marker type
  const getMarkerColor = (markerType: "none" | "black" | "green"): string => {
    switch (markerType) {
      case 'none':
        return '#ffffff';
      case 'black':
        return '#000000';
      case 'green':
        return '#00ff00';
      default:
        return '#ffffff';
    }
  };

  // Create click data with calculated values and equipment colors
  const click = {
    marker: (() => {
      if (selectedUnit?.combatDial && selectedUnit.combatDial.length > 0) {
        const stepIndex = Math.min(damageClicks, selectedUnit.combatDial.length - 1);
        
        // Safety check for stepIndex
        if (stepIndex < 0 || stepIndex >= selectedUnit.combatDial.length) {
          return { hasMarker: false, color: '#ffffff' };
        }
        
        const currentStep = selectedUnit.combatDial[stepIndex];
        
        // Safety check for currentStep
        if (!currentStep) {
          return { hasMarker: false, color: '#ffffff' };
        }
        
        // Use marker value from API: "none", "black", or "green"
        return { 
          hasMarker: currentStep.marker !== 'none',
          color: getMarkerColor(currentStep.marker)
        };
      }
      return { hasMarker: false, color: '#ffffff' };
    })(),
    values: calculateDialValues(damageClicks),
    colors: (() => {
      if (selectedUnit?.combatDial && selectedUnit.combatDial.length > 0) {
        const stepIndex = Math.min(damageClicks, selectedUnit.combatDial.length - 1);
        
        // Safety check for stepIndex
        if (stepIndex < 0 || stepIndex >= selectedUnit.combatDial.length) {
          return {
            primaryAttack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
            secondaryAttack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
            movement: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
            attack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
            defense: { hasCollor: false, collorHex: '#ffffff', singleUse: false }
          };
        }
        
        const currentStep = selectedUnit.combatDial[stepIndex];
        
        // Safety check for currentStep
        if (!currentStep) {
          return {
            primaryAttack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
            secondaryAttack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
            movement: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
            attack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
            defense: { hasCollor: false, collorHex: '#ffffff', singleUse: false }
          };
        }
        


        return {
          primaryAttack: getPrimaryDamageColor(currentStep),
          secondaryAttack: getSecondaryDamageColor(currentStep),
          movement: getMovementColor(currentStep),
          attack: getAttackColor(currentStep),
          defense: getDefenseColor(currentStep)
        };
      } else {
        // Fallback colors for units without combat dial - progressive damage colors
        const damageIntensity = damageClicks / 17;
        return {
          primaryAttack: { hasCollor: damageClicks >= 6, collorHex: adjustColorIntensity('#ff0000', damageIntensity), singleUse: false },
          secondaryAttack: { hasCollor: damageClicks >= 7, collorHex: adjustColorIntensity('#ff4500', damageIntensity), singleUse: false },
          movement: { hasCollor: damageClicks >= 3, collorHex: adjustColorIntensity('#ffff00', damageIntensity), singleUse: false },
          attack: { hasCollor: damageClicks >= 4, collorHex: adjustColorIntensity('#ff0000', damageIntensity), singleUse: false },
          defense: { hasCollor: damageClicks >= 5, collorHex: adjustColorIntensity('#ff6600', damageIntensity), singleUse: false }
        };
      }
    })()
  };
  
  const heatClick = {
    primaryDamage: { value: 0, collor: { hasColor: false, hexValue: '#ffffff' } },
    secondaryDamage: { value: 0, collor: { hasColor: false, hexValue: '#ffffff' } },
    movement: { value: 0, collor: { hasColor: false, hexValue: '#ffffff' } }
  };
  
  // Map API data to component expected format
  const frontArc = parseInt(selectedUnit?.frontArc || '0');
  const rearArc = parseInt(selectedUnit?.rearArc || '0');
  const frontArcRotate = ((frontArc - 180) * -1) / 2
  
  // Create damage types from attack stats - only if data exists
  const damageTypes = {
    primaryDamage: selectedUnit?.attackStats?.[0] ? {
      type: selectedUnit.attackStats[0].damageType,
      targets: selectedUnit.attackStats[0].targetCount,
      range: { 
        minimum: selectedUnit.attackStats[0].minRange, 
        maximum: selectedUnit.attackStats[0].maxRange 
      }
    } : null,
    secondaryDamage: selectedUnit?.attackStats?.[1] ? {
      type: selectedUnit.attackStats[1].damageType,
      targets: selectedUnit.attackStats[1].targetCount,
      range: { 
        minimum: selectedUnit.attackStats[1].minRange, 
        maximum: selectedUnit.attackStats[1].maxRange 
      }
    } : null
  };
  
  const dialSlices = Array.from({ length: 12 }, (_, index) => index + 1);
  const primaryDamageTargets = damageTypes.primaryDamage ? Array.from({ length: damageTypes.primaryDamage.targets }, (_, index) => index + 1) : [];
  const secondaryDamageTargets = damageTypes.secondaryDamage ? Array.from({ length: damageTypes.secondaryDamage.targets }, (_, index) => index + 1) : [];
  
  const dialValues = calculateDialValues(damageClicks);
  
  // If no combat dial data, show appropriate message
  if (!dialValues) {
    return (
      <div className="flex flex-col items-center p-4">
        <div className="text-center text-gray-600">
          <p className="text-lg font-semibold">{selectedUnit?.name || 'Unknown Unit'}</p>
          <p className="mt-2">Combat dial data not available</p>
          <p className="text-sm text-gray-500 mt-1">This unit doesn&apos;t have detailed combat dial information</p>
        </div>
      </div>
    );
  }
  
  // If this is a death click, render bullet holes instead of normal dial
  if (dialValues.isDeathClick) {
    return (
      <>
        {/* Damage Control Interface */}
        <div className="flex flex justify-center items-center gap-3 flex-shrink-0 mb-4">
          <button
            onClick={handleDamage}
            disabled={damageClicks >= 17}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Aplicar Dano
          </button>
          
          <button
            onClick={handleRepair}
            disabled={damageClicks <= 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Reparar
          </button>
          
          <div className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium text-center">
            Posição: {damageClicks + 1}/18
          </div>
        </div>

        {/* Death Click Dial */}
        <Stage width={DIAL_WIDTH} height={DIAL_HEIGHT}>
          <Layer>
            {/* Base dial circle */}
            <Circle
              x={DIAL_CENTER_X}
              y={DIAL_CENTER_Y}
              radius={200}
              fill="#2d2d2d"
              stroke="#666"
              strokeWidth={2}
            />
            
            {/* Bullet hole images in place of stat values */}
            {bulletImage && (
              <>
                {/* Primary Attack position */}
                <Image
                  image={bulletImage}
                  x={DIAL_CENTER_X - 15}
                  y={DIAL_CENTER_Y - 80}
                  width={30}
                  height={30}
                />
                
                {/* Secondary Attack position */}
                <Image
                  image={bulletImage}
                  x={DIAL_CENTER_X - 15}
                  y={DIAL_CENTER_Y + 50}
                  width={30}
                  height={30}
                />
                
                {/* Movement position */}
                <Image
                  image={bulletImage}
                  x={DIAL_CENTER_X - 80}
                  y={DIAL_CENTER_Y - 15}
                  width={30}
                  height={30}
                />
                
                {/* Attack position */}
                <Image
                  image={bulletImage}
                  x={DIAL_CENTER_X + 50}
                  y={DIAL_CENTER_Y - 15}
                  width={30}
                  height={30}
                />
                
                {/* Defense position */}
                <Image
                  image={bulletImage}
                  x={DIAL_CENTER_X - 15}
                  y={DIAL_CENTER_Y - 15}
                  width={30}
                  height={30}
                />
              </>
            )}
            
            {/* Death click indicator text */}
            <Text
              x={DIAL_CENTER_X}
              y={DIAL_CENTER_Y}
              text={`DESTROYED - Death Click ${dialValues.deathClickNumber}/4`}
              fontSize={16}
              fontStyle="bold"
              fill="#ff0000"
              align="center"
              offsetX={120}
            />
          </Layer>
        </Stage>
      </>
    );
  }
  
  // Build text sequence: points + unique + name (rank shown as image)
  const uniqueSymbol = selectedUnit?.isUnique ? " " + UNIQUE_STAR_CHARACTER : ""
  // Only add rank spacing if rank exists, otherwise use minimal spacing
  const RANK_SPACING = selectedUnit?.rank !== "Green" ? "     " : ""
  const fullFrontArcText = (selectedUnit?.points?.toString() || '0') + "  " + RANK_SPACING + uniqueSymbol + " " + (selectedUnit?.name || 'Unknown')
  const nameRotationAdjust = (((fullFrontArcText.length) * ANGLE_PER_CHARACTER) / 2) * -1
  const nameRotation = (90 + (nameRotationAdjust / 2)) * -1
  const patentRotationAdjust = Number(selectedUnit?.points || 0) < 100 ? (((-90 - nameRotation) * -1) - 8) : (((-90 - nameRotation) * -1) - 11)


  return (
    <>
    {/* Damage Control Interface */}
    <div className="flex flex justify-center items-center gap-3 flex-shrink-0 mb-4">
      <button
        onClick={handleDamage}
        disabled={damageClicks >= 17}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        Aplicar Dano
      </button>
      
      <button
        onClick={handleRepair}
        disabled={damageClicks <= 0}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        Reparar
      </button>
      
      <div className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium text-center">
        Posição: {damageClicks + 1}/18
      </div>
    </div>
    
    <Stage width={500} height={500} rotation={dialSide === 'name' ? 0 : 180} x={dialSide === 'name' ? 0 : DIAL_WIDTH} y={dialSide === 'name' ? 0 : DIAL_HEIGHT}>
      {/* Main dial layer - STATIC (no rotation) */}
      <Layer>
        {dialSlices.map((slice) => (
          <Arc
            x={DIAL_CENTER_X}
            y={DIAL_CENTER_Y}
            innerRadius={200}
            outerRadius={214}
            angle={29}
            fill="black"
            rotation={slice * 30}
            key={slice}
          />
        ))}
      </Layer>
      <Layer>
        <Circle
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          radius={200}
          fill="black"
          stroke="gray"
          strokeWidth={0.5}
        />
        <Circle
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          radius={4}
          fill="white"
        />
        <Arc
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          innerRadius={185}
          outerRadius={190}
          angle={rearArc}
          fill="#5b5b5b"
          rotation={270 - (rearArc / 2)}
        />
        <Line
          y={DIAL_CENTER_Y}
          x={DIAL_CENTER_X}
          points={[-188, 0, -165, 0]}
          strokeWidth={4}
          stroke="#5b5b5b"
          lineCap="round"
          rotation={(90 + (rearArc / 2))} 
        />
        <Line
          y={DIAL_CENTER_Y}
          x={DIAL_CENTER_X}
          points={[-188, 0, -165, 0]}
          strokeWidth={3}
          stroke="#5b5b5b"
          lineCap="round"
          rotation={90 - (rearArc / 2)} 
        />
        <Arc
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          innerRadius={186}
          outerRadius={190}
          angle={frontArc}
          fill="white"
          rotation={frontArcRotate} 
        />
        <Line
          y={DIAL_CENTER_Y}
          x={DIAL_CENTER_X}
          points={[-188, 0, -170, 0]}
          strokeWidth={3}
          stroke="white"
          lineCap="round"
          rotation={frontArcRotate * -1} 
        />
        <Line
          y={DIAL_CENTER_Y}
          x={DIAL_CENTER_X}
          points={[-188, 0, -170, 0]}
          strokeWidth={3}
          stroke="white"
          lineCap="round"
          rotation={(frontArcRotate - 180)} 
        />
      </Layer>
      <Layer>
        <TextPath
          text={fullFrontArcText}
          fontSize={16}
          fill={"#FFFFFF"}
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          data='M -175 0 A 175 175 0 0 0 175 0'
          rotation={nameRotation}
          onClick={() => {}} />
        <TextPath
          text={String(selectedUnit?.collectionNumber || 0).padStart(3, '0')}
          fontSize={16}
          fill={"#FFFFFF"}
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          data='M -175 0 A 175 175 0 0 0 175 0'
          rotation={-200.5} />
        <TextPath
          text={selectedUnit?.variant || ''}
          fontSize={16}
          fill={"#FFFFFF"}
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          data='M -175 0 A 175 175 0 0 0 175 0'
          rotation={42} />
      </Layer>
      <Layer>
        <Image
          image={factionImage}
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          width={30}
          height={30}
          rotation={-127}
          offsetX={17}
          offsetY={-152}
        />
        <Image
          image={expansionImage}
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          width={30}
          height={30}
          rotation={-104}
          offsetX={17}
          offsetY={-152}
        />
        {selectedUnit?.rank === 'Elite' && 
          <Image
          image={patentElite}
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          width={15}
          height={15}
          rotation={patentRotationAdjust}
          offsetX={0}
          offsetY={-166}
        />
        }
        {selectedUnit?.rank === 'Veteran' && 
          <Image
          image={patentVeteran}
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          width={15}
          height={10}
          rotation={patentRotationAdjust}
          offsetX={0}
          offsetY={-168}
        />
        }
        {selectedUnit?.rank === 'Green' && 
          <Image
          image={patentGreen}
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          width={15}
          height={5}
          rotation={patentRotationAdjust}
          offsetX={0}
          offsetY={-170}
        />
        }
        <Image
          image={ventLogo}
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          width={30}
          height={20}
          rotation={180}
          offsetX={18}
          offsetY={-57}
        />
        <Text
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          text={String(selectedUnit?.ventCapacity || 0)}
          fontSize={16}
          fontStyle='bold'
          fill="#000000"
          rotation={180}
          offsetY={-60}
          offsetX={-1}
        />
      </Layer>
      <Layer>
        <Arc
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          innerRadius={154}
          outerRadius={183}
          angle={18}
          fill="#ffffff"
          rotation={-103.5}
          visible
        />
        <Rect
          x={240}
          y={68.5}
          width={25}
          height={98}
          fill="#ffffff"
          cornerRadius={[40, 0, 0, 0]}
        />
      </Layer>
      <Layer>
        {/* heat dial */}
        <Group visible={true}>
          <Rect
            x={DIAL_CENTER_X + 40}
            y={DIAL_CENTER_Y - (DIAL_CENTER_Y/1.08)}
            width={20}
            height={70}
            fill="#000000"
            shadowBlur={6}
            shadowColor='#ffff'
            cornerRadius={[5, 5, 0, 0]}
            visible={true}
          />
          <Rect
            x={270}
            y={90.5}
            width={80}
            height={130}
            fill="#000000"
            shadowBlur={6}
            shadowColor='#ffff'
            cornerRadius={[5, 5, 5, 5]}
            visible={true}
          />
          <Rect
            x={325}
            y={105}
            width={25}
            height={40}
            fill="#000000"
            shadowBlur={2}
            shadowColor='#ffff'
            cornerRadius={[0, 0, 0, 0]}
            visible={true}
          />
          <Rect
            x={340}
            y={105}
            width={10}
            height={40}
            fill="#000000"
            shadowBlur={2}
            shadowColor='#ffff'
            cornerRadius={[0, 0, 0, 0]}
            visible={true}
          />
          <Rect
            x={325}
            y={165}
            width={25}
            height={40}
            fill="#000000"
            shadowBlur={2}
            shadowColor='#ffff'
            cornerRadius={[0, 0, 0, 0]}
            visible={true}
          />
          <Rect
            x={340}
            y={165}
            width={10}
            height={40}
            fill="#000000"
            shadowBlur={2}
            shadowColor='#ffff'
            cornerRadius={[0, 0, 0, 0]}
            visible={true}
          />
          <Rect
            x={280}
            y={118.5}
            width={25}
            height={82}
            fill="#ffffff"
          />
          {/* Movement heat stats */}
          <Rect
            x={281}
            y={124}
            width={23}
            height={22}
            visible={heatClick.movement.collor.hasColor}
            fill={heatClick.movement.collor.hexValue}
          />
          <Text
            x={250}
            y={250}
            text={heatClick.movement.value <= 0
              ? String(heatClick.movement.value)
              : `+${String(heatClick.movement.value)}`
            }
            fontSize={16}
            fontStyle='bold'
            fill={heatClick.movement.collor.hasColor && heatClick.movement.collor.hexValue === "#000000" ? "#FFFFFF" : "#000000"}
            rotation={180}
            offsetY={-108}
            offsetX={heatClick.movement.value === 0 ? 47.5 : 51} 
          />
          {/* secondaryDamage heat stats */}
          <Rect
            x={281}
            y={148}
            width={23}
            height={22}
            visible={heatClick.secondaryDamage.collor.hasColor}
            fill={heatClick.secondaryDamage.collor.hexValue}
          />
          <Text
            x={250}
            y={250}
            text={heatClick.secondaryDamage.value <= 0
              ? String(heatClick.secondaryDamage.value)
              : `+${String(heatClick.secondaryDamage.value)}`
            }
            fontSize={16}
            fontStyle='bold'
            fill={heatClick.secondaryDamage.collor.hasColor && heatClick.secondaryDamage.collor.hexValue === "#000000" ? "#FFFFFF" : "#000000"}
            rotation={180}
            offsetY={-85}
            offsetX={heatClick.secondaryDamage.value === 0 ? 47.5 : 51} 
          />
          {/* primaryDamage heat stats */}
          <Rect
            x={281}
            y={172}
            width={23}
            height={22}
            visible={heatClick.primaryDamage.collor.hasColor}
            fill={heatClick.primaryDamage.collor.hexValue}
            cornerRadius={click.colors?.primaryAttack?.singleUse === true ? [14, 14, 14, 14] : [0, 0, 0, 0]}
          />
          <Text
            x={250}
            y={250}
            text={heatClick.primaryDamage.value <= 0
              ? String(heatClick.primaryDamage.value)
              : `+${String(heatClick.primaryDamage.value)}`
            }
            fontSize={16}
            fontStyle='bold'
            fill={heatClick.primaryDamage.collor.hasColor && heatClick.primaryDamage.collor.hexValue === "#000000" ? "#FFFFFF" : "#000000"}
            rotation={180}
            offsetY={-60}
            offsetX={heatClick.primaryDamage.value === 0 ? 47.5 : 51} 
          />
        </Group>
      </Layer>
      {/* L-shaped stats window - STATIC */}
      <Layer>
        {/* Primary Attack stats */}
        <Rect
          x={241}
          y={144}
          width={23}
          height={22}
          visible={transitionColors.primaryAttack.hasCollor}
          fill={transitionColors.primaryAttack.collorHex}
          cornerRadius={click.colors?.primaryAttack?.singleUse === true ? [14, 14, 14, 14] : [0, 0, 0, 0]}
          onClick={() => {}}
          style={{ cursor: 'pointer' }}
          opacity={1}
          listening={false}
        />
        {/* Secondary Attack stats */}
        {dialValues?.secondaryAttack !== undefined && dialValues?.secondaryAttack !== null && (
          <Rect
            x={241}
            y={120}
            width={23}
            height={22}
            fill={click.colors?.secondaryAttack?.collorHex}
            cornerRadius={click.colors?.secondaryAttack?.singleUse === true ? [14, 14, 14, 14] : [0, 0, 0, 0]}
            visible={click.colors?.secondaryAttack?.hasCollor}
            onClick={() => {}}
            style={{ cursor: 'pointer' }}
          />
        )}
        {/* Movement stats */}
        <Rect
          x={241}
          y={96}
          width={23}
          height={22}
          visible={click.colors?.movement?.hasCollor}
          fill={click.colors?.movement?.collorHex}
          cornerRadius={click.colors?.movement?.singleUse === true ? [14, 14, 14, 14] : [0, 0, 0, 0]}
          onClick={() => {}}
          style={{ cursor: 'pointer' }}
        />
        {/* Attack stats */}
        <Rect
          x={241}
          y={72}
          width={23}
          height={22}
          visible={click.colors?.attack?.hasCollor}
          fill={click.colors?.attack?.collorHex}
          cornerRadius={click.colors?.attack?.singleUse === true ? [14, 14, 14, 14] : [0, 0, 0, 0]}
          onClick={() => {}}
          style={{ cursor: 'pointer' }}
        />
        {/* Defense stats */}
        <Rect
          x={210}
          y={77}
          width={23}
          height={22}
          rotation={-12}
          visible={click.colors?.defense?.hasCollor}
          fill={click.colors?.defense?.collorHex}
          cornerRadius={click.colors?.defense?.singleUse === true ? [14, 14, 14, 14] : [0, 0, 0, 0]}
          onClick={() => {}}
          style={{ cursor: 'pointer' }}
        />
      </Layer>
      {/* Rotating stats numbers layer */}
      <Layer>
        <Text
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          text={String(transitionValues.primaryAttack)}
          fontSize={16}
          fontStyle='bold'
          fill={transitionColors.primaryAttack.hasCollor && transitionColors.primaryAttack.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
          rotation={180}
          offsetY={-88}
          offsetX={transitionValues.primaryAttack > 9 ? 11.5 : 6.5} 
        />
        {/* Secondary Attack stats */}
        {transitionValues.secondaryAttack !== undefined && transitionValues.secondaryAttack !== null && (
          <Text
            x={DIAL_CENTER_X}
            y={DIAL_CENTER_Y}
            text={String(transitionValues.secondaryAttack)}
            fontSize={16}
            fontStyle='bold'
            fill={transitionColors.secondaryAttack?.hasCollor && transitionColors.secondaryAttack?.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
            rotation={180}
            offsetY={-113}
            offsetX={transitionValues.secondaryAttack > 9 ? 11.5 : 6.5} 
          />
        )}
        {/* Movement stats */}
        <Text
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          text={String(transitionValues.movement)}
          fontSize={16}
          fontStyle='bold'
          fill={transitionColors.movement.hasCollor && transitionColors.movement.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
          rotation={180}
          offsetY={-136}
          offsetX={transitionValues.movement > 9 ? 11.5 : 6.5} 
        />
        {/* Attack stats */}
        <Text
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          text={String(transitionValues.attack)}
          fontSize={16}
          fontStyle='bold'
          fill={transitionColors.attack.hasCollor && transitionColors.attack.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
          rotation={180}
          offsetY={-160}
          offsetX={transitionValues.attack > 9 ? 11.5 : 6.5} 
        />
        {/* Defense stats */}
        <Text
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          text={String(transitionValues.defense)}
          fontSize={16}
          fontStyle='bold'
          fill={transitionColors.defense.hasCollor && transitionColors.defense.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
          rotation={170}
          offsetY={-160.5}
          offsetX={transitionValues.defense > 9 ? 11.5 : 7} 
        />
        {/* Marker */}
        {click.marker?.hasMarker && (
          <RegularPolygon
            x={DIAL_CENTER_X}
            y={DIAL_CENTER_Y}
            sides={3}
            radius={6}
            fill={click.marker?.color}
            rotation={175}
            offsetY={-180}
            offsetX={1}
            scaleX={2.5}
          />
        )}
      </Layer>
      <Layer>
        {/* Primary Damage targets and range */}
        {damageTypes.primaryDamage && primaryDamageTargets.map((slice) => (
          <Image
            key={slice}
            image={damageTypes.primaryDamage!.type === 'ballistic'
              ? ballisticDamage
              : damageTypes.primaryDamage!.type === 'energetic'
                ? energeticDamage
                : meleeDamage}
            x={DIAL_CENTER_X}
            y={DIAL_CENTER_Y}
            width={damageTypes.primaryDamage!.type === 'ballistic'
              ? BALLISTIC_WIDTH
              : damageTypes.primaryDamage!.type === 'energetic'
                ? ENERGETIC_WIDTH
                : MELEE_WIDTH
            }
            height={20}
            rotation={180}
            offsetX={damageTypes.primaryDamage!.type === 'melee'
                ? MELEE_PADDING + ((slice - 1) * MELEE_OFFSET)
                : -8 + (slice * -8)
            }
            offsetY={-84}
          />  
        ))}
        {damageTypes.primaryDamage && (
          <Text
            x={DIAL_CENTER_X}
            y={DIAL_CENTER_Y}
            text={`${String(damageTypes.primaryDamage.range.minimum)}/${String(damageTypes.primaryDamage.range.maximum)}`}
            fontSize={16}
            fontStyle='bold'
            fill="#FFFFFF"
            rotation={180}
            offsetX={  -18 + (primaryDamageTargets.length * -8)}
            offsetY={-86}
          />
        )}
        {/* Secondary Damage targets and range */}
        {damageTypes.secondaryDamage && secondaryDamageTargets.length > 0 && secondaryDamageTargets.map((slice) => (
          <Image
            key={slice}
            image={damageTypes.secondaryDamage!.type === 'ballistic'
              ? ballisticDamage
              : damageTypes.secondaryDamage!.type === 'energetic'
                ? energeticDamage
                : meleeDamage}
            x={DIAL_CENTER_X}
            y={DIAL_CENTER_Y - 40}
            width={damageTypes.secondaryDamage!.type === 'ballistic'
              ? BALLISTIC_WIDTH
              : damageTypes.secondaryDamage!.type === 'energetic'
                ? ENERGETIC_WIDTH
                : MELEE_WIDTH
            }
            height={20}
            rotation={180}
            offsetX={damageTypes.secondaryDamage!.type === 'melee'
                ? MELEE_PADDING + ((slice - 1) * MELEE_OFFSET)
                : -8 + (slice * -8)
            }
            offsetY={-68}
          />  
        ))}
        {damageTypes.secondaryDamage && secondaryDamageTargets.length > 0 && (
          <Text
            x={DIAL_CENTER_X}
            y={DIAL_CENTER_Y}
            text={`${String(damageTypes.secondaryDamage.range.minimum)}/${String(damageTypes.secondaryDamage.range.maximum)}`}
            fontSize={16}
            fontStyle='bold'
            fill="#FFFFFF"
            rotation={180}
            offsetX={-18 + (secondaryDamageTargets.length * -8)}
            offsetY={-110}
          />
        )}
        {/* Movement Symbol */}
        <Image
          image={mechMovement}
          x={DIAL_CENTER_X}
          y={DIAL_CENTER_Y}
          width={16}
          height={22}
          rotation={158}
          offsetX={17}
          offsetY={-160}
        />
      </Layer>
    </Stage>
    
    </>
  );
};
