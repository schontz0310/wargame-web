/* eslint-disable jsx-a11y/alt-text */
'use client'

import { Stage, Layer, Circle, TextPath, Arc, Line, Image, Text, Rect, RegularPolygon } from 'react-konva';
import elite from '@/images/patent-tree.png';
import veteran from '@/images/patent-two.png';
import green from '@/images/patent-one.png';
import ballisticIcon from '@/images/ballisticDamage.png';
import energeticIcon from '@/images/energeticDamage.png';
import meleeIcon from '@/images/meleeDamage.png';
import bulletIcon from '@/images/bullet.png';
import footIcon from '@/images/foot.png';
import wheeledIcon from '@/images/wheeled.png';
import vtolIcon from '@/images/vtol.png';
import aquaticIcon from '@/images/aquatic.png';
import damageIcon from '@/images/damage.png';
import crosshairIcon from '@/images/crosshair.png';
import defenseIcon from '@/images/defense.png';
import useImage from 'use-image';
import { useSelectedUnit } from '@/hooks/useSelectedUnit';
import { useColorMeanings } from '@/hooks/useColorMeanings';
import { useState, useEffect, useCallback } from 'react';
import { CombatDialStep } from '@/lib/api';

const ANGLE_PER_CHARACTER = 5.2;
const DIAL_WIDTH = 500;
const DIAL_HEIGHT = 500;
const DIAL_CENTER_X = DIAL_WIDTH / 2;
const DIAL_CENTER_Y = DIAL_HEIGHT / 2;

const BALLISTIC_WIDTH = 7;
const ENERGETIC_WIDTH = 7;
const MELEE_WIDTH = 7;
const MELEE_OFFSET = 20;
const MELEE_PADDING = 20;

const getFactionLogoPath = (faction: string | undefined): string => {
  if (!faction) return '/images/logo-dial-default-white.png';
  const slug = faction.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[''`]/g, '').replace(/\s+/g, '-');
  return `/images/logo-dial-${slug}-white.png`;
};

const getExpansionImagePath = (expansion: string | undefined): string => {
  if (!expansion) return '/images/logo-dial-default-white.png';
  const slug = expansion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[''`]/g, '').replace(/\s+/g, '-');
  return `/images/logo-dial-${slug}-white.png`;
};

interface InfantryDialParams {
  unitId: string;
  dialSide?: 'name' | 'stats';
  externalDamageClicks?: number;
  onDamageChange?: (clicks: number) => void;
}

export function InfantryDial({ unitId, dialSide, externalDamageClicks, onDamageChange }: InfantryDialParams) {
  const { getColorById, getTextColorForColor, loading: colorLoading, colorMapping } = useColorMeanings();

  const getPrimaryDamageColor = useCallback((step: CombatDialStep) => {
    if (step.primaryEquipColorMeaningId) {
      const colorHex = getColorById(step.primaryEquipColorMeaningId);
      return { color: colorHex, textColor: getTextColorForColor(colorHex), hasColor: true };
    }
    return { color: '#ffffff', textColor: '#000000', hasColor: false };
  }, [getColorById, getTextColorForColor]);

  const getMovementColor = useCallback((step: CombatDialStep) => {
    if (step.movementEquipColorMeaningId) {
      const colorHex = getColorById(step.movementEquipColorMeaningId);
      return { color: colorHex, textColor: getTextColorForColor(colorHex), hasColor: true };
    }
    return { color: '#ffffff', textColor: '#000000', hasColor: false };
  }, [getColorById, getTextColorForColor]);

  const getAttackColor = useCallback((step: CombatDialStep) => {
    if (step.attackEquipColorMeaningId) {
      const colorHex = getColorById(step.attackEquipColorMeaningId);
      return { color: colorHex, textColor: getTextColorForColor(colorHex), hasColor: true };
    }
    return { color: '#ffffff', textColor: '#000000', hasColor: false };
  }, [getColorById, getTextColorForColor]);

  const getDefenseColor = useCallback((step: CombatDialStep) => {
    if (step.defenseEquipColorMeaningId) {
      const colorHex = getColorById(step.defenseEquipColorMeaningId);
      return { color: colorHex, textColor: getTextColorForColor(colorHex), hasColor: true };
    }
    return { color: '#ffffff', textColor: '#000000', hasColor: false };
  }, [getColorById, getTextColorForColor]);

  const {
    selectedUnit,
    loading,
    error,
    damageClicks: internalDamageClicks,
    handleDamage: internalHandleDamage,
    handleRepair: internalHandleRepair,
  } = useSelectedUnit(unitId);

  const damageClicks = externalDamageClicks ?? internalDamageClicks;
  const handleDamage = onDamageChange ? () => onDamageChange(damageClicks + 1) : internalHandleDamage;
  const handleRepair = onDamageChange ? () => onDamageChange(Math.max(0, damageClicks - 1)) : internalHandleRepair;

  const MAX_INFANTRY_CLICKS = 8;
  const maxDamageClicks = MAX_INFANTRY_CLICKS;

  const calculateDialValues = useCallback((clicks: number) => {
    if (!selectedUnit?.combatDial || selectedUnit.combatDial.length === 0) return null;
    if (clicks >= selectedUnit.combatDial.length) {
      const lastStep = selectedUnit.combatDial[selectedUnit.combatDial.length - 1];
      return {
        movement: lastStep?.movementValue || 0,
        attack: lastStep?.attackValue || 0,
        defense: lastStep?.defenseValue || 0,
        primaryAttack: lastStep?.primaryValue || 0,
        isDeathClick: true,
        deathClickNumber: clicks - selectedUnit.combatDial.length + 1
      };
    }
    const step = selectedUnit.combatDial[clicks];
    if (!step) return null;
    return {
      movement: step.movementValue || 0,
      attack: step.attackValue || 0,
      defense: step.defenseValue || 0,
      primaryAttack: step.primaryValue || 0,
      isDeathClick: false,
    };
  }, [selectedUnit]);

  const [transitionValues, setTransitionValues] = useState({ movement: 0, attack: 0, defense: 0, primaryAttack: 0 });
  const [transitionColors, setTransitionColors] = useState({
    primaryAttack: { hasCollor: false, collorHex: '#ffffff' },
    movement: { hasCollor: false, collorHex: '#ffffff' },
    attack: { hasCollor: false, collorHex: '#ffffff' },
    defense: { hasCollor: false, collorHex: '#ffffff' },
  });
  const [fadeState, setFadeState] = useState({
    primaryAttack: { opacity: 1, isTransitioning: false },
    movement: { opacity: 1, isTransitioning: false },
    attack: { opacity: 1, isTransitioning: false },
    defense: { opacity: 1, isTransitioning: false },
  });

  useEffect(() => {
    if (loading || error || !selectedUnit || colorLoading) return;
    const dialValues = calculateDialValues(damageClicks);
    if (!dialValues) return;

    const stepIndex = Math.min(damageClicks, selectedUnit.combatDial!.length - 1);
    const currentStep = selectedUnit.combatDial![stepIndex];
    if (!currentStep) return;

    const primaryColor = getPrimaryDamageColor(currentStep);
    const movementColor = getMovementColor(currentStep);
    const attackColor = getAttackColor(currentStep);
    const defenseColor = getDefenseColor(currentStep);

    setFadeState(prev => Object.keys(prev).reduce((acc, key) => ({
      ...acc, [key]: { opacity: 0, isTransitioning: true }
    }), {} as typeof prev));

    setTimeout(() => {
      setTransitionValues({
        movement: dialValues.movement,
        attack: dialValues.attack,
        defense: dialValues.defense,
        primaryAttack: dialValues.primaryAttack,
      });
      setTransitionColors({
        primaryAttack: { hasCollor: primaryColor.hasColor, collorHex: primaryColor.color },
        movement: { hasCollor: movementColor.hasColor, collorHex: movementColor.color },
        attack: { hasCollor: attackColor.hasColor, collorHex: attackColor.color },
        defense: { hasCollor: defenseColor.hasColor, collorHex: defenseColor.color },
      });
      setTimeout(() => {
        setFadeState(prev => Object.keys(prev).reduce((acc, key) => ({
          ...acc, [key]: { opacity: 1, isTransitioning: false }
        }), {} as typeof prev));
      }, 50);
    }, 150);
  }, [damageClicks, selectedUnit, calculateDialValues, error, getAttackColor, getDefenseColor, getMovementColor, getPrimaryDamageColor, loading, colorLoading, colorMapping]);

  const [factionImage] = useImage(getFactionLogoPath(selectedUnit?.faction));
  const [expansionImage] = useImage(getExpansionImagePath(selectedUnit?.expansion));
  const [patentElite] = useImage(elite.src);
  const [patentVeteran] = useImage(veteran.src);
  const [patentGreen] = useImage(green.src);
  const [ballisticDamage] = useImage(ballisticIcon.src);
  const [energeticDamage] = useImage(energeticIcon.src);
  const [meleeDamage] = useImage(meleeIcon.src);
  const [bulletImage] = useImage(bulletIcon.src);
  const [footImage] = useImage(footIcon.src);
  const [wheeledImage] = useImage(wheeledIcon.src);
  const [vtolImage] = useImage(vtolIcon.src);
  const [aquaticImage] = useImage(aquaticIcon.src);
  const [damageImage] = useImage(damageIcon.src);
  const [crosshairImage] = useImage(crosshairIcon.src);
  const [defenseImage] = useImage(defenseIcon.src);

  if (loading || colorLoading) return <div>Carregando...</div>;
  if (error || !selectedUnit) return <div>Erro ao carregar unidade</div>;

  const dialValues = calculateDialValues(damageClicks);
  if (!dialValues) return <div>Sem dados de dial</div>;

  const getMarkerColor = (marker: "none" | "black" | "green") =>
    marker === 'black' ? '#000000' : marker === 'green' ? '#00ff00' : '#ffffff';

  const click = {
    marker: (() => {
      if (!selectedUnit.combatDial?.length) return { hasMarker: false, color: '#ffffff' };
      const step = selectedUnit.combatDial[Math.min(damageClicks, selectedUnit.combatDial.length - 1)];
      return { hasMarker: step?.marker !== 'none', color: getMarkerColor(step?.marker ?? 'none') };
    })(),
  };

  const damageType = selectedUnit.attackStats?.[0] ?? null;
  const primaryDamageTargets = damageType ? Array.from({ length: Math.max(damageType.targetCount, 1) }, (_, i) => i + 1) : [];

  const frontArc = parseInt(selectedUnit.frontArc || '0');
  const rearArc = parseInt(selectedUnit.rearArc || '0');
  const frontArcRotate = ((frontArc - 180) * -1) / 2;

  const uniqueSymbol = selectedUnit.isUnique ? "★ " : "";
  const hasRank = selectedUnit.rank && selectedUnit.rank !== "NA" && selectedUnit.faction !== "Gunslinger" && selectedUnit.faction !== "Mercenary";
  const RANK_SPACING = hasRank ? "     " : "";
  const fullFrontArcText = (selectedUnit.points?.toString() || '0') + " " + RANK_SPACING + uniqueSymbol + (selectedUnit.name || 'Unknown');
  const nameRotationAdjust = (((fullFrontArcText.length) * ANGLE_PER_CHARACTER) / 2) * -1;
  const nameRotation = (90 + (nameRotationAdjust / 2)) * -1;
  const patentRotationAdjust = Number(selectedUnit.points || 0) < 100 ? (((-90 - nameRotation) * -1) - 9) : (((-90 - nameRotation) * -1) - 12);

  const dialSlices = Array.from({ length: 12 }, (_, i) => i + 1);
  const isDeathClick = dialValues.isDeathClick;

  return (
    <>
      {/* Position indicator */}
      <div className="relative flex justify-center items-center mb-6">
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 px-5 py-3 bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 shadow-md z-10">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Posição: {damageClicks + 1}/9{isDeathClick ? ` 💀 ×${dialValues.deathClickNumber}` : ''}
          </span>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex justify-center items-center gap-6 mt-6">
        <button
          onClick={handleRepair}
          disabled={damageClicks <= 0}
          className="group bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 disabled:transform-none disabled:shadow-md z-10"
          style={{ clipPath: 'polygon(25% 0%, 100% 0%, 75% 50%, 100% 100%, 25% 100%, 0% 50%)', width: '60px', height: '40px' }}
        />
        <button
          onClick={handleDamage}
          disabled={damageClicks >= maxDamageClicks}
          className="group bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 disabled:transform-none disabled:shadow-md z-10"
          style={{ clipPath: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%)', width: '60px', height: '40px' }}
        />
      </div>
      <div className="flex justify-center items-center gap-6 mt-2">
        <span className="text-xs font-semibold text-green-600 whitespace-nowrap">REPARO</span>
        <span className="text-xs font-semibold text-red-600 whitespace-nowrap">DANO</span>
      </div>

      <Stage width={500} height={500} rotation={dialSide === 'name' ? 0 : 180} x={dialSide === 'name' ? 0 : DIAL_WIDTH} y={dialSide === 'name' ? 0 : DIAL_HEIGHT}>
        {/* Tick marks */}
        <Layer>
          {dialSlices.map((slice) => (
            <Arc key={slice} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} innerRadius={200} outerRadius={214} angle={29} fill="black" rotation={slice * 30} />
          ))}
        </Layer>

        {/* Base circle + arcs */}
        <Layer>
          <Circle x={DIAL_CENTER_X} y={DIAL_CENTER_Y} radius={200} fill="black" stroke="gray" strokeWidth={0.5} />
          <Circle x={DIAL_CENTER_X} y={DIAL_CENTER_Y} radius={4} fill="white" />
          <Arc x={DIAL_CENTER_X} y={DIAL_CENTER_Y} innerRadius={185} outerRadius={190} angle={rearArc} fill="#5b5b5b" rotation={270 - (rearArc / 2)} />
          <Line y={DIAL_CENTER_Y} x={DIAL_CENTER_X} points={[-188, 0, -165, 0]} strokeWidth={4} stroke="#5b5b5b" lineCap="round" rotation={(90 + (rearArc / 2))} />
          <Line y={DIAL_CENTER_Y} x={DIAL_CENTER_X} points={[-188, 0, -165, 0]} strokeWidth={3} stroke="#5b5b5b" lineCap="round" rotation={90 - (rearArc / 2)} />
          <Arc x={DIAL_CENTER_X} y={DIAL_CENTER_Y} innerRadius={186} outerRadius={190} angle={frontArc} fill="white" rotation={frontArcRotate} />
          <Line y={DIAL_CENTER_Y} x={DIAL_CENTER_X} points={[-188, 0, -170, 0]} strokeWidth={3} stroke="white" lineCap="round" rotation={frontArcRotate * -1} />
          <Line y={DIAL_CENTER_Y} x={DIAL_CENTER_X} points={[-188, 0, -170, 0]} strokeWidth={3} stroke="white" lineCap="round" rotation={(frontArcRotate - 180)} />
        </Layer>

        {/* Name arc */}
        <Layer>
          <TextPath text={fullFrontArcText} fontSize={18} fill="#FFFFFF" x={DIAL_CENTER_X} y={DIAL_CENTER_Y} data='M -175 0 A 175 175 0 0 0 175 0' rotation={nameRotation} />
          <TextPath text={String(selectedUnit.collectionNumber || 0).padStart(3, '0')} fontSize={18} fill="#FFFFFF" x={DIAL_CENTER_X} y={DIAL_CENTER_Y} data='M -175 0 A 175 175 0 0 0 175 0' rotation={-193.5} />
        </Layer>

        {/* Faction/expansion logos + rank + movement type */}
        <Layer>
          <Image image={factionImage} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={45} height={45} rotation={-123} offsetX={22} offsetY={-140} />
          <Image image={expansionImage} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={22} height={24} rotation={-97} offsetX={7} offsetY={-162} />
          <Image image={damageImage} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={30} height={30} rotation={-180} offsetX={67} offsetY={-52} />
          <Image image={selectedUnit.speedMode === 'Wheeled' ? wheeledImage : selectedUnit.speedMode === 'VTOL' ? vtolImage : selectedUnit.speedMode === 'Aquatic' ? aquaticImage : footImage} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={30} height={30} rotation={-180} offsetX={67} offsetY={-97} />
          <Image image={crosshairImage} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={30} height={30} rotation={-180} offsetX={67} offsetY={-142} />
          <Image image={defenseImage} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={30} height={30} rotation={-233} offsetX={60} offsetY={-142} />
          {selectedUnit.rank === 'Elite' && <Image image={patentElite} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={15} height={15} rotation={patentRotationAdjust} offsetX={0} offsetY={-166} />}
          {selectedUnit.rank === 'Veteran' && <Image image={patentVeteran} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={15} height={10} rotation={patentRotationAdjust} offsetX={0} offsetY={-168} />}
          {selectedUnit.rank === 'Green' && <Image image={patentGreen} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={15} height={5} rotation={patentRotationAdjust} offsetX={0} offsetY={-170} />}
        </Layer>

        {/* White window background */}
        <Layer>
          <Arc x={DIAL_CENTER_X} y={DIAL_CENTER_Y} innerRadius={134} outerRadius={183} angle={38} fill="#ffffff" rotation={-120} visible />
          <Rect x={226} y={70} width={50} height={137} fill="#ffffff" cornerRadius={[80, 0, 0, 0]} />
        </Layer>

        {/* Color squares */}
        <Layer>
          {/* Primary Attack */}
          <Rect
            x={229} y={161} width={44} height={42}
            visible={transitionColors.primaryAttack.hasCollor && !isDeathClick}
            fill={transitionColors.primaryAttack.collorHex}
            cornerRadius={(() => {
              const step = selectedUnit.combatDial?.[Math.min(damageClicks, (selectedUnit.combatDial?.length ?? 1) - 1)];
              return step?.primaryEquipUsageType === 'single-use' ? 23 : [0, 0, 0, 0];
            })()}
            opacity={fadeState.primaryAttack.opacity}
            listening={false}
          />
          {/* Movement */}
          <Rect
            x={229} y={117} width={44} height={42}
            visible={transitionColors.movement.hasCollor && !isDeathClick}
            fill={transitionColors.movement.collorHex}
            cornerRadius={(() => {
              const step = selectedUnit.combatDial?.[Math.min(damageClicks, (selectedUnit.combatDial?.length ?? 1) - 1)];
              return step?.movementEquipUsageType === 'single-use' ? 23 : [0, 0, 0, 0];
            })()}
            opacity={fadeState.movement.opacity}
          />
          {/* Attack */}
          <Rect
            x={229} y={73} width={44} height={42}
            visible={transitionColors.attack.hasCollor && !isDeathClick}
            fill={transitionColors.attack.collorHex}
            cornerRadius={(() => {
              const step = selectedUnit.combatDial?.[Math.min(damageClicks, (selectedUnit.combatDial?.length ?? 1) - 1)];
              return step?.attackEquipUsageType === 'single-use' ? 23 : [0, 0, 0, 0];
            })()}
            opacity={fadeState.attack.opacity}
          />
          {/* Defense */}
          <Rect
            x={168} y={91} width={44} height={42} rotation={-23}
            visible={transitionColors.defense.hasCollor && !isDeathClick}
            fill={transitionColors.defense.collorHex}
            cornerRadius={(() => {
              const step = selectedUnit.combatDial?.[Math.min(damageClicks, (selectedUnit.combatDial?.length ?? 1) - 1)];
              return step?.defenseEquipUsageType === 'single-use' ? 23 : [0, 0, 0, 0];
            })()}
            opacity={fadeState.defense.opacity}
          />
        </Layer>

        {/* Values */}
        <Layer>
          {/* Primary Attack */}
          {isDeathClick ? (
            <>
              <Rect x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={24} height={32} fill="#ffffff" rotation={180} offsetY={-55} offsetX={12} opacity={fadeState.primaryAttack.opacity} listening={false} />
              <Image image={bulletImage} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={20} height={22} rotation={180} offsetY={-55} offsetX={10} opacity={fadeState.primaryAttack.opacity} />
            </>
          ) : (
            <Text
              x={DIAL_CENTER_X} y={DIAL_CENTER_Y}
              text={String(transitionValues.primaryAttack)}
              fontSize={32} fontStyle='bold'
              fill={transitionColors.primaryAttack.hasCollor && transitionColors.primaryAttack.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
              rotation={180} 
              offsetY={-55}
              offsetX={transitionValues.primaryAttack > 9 ? 19 : 10}
              opacity={fadeState.primaryAttack.opacity}
            />
          )}
          {/* Movement */}
          {isDeathClick ? (
            <>
              <Rect x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={24} height={32} fill="#ffffff" rotation={180} offsetY={-99} offsetX={12} opacity={fadeState.movement.opacity} listening={false} />
              <Image image={bulletImage} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={20} height={22} rotation={180} offsetY={-99} offsetX={10} opacity={fadeState.movement.opacity} />
            </>
          ) : (
            <Text
              x={DIAL_CENTER_X} y={DIAL_CENTER_Y}
              text={String(transitionValues.movement)}
              fontSize={32} fontStyle='bold'
              fill={transitionColors.movement.hasCollor && transitionColors.movement.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
              rotation={180} offsetY={-99}
              offsetX={transitionValues.movement > 9 ? 19 : 10}
              opacity={fadeState.movement.opacity}
            />
          )}
          {/* Attack */}
          {isDeathClick ? (
            <>
              <Rect x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={24} height={32} fill="#ffffff" rotation={180} offsetY={-143} offsetX={12} opacity={fadeState.attack.opacity} listening={false} />
              <Image image={bulletImage} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={20} height={22} rotation={180} offsetY={-143} offsetX={10} opacity={fadeState.attack.opacity} />
            </>
          ) : (
            <Text
              x={DIAL_CENTER_X} y={DIAL_CENTER_Y}
              text={String(transitionValues.attack)}
              fontSize={32} fontStyle='bold'
              fill={transitionColors.attack.hasCollor && transitionColors.attack.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
              rotation={180} offsetY={-143}
              offsetX={transitionValues.attack > 9 ? 19 : 10}
              opacity={fadeState.attack.opacity}
            />
          )}
          {/* Defense */}
          {isDeathClick ? (
            <>
              <Rect x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={24} height={32} fill="#ffffff" rotation={160} offsetY={-145.5} offsetX={12} opacity={fadeState.defense.opacity} listening={false} />
              <Image image={bulletImage} x={DIAL_CENTER_X} y={DIAL_CENTER_Y} width={20} height={22} rotation={160} offsetY={-145.5} offsetX={10} opacity={fadeState.defense.opacity} />
            </>
          ) : (
            <Text
              x={DIAL_CENTER_X} y={DIAL_CENTER_Y}
              text={String(transitionValues.defense)}
              fontSize={32} fontStyle='bold'
              fill={transitionColors.defense.hasCollor && transitionColors.defense.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
              rotation={160} offsetY={-145.5}
              offsetX={transitionValues.defense > 9 ? 19 : 10}
              opacity={fadeState.defense.opacity}
            />
          )}
          {/* Marker */}
          {click.marker?.hasMarker && (
            <RegularPolygon x={DIAL_CENTER_X} y={DIAL_CENTER_Y} sides={3} radius={8} fill={click.marker?.color} rotation={170} offsetY={-178} offsetX={1} scaleX={2.5} />
          )}
        </Layer>

        {/* Primary Damage icons + range */}
        <Layer>
          {damageType && primaryDamageTargets.map((slice) => (
            <Image
              key={slice}
              image={damageType.damageType === 'ballistic' ? ballisticDamage : damageType.damageType === 'energetic' ? energeticDamage : meleeDamage}
              x={DIAL_CENTER_X} y={DIAL_CENTER_Y}
              width={damageType.damageType === 'ballistic' ? BALLISTIC_WIDTH : damageType.damageType === 'energetic' ? ENERGETIC_WIDTH : MELEE_WIDTH}
              height={30} rotation={180}
              offsetX={damageType.damageType === 'melee' ? MELEE_PADDING + ((slice - 1) * MELEE_OFFSET) : -25 + (slice * -10)}
              offsetY={-50}
            />
          ))}
          {damageType && (damageType.minRange > 0 || damageType.maxRange > 0 || damageType.damageType === 'melee') && (
            <Text
              x={DIAL_CENTER_X} y={DIAL_CENTER_Y}
              text={`${damageType.minRange}/${damageType.maxRange}`}
              fontSize={20} fontStyle='bold' fill="#FFFFFF" rotation={180}
              offsetX={damageType.damageType === 'melee' ? MELEE_PADDING + (primaryDamageTargets.length * MELEE_OFFSET) - 3 : -40 + (primaryDamageTargets.length * -10)}
              offsetY={-55}
            />
          )}
        </Layer>
      </Stage>
    </>
  );
}
