/* eslint-disable jsx-a11y/alt-text */
'use client'

import { HeatDialStep } from '@/lib/api';
import { Stage, Layer, Circle, TextPath, Arc, Line, Image, Text, Rect, RegularPolygon, Group } from 'react-konva';
import elite from '@/images/patent-tree.png';
import veteran from '@/images/patent-two.png'
import green from '@/images/patent-one.png'
import vent from '@/images/vent.png';
import ballisticIcon from '@/images/ballisticDamage.png'
import energeticIcon from '@/images/energeticDamage.png'
import meleeIcon from '@/images/meleeDamage.png'
import mechSpeedIcon from '@/images/bullet.png'
import bullet from '@/images/bullet.png'
import { CombatDialStep } from '@/lib/api';
import useImage from 'use-image'
import { useSelectedUnit } from '@/hooks/useSelectedUnit'
import { useColorMeanings } from '@/hooks/useColorMeanings'
import { useState, useEffect, useCallback, useRef } from 'react'

const ANGLE_PER_CHARACTER = 4.5;
const UNIQUE_STAR_CHARACTER = "★ ";

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
  externalHeatClicks?: number;
  externalDamageClicks?: number;
  onHeatChange?: (clicks: number) => void;
  onDamageChange?: (clicks: number) => void;
}

export function AppDial(dialParams: DialParams) {
  const { unitId, dialSide, externalHeatClicks, externalDamageClicks, onHeatChange, onDamageChange } = dialParams;
  
  // Use dynamic color mapping from API
  const { getColorById, getTextColorForColor, loading: colorLoading, colorMapping } = useColorMeanings();

  const getPrimaryDamageColor = useCallback((step: CombatDialStep) => {
    if (step.primaryEquipColorMeaningId) {
      const colorHex = getColorById(step.primaryEquipColorMeaningId);
      const textColor = getTextColorForColor(colorHex);
      // Show square if ID exists in step, even if not found in API (will use white as fallback)
      return { color: colorHex, textColor, hasColor: true };
    }
    return { color: '#ffffff', textColor: '#000000', hasColor: false };
  }, [getColorById, getTextColorForColor]);

  const getSecondaryDamageColor = useCallback((step: CombatDialStep) => {
    if (step.secondaryEquipColorMeaningId) {
      const colorHex = getColorById(step.secondaryEquipColorMeaningId);
      const textColor = getTextColorForColor(colorHex);
      // Show square if ID exists in step, even if not found in API (will use white as fallback)
      return { color: colorHex, textColor, hasColor: true };
    }
    return { color: '#ffffff', textColor: '#000000', hasColor: false };
  }, [getColorById, getTextColorForColor]);

  const getMovementColor = useCallback((step: CombatDialStep) => {
    if (step.movementEquipColorMeaningId) {
      const colorHex = getColorById(step.movementEquipColorMeaningId);
      const textColor = getTextColorForColor(colorHex);
      // Show square if ID exists in step, even if not found in API (will use white as fallback)
      return { color: colorHex, textColor, hasColor: true };
    }
    return { color: '#ffffff', textColor: '#000000', hasColor: false };
  }, [getColorById, getTextColorForColor]);

  const getAttackColor = useCallback((step: CombatDialStep) => {
    if (step.attackEquipColorMeaningId) {
      const colorHex = getColorById(step.attackEquipColorMeaningId);
      const textColor = getTextColorForColor(colorHex);
      // Show square if ID exists in step, even if not found in API (will use white as fallback)
      return { color: colorHex, textColor, hasColor: true };
    }
    return { color: '#ffffff', textColor: '#000000', hasColor: false };
  }, [getColorById, getTextColorForColor]);

  const getDefenseColor = useCallback((step: CombatDialStep) => {
    if (step.defenseEquipColorMeaningId) {
      const colorHex = getColorById(step.defenseEquipColorMeaningId);
      const textColor = getTextColorForColor(colorHex);
      // Show square if ID exists in step, even if not found in API (will use white as fallback)
      return { color: colorHex, textColor, hasColor: true };
    }
    return { color: '#ffffff', textColor: '#000000', hasColor: false };
  }, [getColorById, getTextColorForColor]);

  const { selectedUnit, loading, error, damageClicks: internalDamageClicks, handleDamage: internalHandleDamage, handleRepair: internalHandleRepair, heatClicks: internalHeatClicks, handleHeat: internalHandleHeat, handleCooldown: internalHandleCooldown } = useSelectedUnit(unitId);

  const damageClicks = externalDamageClicks ?? internalDamageClicks;
  const heatClicks = externalHeatClicks ?? internalHeatClicks;
  const handleDamage = onDamageChange ? () => onDamageChange(damageClicks + 1) : internalHandleDamage;
  const handleRepair = onDamageChange ? () => onDamageChange(Math.max(0, damageClicks - 1)) : internalHandleRepair;
  const handleHeat = (max: number) => { if (onHeatChange) onHeatChange(Math.min(heatClicks + 1, max - 1)); else internalHandleHeat(max); };
  const handleCooldown = () => { if (onHeatChange) onHeatChange(Math.max(0, heatClicks - 1)); else internalHandleCooldown(); };
  
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
    primaryAttack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
    secondaryAttack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
    movement: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
    attack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
    defense: { hasCollor: false, collorHex: '#ffffff', singleUse: false }
  });

  // Heat dial animation states
  const [ventSpinning, setVentSpinning] = useState(false);
  const [heatSlideX, setHeatSlideX] = useState(0);
  const [heatSlideOpacity, setHeatSlideOpacity] = useState(1);
  const prevHeatClicksRef = useRef(0);

  // Fade animation states
  const [fadeState, setFadeState] = useState({
    primaryAttack: { opacity: 1, isTransitioning: false },
    secondaryAttack: { opacity: 1, isTransitioning: false },
    movement: { opacity: 1, isTransitioning: false },
    attack: { opacity: 1, isTransitioning: false },
    defense: { opacity: 1, isTransitioning: false }
  });

  // Calculate dial values based on damage clicks using combat dial data
  const calculateDialValues = useCallback((damageClicks: number) => {
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
  }, [selectedUnit]);

  // Animate transitions when damageClicks changes - MUST be before any conditional returns
  useEffect(() => {
    if (loading || error || !selectedUnit || colorLoading) return;
    
    // Get current click values
    const dialValues = calculateDialValues(damageClicks);
    if (!dialValues) {
      return;
    }
    
    const newValues = {
      primaryAttack: dialValues.primaryAttack,
      secondaryAttack: dialValues.secondaryAttack,
      movement: dialValues.movement,
      attack: dialValues.attack,
      defense: dialValues.defense
    };
    
    const currentColors = (() => {
      if (selectedUnit?.combatDial && selectedUnit.combatDial.length > 0) {
        const stepIndex = Math.min(damageClicks, selectedUnit.combatDial.length - 1);
        
        // Extra safety check for stepIndex
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
        
        // If currentStep is undefined, use safe defaults
        if (!currentStep) {
          return {
            primaryAttack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
            secondaryAttack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
            movement: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
            attack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
            defense: { hasCollor: false, collorHex: '#ffffff', singleUse: false }
          };
        }
        
        const primaryColor = getPrimaryDamageColor(currentStep);
        const secondaryColor = getSecondaryDamageColor(currentStep);
        const movementColor = getMovementColor(currentStep);
        const attackColor = getAttackColor(currentStep);
        const defenseColor = getDefenseColor(currentStep);
        
        return {
          primaryAttack: { hasCollor: primaryColor.hasColor, collorHex: primaryColor.color, singleUse: false },
          secondaryAttack: { hasCollor: secondaryColor.hasColor, collorHex: secondaryColor.color, singleUse: false },
          movement: { hasCollor: movementColor.hasColor, collorHex: movementColor.color, singleUse: false },
          attack: { hasCollor: attackColor.hasColor, collorHex: attackColor.color, singleUse: false },
          defense: { hasCollor: defenseColor.hasColor, collorHex: defenseColor.color, singleUse: false }
        };
      }
      return {
        primaryAttack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
        secondaryAttack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
        movement: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
        attack: { hasCollor: false, collorHex: '#ffffff', singleUse: false },
        defense: { hasCollor: false, collorHex: '#ffffff', singleUse: false }
      };
    })();
    
    // Always trigger fade animation for consistency
    // Start fade out animation
    setFadeState(prev => Object.keys(prev).reduce((acc, key) => ({
      ...acc,
      [key]: { opacity: 0, isTransitioning: true }
    }), {} as typeof prev));
    
    // After fade out, update values and colors, then fade in
    setTimeout(() => {
      setTransitionValues(newValues);
      setTransitionColors(currentColors);
      
      setTimeout(() => {
        setFadeState(prev => Object.keys(prev).reduce((acc, key) => ({
          ...acc,
          [key]: { opacity: 1, isTransitioning: false }
        }), {} as typeof prev));
      }, 50);
    }, 150);
  }, [damageClicks, selectedUnit, calculateDialValues, error, getAttackColor, getDefenseColor, getMovementColor, getPrimaryDamageColor, getSecondaryDamageColor, loading, colorLoading, colorMapping]);

  useEffect(() => {
    const delta = heatClicks - prevHeatClicksRef.current;
    prevHeatClicksRef.current = heatClicks;
    if (delta === 0) return;
    const startX = delta > 0 ? -40 : 40;
    setHeatSlideX(startX);
    setHeatSlideOpacity(0);
    const startTime = performance.now();
    const duration = 280;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setHeatSlideX(startX * (1 - eased));
      const opacity = progress > 0.7 ? (progress - 0.7) / 0.3 : 0;
      setHeatSlideOpacity(opacity);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [heatClicks]);

  if (loading || colorLoading) return <div>Carregando...</div>;
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
        


        const primaryColor = getPrimaryDamageColor(currentStep);
        const secondaryColor = getSecondaryDamageColor(currentStep);
        const movementColor = getMovementColor(currentStep);
        const attackColor = getAttackColor(currentStep);
        const defenseColor = getDefenseColor(currentStep);
        
        return {
          primaryAttack: { hasCollor: primaryColor.hasColor, collorHex: primaryColor.color, textColor: primaryColor.textColor },
          secondaryAttack: { hasCollor: secondaryColor.hasColor, collorHex: secondaryColor.color, textColor: secondaryColor.textColor },
          movement: { hasCollor: movementColor.hasColor, collorHex: movementColor.color, textColor: movementColor.textColor },
          attack: { hasCollor: attackColor.hasColor, collorHex: attackColor.color, textColor: attackColor.textColor },
          defense: { hasCollor: defenseColor.hasColor, collorHex: defenseColor.color, textColor: defenseColor.textColor }
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
  
  const maxHeatSteps = selectedUnit?.heatDial ? selectedUnit.heatDial.length + 1 : 0;

  const calculateHeatValues = (heatClicks: number) => {
    if (!selectedUnit?.heatDial || selectedUnit.heatDial.length === 0) return null;
    const stepIndex = Math.min(heatClicks, selectedUnit.heatDial.length - 1);
    const step = selectedUnit.heatDial[stepIndex];
    if (!step) return null;
    return {
      primaryHeatValue: step.primaryHeatValue,
      secondaryHeatValue: step.secondaryHeatValue,
      movementHeatValue: step.movementHeatValue,
      primaryHeatColorMeaningId: step.primaryHeatColorMeaningId,
      secondaryHeatColorMeaningId: step.secondaryHeatColorMeaningId,
      movementHeatColorMeaningId: step.movementHeatColorMeaningId,
    };
  };

  const isShutdown = maxHeatSteps > 0 && heatClicks === maxHeatSteps - 1;
  const safeHeatClicks = isShutdown ? (selectedUnit?.heatDial?.length ?? 1) - 1 : heatClicks;

  const handleCooldownWithSpin = () => {
    handleCooldown();
    setVentSpinning(true);
    setTimeout(() => setVentSpinning(false), 600);
  };
  const heatValues = calculateHeatValues(safeHeatClicks);

  const heatClick = {
    primaryDamage: {
      value: heatValues?.primaryHeatValue ?? 0,
      collor: {
        hasColor: !!heatValues?.primaryHeatColorMeaningId,
        hexValue: heatValues?.primaryHeatColorMeaningId ? getColorById(heatValues.primaryHeatColorMeaningId) : '#ffffff'
      }
    },
    secondaryDamage: {
      value: heatValues?.secondaryHeatValue ?? 0,
      collor: {
        hasColor: !!heatValues?.secondaryHeatColorMeaningId,
        hexValue: heatValues?.secondaryHeatColorMeaningId ? getColorById(heatValues.secondaryHeatColorMeaningId) : '#ffffff'
      }
    },
    movement: {
      value: heatValues?.movementHeatValue ?? 0,
      collor: {
        hasColor: !!heatValues?.movementHeatColorMeaningId,
        hexValue: heatValues?.movementHeatColorMeaningId ? getColorById(heatValues.movementHeatColorMeaningId) : '#ffffff'
      }
    }
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
  const primaryDamageTargets = damageTypes.primaryDamage ? Array.from({ length: Math.max(damageTypes.primaryDamage.targets, 1) }, (_, index) => index + 1) : [];
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
        {/* Damage Control Interface - Curved arrows around dial */}
        <div className="relative flex justify-center items-center mb-6">
          {/* Position indicator - centered above dial */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 px-5 py-3 bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 shadow-md z-10">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Posição: {damageClicks + 1}/18
            </span>
          </div>
          
        </div>
        
        {/* Centralized interaction buttons */}
        <div className="flex justify-center items-center gap-6 mt-6">
          {/* Left arrow button - Repair */}
          <button
            onClick={handleRepair}
            disabled={damageClicks <= 0}
            className="group bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 disabled:transform-none disabled:shadow-md z-10"
            style={{
              clipPath: 'polygon(25% 0%, 100% 0%, 75% 50%, 100% 100%, 25% 100%, 0% 50%)',
              width: '60px',
              height: '40px'
            }}
          >
          </button>
          
          {/* Right arrow button - Apply Damage */}
          <button
            onClick={handleDamage}
            disabled={damageClicks >= 17}
            className="group bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 disabled:transform-none disabled:shadow-md z-10"
            style={{
              clipPath: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%)',
              width: '60px',
              height: '40px'
            }}
          >
          </button>
        </div>
        
        {/* Button labels */}
        <div className="flex justify-center items-center gap-6 mt-2">
          <span className="text-xs font-semibold text-green-600 whitespace-nowrap">
            REPARO
          </span>
          <span className="text-xs font-semibold text-red-600 whitespace-nowrap">
            DANO
          </span>
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
  
  // Build text sequence: points + RANK_SPACE (if rank) + UNIQUE (if unique) + name
  const uniqueSymbol = selectedUnit?.isUnique ? UNIQUE_STAR_CHARACTER : ""
  // Only add rank spacing if rank exists and unit has patent/rank (exclude only Gunslinger and Mercenary factions)
  const hasRank = selectedUnit?.rank && selectedUnit?.rank !== "NA" && selectedUnit?.faction !== "Gunslinger" && selectedUnit?.faction !== "Mercenary"

  // Rank space always comes right after points when there's a rank - the rank icon will be printed in this space
  const RANK_SPACING = hasRank ? "     " : ""
  const fullFrontArcText = (selectedUnit?.points?.toString() || '0') + " " + RANK_SPACING + uniqueSymbol + (selectedUnit?.name || 'Unknown')
  const nameRotationAdjust = (((fullFrontArcText.length) * ANGLE_PER_CHARACTER) / 2) * -1
  const nameRotation = (90 + (nameRotationAdjust / 2)) * -1
  const patentRotationAdjust = Number(selectedUnit?.points || 0) < 100 ? (((-90 - nameRotation) * -1) - 8) : (((-90 - nameRotation) * -1) - 11)


  return (
    <>
    {/* Damage Control Interface - Curved arrows around dial */}
    <div className="relative flex justify-center items-center mb-6">
      {/* Position indicator - centered above dial */}
      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 px-5 py-3 bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 shadow-md z-10">
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Posição: {damageClicks + 1}/18
        </span>
      </div>
      
    </div>
    
    {/* Centralized interaction buttons */}
    <div className="flex justify-center items-center gap-6 mt-6">
      {/* Left arrow button - Repair */}
      <button
        onClick={handleRepair}
        disabled={damageClicks <= 0}
        className="group bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 disabled:transform-none disabled:shadow-md z-10"
        style={{
          clipPath: 'polygon(25% 0%, 100% 0%, 75% 50%, 100% 100%, 25% 100%, 0% 50%)',
          width: '60px',
          height: '40px'
        }}
      >
      </button>
      
      {/* Right arrow button - Apply Damage */}
      <button
        onClick={handleDamage}
        disabled={damageClicks >= 17}
        className="group bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 disabled:transform-none disabled:shadow-md z-10"
        style={{
          clipPath: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%)',
          width: '60px',
          height: '40px'
        }}
      >
      </button>
    </div>
    
    {/* Button labels */}
    <div className="flex justify-center items-center gap-6 mt-2">
      <span className="text-xs font-semibold text-green-600 whitespace-nowrap">
        REPARO
      </span>
      <span className="text-xs font-semibold text-red-600 whitespace-nowrap">
        DANO
      </span>
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
          {/* Values - animated group */}
          <Group offsetX={-heatSlideX} opacity={heatSlideOpacity}>
          {/* Movement heat stats */}
          <Rect
            x={281}
            y={124}
            width={23}
            height={22}
            visible={isShutdown ? true : heatClick.movement.collor.hasColor}
            fill={isShutdown ? '#000000' : heatClick.movement.collor.hexValue}
          />
          <Text
            x={250}
            y={250}
            text={isShutdown ? '☢' : (heatClick.movement.value <= 0
              ? String(heatClick.movement.value)
              : `+${String(heatClick.movement.value)}`)}
            fontSize={isShutdown ? 18 : 16}
            fontStyle='bold'
            fill={isShutdown ? '#ffffff' : (heatClick.movement.collor.hasColor && heatClick.movement.collor.hexValue === "#000000" ? "#FFFFFF" : "#000000")}
            rotation={180}
            offsetY={-107}
            offsetX={isShutdown ? 47 : (heatClick.movement.value === 0 ? 47.5 : 51)}
          />
          {/* secondaryDamage heat stats */}
          <Rect
            x={281}
            y={148}
            width={23}
            height={22}
            visible={isShutdown ? true : heatClick.secondaryDamage.collor.hasColor}
            fill={isShutdown ? '#000000' : heatClick.secondaryDamage.collor.hexValue}
          />
          <Text
            x={250}
            y={250}
            text={isShutdown ? '☢' : (heatClick.secondaryDamage.value <= 0
              ? String(heatClick.secondaryDamage.value)
              : `+${String(heatClick.secondaryDamage.value)}`)}
            fontSize={isShutdown ? 18 : 16}
            fontStyle='bold'
            fill={isShutdown ? '#ffffff' : (heatClick.secondaryDamage.collor.hasColor && heatClick.secondaryDamage.collor.hexValue === "#000000" ? "#FFFFFF" : "#000000")}
            rotation={180}
            offsetY={-82.5}
            offsetX={isShutdown ? 47 : (heatClick.secondaryDamage.value === 0 ? 47.5 : 51)}
          />
          {/* primaryDamage heat stats */}
          <Rect
            x={281}
            y={172}
            width={23}
            height={22}
            visible={isShutdown ? true : heatClick.primaryDamage.collor.hasColor}
            fill={isShutdown ? '#000000' : heatClick.primaryDamage.collor.hexValue}
            cornerRadius={[0, 0, 0, 0]}
          />
          <Text
            x={250}
            y={250}
            text={isShutdown ? '☢' : (heatClick.primaryDamage.value <= 0
              ? String(heatClick.primaryDamage.value)
              : `+${String(heatClick.primaryDamage.value)}`)}
            fontSize={isShutdown ? 18 : 16}
            fontStyle='bold'
            fill={isShutdown ? '#ffffff' : (heatClick.primaryDamage.collor.hasColor && heatClick.primaryDamage.collor.hexValue === "#000000" ? "#FFFFFF" : "#000000")}
            rotation={180}
            offsetY={-59.5}
            offsetX={isShutdown ? 47 : (heatClick.primaryDamage.value === 0 ? 47.5 : 51)}
          />
          </Group>
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
          cornerRadius={(() => {
            if (selectedUnit?.combatDial && selectedUnit.combatDial.length > 0) {
              const stepIndex = Math.min(damageClicks, selectedUnit.combatDial.length - 1);
              const currentStep = selectedUnit.combatDial[stepIndex];
              return currentStep?.primaryEquipUsageType === 'single-use' ? 11.5 : [0, 0, 0, 0];
            }
            return [0, 0, 0, 0];
          })()}
          onClick={() => {}}
          opacity={fadeState.primaryAttack.opacity}
          listening={false}
        />
        {/* Secondary Attack stats */}
        {transitionColors.secondaryAttack.hasCollor && (
          <Rect
            x={241}
            y={120}
            width={23}
            height={22}
            fill={transitionColors.secondaryAttack.collorHex}
            cornerRadius={(() => {
              if (selectedUnit?.combatDial && selectedUnit.combatDial.length > 0) {
                const stepIndex = Math.min(damageClicks, selectedUnit.combatDial.length - 1);
                const currentStep = selectedUnit.combatDial[stepIndex];
                return currentStep?.secondaryEquipUsageType === 'single-use' ? 11.5 : [0, 0, 0, 0];
              }
              return [0, 0, 0, 0];
            })()}
            onClick={() => {}}
            style={{ cursor: 'pointer' }}
            opacity={fadeState.secondaryAttack.opacity}
          />
        )}
        {/* Movement stats */}
        <Rect
          x={241}
          y={96}
          width={23}
          height={22}
          visible={transitionColors.movement.hasCollor}
          fill={transitionColors.movement.collorHex}
          cornerRadius={(() => {
            if (selectedUnit?.combatDial && selectedUnit.combatDial.length > 0) {
              const stepIndex = Math.min(damageClicks, selectedUnit.combatDial.length - 1);
              const currentStep = selectedUnit.combatDial[stepIndex];
              return currentStep?.movementEquipUsageType === 'single-use' ? 11.5 : [0, 0, 0, 0];
            }
            return [0, 0, 0, 0];
          })()}
          onClick={() => {}}
          style={{ cursor: 'pointer' }}
          opacity={fadeState.movement.opacity}
        />
        {/* Attack stats */}
        <Rect
          x={241}
          y={72}
          width={23}
          height={22}
          visible={transitionColors.attack.hasCollor}
          fill={transitionColors.attack.collorHex}
          cornerRadius={(() => {
            if (selectedUnit?.combatDial && selectedUnit.combatDial.length > 0) {
              const stepIndex = Math.min(damageClicks, selectedUnit.combatDial.length - 1);
              const currentStep = selectedUnit.combatDial[stepIndex];
              return currentStep?.attackEquipUsageType === 'single-use' ? 11.5 : [0, 0, 0, 0];
            }
            return [0, 0, 0, 0];
          })()}
          onClick={() => {}}
          style={{ cursor: 'pointer' }}
          opacity={fadeState.attack.opacity}
        />
        {/* Defense stats */}
        <Rect
          x={210}
          y={77}
          width={23}
          height={22}
          rotation={-12}
          visible={transitionColors.defense.hasCollor}
          fill={transitionColors.defense.collorHex}
          cornerRadius={(() => {
            if (selectedUnit?.combatDial && selectedUnit.combatDial.length > 0) {
              const stepIndex = Math.min(damageClicks, selectedUnit.combatDial.length - 1);
              const currentStep = selectedUnit.combatDial[stepIndex];
              return currentStep?.defenseEquipUsageType === 'single-use' ? 11.5 : [0, 0, 0, 0];
            }
            return [0, 0, 0, 0];
          })()}
          onClick={() => {}}
          style={{ cursor: 'pointer' }}
          opacity={fadeState.defense.opacity}
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
          opacity={fadeState.primaryAttack.opacity}
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
            opacity={fadeState.secondaryAttack.opacity}
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
          opacity={fadeState.movement.opacity}
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
          opacity={fadeState.attack.opacity}
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
          opacity={fadeState.defense.opacity}
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
        {damageTypes.primaryDamage && (damageTypes.primaryDamage.range.minimum > 0 || damageTypes.primaryDamage.range.maximum > 0 || damageTypes.primaryDamage.type === 'melee') && (
          <Text
            x={DIAL_CENTER_X}
            y={DIAL_CENTER_Y}
            text={`${String(damageTypes.primaryDamage.range.minimum)}/${String(damageTypes.primaryDamage.range.maximum)}`}
            fontSize={16}
            fontStyle='bold'
            fill="#FFFFFF"
            rotation={180}
            offsetX={damageTypes.primaryDamage.type === 'melee' 
              ? MELEE_PADDING + (primaryDamageTargets.length * MELEE_OFFSET) - 3
              : -18 + (primaryDamageTargets.length * -8)
            }
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

    {/* Heat Dial Controls - only shown if unit has heatDial */}
    {maxHeatSteps > 0 && (
      <>
        <div className="flex justify-center items-center gap-8 mt-4">
          {/* Cooldown button - ventilador */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleCooldownWithSpin}
              disabled={heatClicks <= 0}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg hover:shadow-blue-400/50 hover:scale-105 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 disabled:shadow-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`w-8 h-8 text-white transition-transform ${ventSpinning ? 'animate-spin' : ''}`}
                style={{ animationDuration: '0.6s' }}
              >
                <path d="M12 2a1 1 0 0 1 1 1c0 1.5 1.5 2.5 3 2a1 1 0 0 1 .87 1.5C15.5 8 16 10 17.5 10.5a1 1 0 0 1 0 1.93C16 13 15.5 15 16.87 16.5A1 1 0 0 1 16 18c-1.5-.5-3 .5-3 2a1 1 0 0 1-2 0c0-1.5-1.5-2.5-3-2a1 1 0 0 1-.87-1.5C8.5 15 8 13 6.5 12.43a1 1 0 0 1 0-1.93C8 10 8.5 8 7.13 6.5A1 1 0 0 1 8 5c1.5.5 3-.5 3-2a1 1 0 0 1 1-1zm0 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
              </svg>
            </button>
            <span className="text-xs font-semibold text-blue-500">VENTILAÇÃO</span>
          </div>

          {/* Heat position indicator */}
          <div className="px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 border border-orange-300 rounded-xl text-sm font-semibold text-orange-700 shadow-md">
            <span className="flex items-center gap-1">
              🔥 {heatClicks + 1}/{maxHeatSteps}
            </span>
          </div>

          {/* Heat button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => handleHeat(maxHeatSteps)}
              disabled={heatClicks >= maxHeatSteps - 1}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-600 shadow-lg hover:shadow-orange-400/50 hover:scale-105 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 disabled:shadow-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-xs font-semibold text-orange-500">CALOR</span>
          </div>
        </div>

      </>
    )}

    </>
  );
};

interface HeatModifiersTableProps {
  heatDial: HeatDialStep[] | undefined;
  heatClicks: number;
  damageClicks: number;
  combatDial: { movementValue?: number; attackValue?: number; defenseValue?: number; primaryValue?: number; secondaryValue?: number }[] | undefined;
  colorMapping: Record<string, string>;
}

export function HeatModifiersTable({ heatDial, heatClicks, damageClicks, combatDial, colorMapping }: HeatModifiersTableProps) {
  const maxHeatSteps = heatDial ? heatDial.length + 1 : 0;
  if (maxHeatSteps === 0) return null;

  const isShutdown = heatClicks === maxHeatSteps - 1;
  const safeHeatClicks = isShutdown ? (heatDial?.length ?? 1) - 1 : heatClicks;
  const heatStep = heatDial?.[Math.min(safeHeatClicks, (heatDial?.length ?? 1) - 1)];

  const getColor = (id: string | null | undefined) => id ? (colorMapping[id] ?? '#ffffff') : '#ffffff';
  const priColor = getColor(heatStep?.primaryHeatColorMeaningId);
  const secColor = getColor(heatStep?.secondaryHeatColorMeaningId);
  const priAmmoJam = !!heatStep?.primaryHeatColorMeaningId && priColor === '#000000';
  const secAmmoJam = !!heatStep?.secondaryHeatColorMeaningId && secColor === '#000000';

  const stepIndex = combatDial ? Math.min(damageClicks, combatDial.length - 1) : 0;
  const base = combatDial?.[stepIndex];
  if (!base) return null;

  const heatMov = heatStep?.movementHeatValue ?? 0;
  const heatPri = heatStep?.primaryHeatValue ?? 0;
  const heatSec = heatStep?.secondaryHeatValue ?? 0;

  const rows = [
    { label: 'Movimento',       base: base.movementValue ?? 0, mod: heatMov, final: (base.movementValue ?? 0) + heatMov, jam: false,      shutdown: isShutdown },
    { label: 'Ataque',          base: base.attackValue ?? 0,   mod: 0,       final: base.attackValue ?? 0,               jam: false,      shutdown: isShutdown },
    { label: 'Defesa',          base: base.defenseValue ?? 0,  mod: 0,       final: base.defenseValue ?? 0,              jam: false,      shutdown: isShutdown },
    { label: 'Dano Primário',   base: base.primaryValue ?? 0,  mod: heatPri, final: (base.primaryValue ?? 0) + heatPri,  jam: priAmmoJam, shutdown: isShutdown },
    { label: 'Dano Secundário', base: base.secondaryValue ?? 0,mod: heatSec, final: (base.secondaryValue ?? 0) + heatSec,jam: secAmmoJam, shutdown: isShutdown },
  ];

  return (
    <div className="w-full">
      {isShutdown && (
        <div className="flex items-center justify-center gap-1.5 mb-2 py-1 px-2 bg-black rounded">
          <span className="text-white text-sm">☢</span>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Shutdown — Unidade Desligada</span>
          <span className="text-white text-sm">☢</span>
        </div>
      )}
      <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 text-center ${isShutdown ? 'text-black' : 'text-slate-400'}`}>Modificadores de Calor</div>
      <div className="grid grid-cols-5 gap-x-1 text-[10px] text-slate-400 font-semibold uppercase mb-0.5 px-1">
        <span className="col-span-2">Stat</span>
        <span className="text-center">Base</span>
        <span className="text-center">🔥</span>
        <span className="text-center">Final</span>
      </div>
      {rows.map((row) => (
        <div key={row.label} className={`border-t py-0.5 px-1 ${row.shutdown ? 'border-slate-700 bg-black/5' : row.jam ? 'border-slate-100 bg-slate-50' : 'border-slate-100'}`}>
          <div className="grid grid-cols-5 gap-x-1 items-center">
            <span className={`col-span-2 text-[11px] truncate ${row.shutdown ? 'text-slate-500 line-through' : 'text-slate-600'}`}>{row.label}</span>
            <span className="text-center text-[11px] text-slate-400">{row.base}</span>
            <span className={`text-center text-[11px] font-bold ${row.mod > 0 ? 'text-orange-500' : row.mod < 0 ? 'text-blue-500' : 'text-slate-300'}`}>
              {row.mod > 0 ? `+${row.mod}` : row.mod === 0 ? '—' : row.mod}
            </span>
            <span className={`text-center text-[12px] font-bold ${row.mod !== 0 ? 'text-slate-800' : 'text-slate-400'}`}>{row.final}</span>
          </div>
          {row.shutdown && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px]">☢</span>
              <span className="text-[8px] font-black text-black uppercase tracking-tight">Shutdown</span>
            </div>
          )}
          {!row.shutdown && row.jam && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-flex items-center justify-center w-3 h-3 bg-black text-white text-[7px] font-black rounded-sm flex-shrink-0">✕</span>
              <span className="text-[8px] font-black text-black uppercase tracking-tight">Ammunition Jam</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
