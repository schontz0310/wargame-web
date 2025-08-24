/* eslint-disable jsx-a11y/alt-text */
'use client'

import { Stage, Layer, Circle, TextPath, Arc, Line, Image, Text, Rect, RegularPolygon, Group } from 'react-konva';
import elite from '@/images/patent-tree.png';
import veteran from '@/images/patent-two.png'
import green from '@/images/patent-one.png'
import vent from '@/images/vent.png';
import ballisticIcon from '@/images/ballisticDamage.png'
import energeticIcon from '@/images/energeticDamage.png'
import meleeIcon from '@/images/meleeDamage.png'
import mechSpeedIcon from '@/images/mechSpeed.png'

import useImage from 'use-image'

const ANGLE_PER_CHARACTER = 4.5;
const UNIQUE_STAR_CHARACTER = "★";

// Function to convert faction name to image path following the pattern: logo-dial-<faction-with-dashes>-white.png
const getFactionLogoPath = (faction: string): string => {
  const factionSlug = faction
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
    .replace(/[''`]/g, '') // Remove apostrophes and similar characters
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
  const path = `/images/logo-dial-${factionSlug}-white.png`;
  console.log(`Faction: "${faction}" -> Slug: "${factionSlug}" -> Path: "${path}"`);
  return path;
};

// Function to convert expansion abbreviation to image path following the pattern: logo-dial-<expansion>-white.png
const getExpansionImagePath = (expansion: string): string => {
  const expansionSlug = expansion
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
    .replace(/[''`]/g, '') // Remove apostrophes and similar characters
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
  const path = `/images/logo-dial-${expansionSlug}-white.png`;
  console.log(`Expansion: "${expansion}" -> Slug: "${expansionSlug}" -> Path: "${path}"`);
  return path;
};

const BALLISTIC_WIDTH = 4.5;
const BALLISTIC_OFFSET = -8;
const BALLISTIC_PADDING = -13

const ENERGETIC_WIDTH = 5.5;
const ENERGETIC_OFFSET = -8;
const ENERGETIC_PADDING = -13

const MELEE_WIDTH = 16.5;
const MELEE_OFFSET = -16;
const MELEE_PADDING = -15;

interface HeatStat {
  value: number,
  collor: {
    hasColor: boolean,
    hexValue: string
  }
}

interface DamageStats {
  type: string,
  targets: number,
  range: {
    minimum: number,
    maximum: number
  }
}

interface ClickValues {
  primaryAttack: number,
  secondaryAttack?: number,
  tertiaryAttack?: number,
  movement: number,
  attack: number,
  defense: number
}

interface ClickColors {
  hasCollor: boolean,
  collorHex?: string,
  singleUse?: boolean,
}

interface DialParams {
  dialSide: 'name' | 'stats'
  damageTypes: {
    primaryDamage: DamageStats,
    secondaryDamage: DamageStats
  }
  name: string,
  points: string,
  variant: string,
  unique: boolean,
  frontArc: number,
  rearArc: number,
  ventRating: number,
  rank: "Elite" | "Green" | "Veteran" | "NA",
  faction: string,
  expansion: string,
  collectionNumber: number,
  dialRotation?: number,
  click: {
    marker: {
      hasMarker: boolean,
      markerColor?: string
    }
    values: ClickValues,
    colors: {
      primaryAttack: ClickColors,
      secondaryAttack?: ClickColors,
      tertiaryAttack?: ClickColors,
      movement: ClickColors,
      attack: ClickColors,
      defense: ClickColors
    }
  }
  heatClick: {
    primaryDamage: HeatStat
    secondaryDamage: HeatStat
    movement: HeatStat
  }
}


export function AppDial(dialParams: DialParams) {
  // Use external rotation if provided, otherwise use internal state
  const currentRotation = dialParams.dialRotation ?? 0;
  
  const dialSlices = Array.from({ length: 12 }, (_, index) => index + 1);
  const primaryDamageTargets = Array.from({ length: dialParams.damageTypes.primaryDamage.targets }, (_, index) => index + 1);
  const secondaryDamageTargets = Array.from({ length: dialParams.damageTypes.secondaryDamage.targets }, (_, index) => index + 1);
  const frontArcRotate = ((dialParams.frontArc - 180) * -1) / 2
  // Build text sequence: points + unique + name (rank shown as image)
  const uniqueSymbol = dialParams.unique ? " " + UNIQUE_STAR_CHARACTER : ""
  // Only add rank spacing if rank exists, otherwise use minimal spacing
  const RANK_SPACING = dialParams.rank !== "NA" ? "     " : ""
  const fullFrontArcText = dialParams.points + RANK_SPACING + uniqueSymbol + " " + dialParams.name 
  const nameRotationAdjust = (((fullFrontArcText.length) * ANGLE_PER_CHARACTER) / 2) * -1
  const nameRotation = (90 + (nameRotationAdjust / 2)) * -1
  const patentRotationAdjust = Number(dialParams.points) < 100 ? (((-90 - nameRotation) * -1) - 8) : (((-90 - nameRotation) * -1) - 11)


  const [ventLogo] = useImage(vent.src, 'anonymous');
  const [ballisticDamage] = useImage(ballisticIcon.src, 'anonymous');
  const [energeticDamage] = useImage(energeticIcon.src, 'anonymous');
  const [meleeDamage] = useImage(meleeIcon.src, 'anonymous');
  const [mechMovement] = useImage(mechSpeedIcon.src, 'anonymous');
  const [factionImage] = useImage(getFactionLogoPath(dialParams.faction), 'anonymous');
  

  const [patentGreen] = useImage(green.src, 'anonymous');
  const [patentVeteran] = useImage(veteran.src, 'anonymous');
  const [patentElite] = useImage(elite.src, 'anonymous');

  const [expansionImage] = useImage(getExpansionImagePath(dialParams.expansion), 'anonymous')

  return (
      <>
      <Stage width={500} height={500} rotation={dialParams.dialSide === 'name' ? 0 : 180} x={dialParams.dialSide === 'name' ? 0 : 500} y={dialParams.dialSide === 'name' ? 0 : 500}>
      {/* Main dial layer - STATIC (no rotation) */}
      <Layer>
        {dialSlices.map((slice) => (
          <Arc
            x={250}
            y={250}
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
          x={250}
          y={250}
          radius={200}
          fill="black"
          stroke="gray"
          strokeWidth={0.5}
        />
        <Circle
          x={250}
          y={250}
          radius={4}
          fill="white"
        />
        <Arc
          x={250}
          y={250}
          innerRadius={185}
          outerRadius={190}
          angle={dialParams.rearArc}
          fill="#5b5b5b"
          rotation={270 - (dialParams.rearArc / 2)}
        />
        <Line
          y={250}
          x={250}
          points={[-188, 0, -165, 0]}
          strokeWidth={4}
          stroke="#5b5b5b"
          lineCap="round"
          rotation={(90 + (dialParams.rearArc / 2))} 
        />
        <Line
          y={250}
          x={250}
          points={[-188, 0, -165, 0]}
          strokeWidth={3}
          stroke="#5b5b5b"
          lineCap="round"
          rotation={90 - (dialParams.rearArc / 2)} 
        />
        <Arc
          x={250}
          y={250}
          innerRadius={186}
          outerRadius={190}
          angle={dialParams.frontArc}
          fill="white"
          rotation={frontArcRotate} 
        />
        <Line
          y={250}
          x={250}
          points={[-188, 0, -170, 0]}
          strokeWidth={3}
          stroke="white"
          lineCap="round"
          rotation={frontArcRotate * -1} 
        />
        <Line
          y={250}
          x={250}
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
          x={250}
          y={250}
          data='M -175 0 A 175 175 0 0 0 175 0'
          rotation={nameRotation}
          onClick={() => console.log('clicou')} />
        <TextPath
          text={String(dialParams.collectionNumber).padStart(3, '0')}
          fontSize={16}
          fill={"#FFFFFF"}
          x={250}
          y={250}
          data='M -175 0 A 175 175 0 0 0 175 0'
          rotation={-200.5} />
        <TextPath
          text={dialParams.variant}
          fontSize={16}
          fill={"#FFFFFF"}
          x={250}
          y={250}
          data='M -175 0 A 175 175 0 0 0 175 0'
          rotation={42} />
      </Layer>
      <Layer>
        <Image
          image={factionImage}
          x={250}
          y={250}
          width={30}
          height={30}
          rotation={-127}
          offsetX={17}
          offsetY={-152}
        />
        <Image
          image={expansionImage}
          x={250}
          y={250}
          width={30}
          height={30}
          rotation={-104}
          offsetX={17}
          offsetY={-152}
        />
        {dialParams.rank === 'Elite' && 
          <Image
          image={patentElite}
          x={250}
          y={250}
          width={15}
          height={15}
          rotation={patentRotationAdjust}
          offsetX={0}
          offsetY={-166}
        />
        }
        {dialParams.rank === 'Veteran' && 
          <Image
          image={patentVeteran}
          x={250}
          y={250}
          width={15}
          height={10}
          rotation={patentRotationAdjust}
          offsetX={0}
          offsetY={-168}
        />
        }
        {dialParams.rank === 'Green' && 
          <Image
          image={patentGreen}
          x={250}
          y={250}
          width={15}
          height={5}
          rotation={patentRotationAdjust}
          offsetX={0}
          offsetY={-170}
        />
        }
        <Image
          image={ventLogo}
          x={250}
          y={250}
          width={30}
          height={20}
          rotation={180}
          offsetX={18}
          offsetY={-57}
        />
        <Text
          x={250}
          y={250}
          text={String(dialParams.ventRating)}
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
          x={250}
          y={250}
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
            x={285}
            y={20.5}
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
            visible={dialParams.heatClick.movement.collor.hasColor}
            fill={dialParams.heatClick.movement.collor.hexValue}
          />
          <Text
            x={250}
            y={250}
            text={dialParams.heatClick.movement.value <= 0
              ? String(dialParams.heatClick.movement.value)
              : `+${String(dialParams.heatClick.movement.value)}`
            }
            fontSize={16}
            fontStyle='bold'
            fill={dialParams.heatClick.movement.collor.hasColor && dialParams.heatClick.movement.collor.hexValue === "#000000" ? "#FFFFFF" : "#000000"}
            rotation={180}
            offsetY={-108}
            offsetX={dialParams.heatClick.movement.value === 0 ? 47.5 : 51} 
          />
          {/* secondaryDamage heat stats */}
          <Rect
            x={281}
            y={148}
            width={23}
            height={22}
            visible={dialParams.heatClick.secondaryDamage.collor.hasColor}
            fill={dialParams.heatClick.secondaryDamage.collor.hexValue}
          />
          <Text
            x={250}
            y={250}
            text={dialParams.heatClick.secondaryDamage.value <= 0
              ? String(dialParams.heatClick.secondaryDamage.value)
              : `+${String(dialParams.heatClick.secondaryDamage.value)}`
            }
            fontSize={16}
            fontStyle='bold'
            fill={dialParams.heatClick.secondaryDamage.collor.hasColor && dialParams.heatClick.secondaryDamage.collor.hexValue === "#000000" ? "#FFFFFF" : "#000000"}
            rotation={180}
            offsetY={-85}
            offsetX={dialParams.heatClick.secondaryDamage.value === 0 ? 47.5 : 51} 
          />
          {/* primaryDamage heat stats */}
          <Rect
            x={281}
            y={172}
            width={23}
            height={22}
            visible={dialParams.heatClick.primaryDamage.collor.hasColor}
            fill={dialParams.heatClick.primaryDamage.collor.hexValue}
            cornerRadius={dialParams.click.colors.primaryAttack.singleUse === true ? [14, 14, 14, 14] : [0, 0, 0, 0]}
          />
          <Text
            x={250}
            y={250}
            text={dialParams.heatClick.primaryDamage.value <= 0
              ? String(dialParams.heatClick.primaryDamage.value)
              : `+${String(dialParams.heatClick.primaryDamage.value)}`
            }
            fontSize={16}
            fontStyle='bold'
            fill={dialParams.heatClick.primaryDamage.collor.hasColor && dialParams.heatClick.primaryDamage.collor.hexValue === "#000000" ? "#FFFFFF" : "#000000"}
            rotation={180}
            offsetY={-60}
            offsetX={dialParams.heatClick.primaryDamage.value === 0 ? 47.5 : 51} 
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
          visible={dialParams.click.colors.primaryAttack.hasCollor}
          fill={dialParams.click.colors.primaryAttack.collorHex}
          cornerRadius={dialParams.click.colors.primaryAttack.singleUse === true ? [14, 14, 14, 14] : [0, 0, 0, 0]}
          onClick={() => {}}
          style={{ cursor: 'pointer' }}
        />
        {/* Secondary Attack stats */}
        {dialParams.click.values.secondaryAttack && (
          <Rect
            x={241}
            y={120}
            width={23}
            height={22}
            fill={dialParams.click.colors.secondaryAttack?.collorHex}
            cornerRadius={dialParams.click.colors.secondaryAttack?.singleUse === true ? [14, 14, 14, 14] : [0, 0, 0, 0]}
            visible={dialParams.click.colors.secondaryAttack?.hasCollor}
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
          visible={dialParams.click.colors.movement.hasCollor}
          fill={dialParams.click.colors.movement.collorHex}
          cornerRadius={dialParams.click.colors.movement.singleUse === true ? [14, 14, 14, 14] : [0, 0, 0, 0]}
          onClick={() => {}}
          style={{ cursor: 'pointer' }}
        />
        {/* Attack stats */}
        <Rect
          x={241}
          y={72}
          width={23}
          height={22}
          visible={dialParams.click.colors.attack.hasCollor}
          fill={dialParams.click.colors.attack.collorHex}
          cornerRadius={dialParams.click.colors.attack.singleUse === true ? [14, 14, 14, 14] : [0, 0, 0, 0]}
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
          visible={dialParams.click.colors.defense.hasCollor}
          fill={dialParams.click.colors.defense.collorHex}
          cornerRadius={dialParams.click.colors.defense.singleUse === true ? [14, 14, 14, 14] : [0, 0, 0, 0]}
          onClick={() => {}}
          style={{ cursor: 'pointer' }}
        />
      </Layer>
      {/* Rotating stats numbers layer */}
      <Layer>
        <Text
          x={250}
          y={250}
          text={String(dialParams.click.values.primaryAttack)}
          fontSize={16}
          fontStyle='bold'
          fill={dialParams.click.colors.primaryAttack.hasCollor && dialParams.click.colors.primaryAttack.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
          rotation={180 + currentRotation}
          offsetY={-88}
          offsetX={dialParams.click.values.primaryAttack > 9 ? 11.5 : 6.5} 
        />
        {/* Secondary Attack stats */}
        {dialParams.click.values.secondaryAttack && (
          <Text
            x={250}
            y={250}
            text={String(dialParams.click.values.secondaryAttack)}
            fontSize={16}
            fontStyle='bold'
            fill={dialParams.click.colors.secondaryAttack?.hasCollor && dialParams.click.colors.secondaryAttack?.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
            rotation={180 + currentRotation}
            offsetY={-113}
            offsetX={dialParams.click.values.secondaryAttack > 9 ? 11.5 : 6.5} 
          />
        )}
        {/* Movement stats */}
        <Text
          x={250}
          y={250}
          text={String(dialParams.click.values.movement)}
          fontSize={16}
          fontStyle='bold'
          fill={dialParams.click.colors.movement.hasCollor && dialParams.click.colors.movement.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
          rotation={180 + currentRotation}
          offsetY={-136}
          offsetX={dialParams.click.values.movement > 9 ? 11.5 : 6.5} 
        />
        {/* Attack stats */}
        <Text
          x={250}
          y={250}
          text={String(dialParams.click.values.attack)}
          fontSize={16}
          fontStyle='bold'
          fill={dialParams.click.colors.attack.hasCollor && dialParams.click.colors.attack.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
          rotation={180 + currentRotation}
          offsetY={-160}
          offsetX={dialParams.click.values.attack > 9 ? 11.5 : 6.5} 
        />
        {/* Defense stats */}
        <Text
          x={250}
          y={250}
          text={String(dialParams.click.values.defense)}
          fontSize={16}
          fontStyle='bold'
          fill={dialParams.click.colors.defense.hasCollor && dialParams.click.colors.defense.collorHex === "#000000" ? "#FFFFFF" : "#000000"}
          rotation={170 + currentRotation}
          offsetY={-160.5}
          offsetX={dialParams.click.values.defense > 9 ? 11.5 : 7} 
        />
        {/* Marker */}
        {dialParams.click.marker.hasMarker && (
          <RegularPolygon
            x={250}
            y={250}
            sides={3}
            radius={6}
            fill={dialParams.click.marker.markerColor}
            rotation={175}
            offsetY={-180}
            offsetX={1}
            scaleX={2.5}
          />
        )}
      </Layer>
      <Layer>
        {/* Primary Damage targets and range */}
        {primaryDamageTargets.map((slice) => (
          <Image
            key={slice}
            image={dialParams.damageTypes.primaryDamage.type === 'ballistic'
              ? ballisticDamage
              : dialParams.damageTypes.primaryDamage.type === 'energetic'
                ? energeticDamage
                : meleeDamage}
            x={250}
            y={250}
            width={dialParams.damageTypes.primaryDamage.type === 'ballistic'
              ? BALLISTIC_WIDTH
              : dialParams.damageTypes.primaryDamage.type === 'energetic'
                ? ENERGETIC_WIDTH
                : MELEE_WIDTH
            }
            height={20}
            rotation={180}
            offsetX={dialParams.damageTypes.primaryDamage.type === 'melee'
                ? MELEE_PADDING + ((slice - 1) * MELEE_OFFSET)
                : -8 + (slice * -8)
            }
            offsetY={-84}
          />  
        ))}
        <Text
          x={250}
          y={250}
          text={`${String(dialParams.damageTypes.primaryDamage.range.minimum)}/${String(dialParams.damageTypes.primaryDamage.range.maximum)}`}
          fontSize={16}
          fill={"#FFFFFF"}
          rotation={180}
          offsetY={-86}
          offsetX={dialParams.damageTypes.primaryDamage.type === 'ballistic'
            ? (BALLISTIC_OFFSET * dialParams.damageTypes.primaryDamage.targets) + BALLISTIC_PADDING + (BALLISTIC_WIDTH * -1) 
            : dialParams.damageTypes.primaryDamage.type === 'energetic'
              ? (ENERGETIC_OFFSET * dialParams.damageTypes.primaryDamage.targets) + ENERGETIC_PADDING + (ENERGETIC_WIDTH * -1)
              : -4 + (MELEE_OFFSET * (dialParams.damageTypes.primaryDamage.targets - 1)) + MELEE_PADDING + (MELEE_WIDTH * -1)
          } 
        />
        {/* Secondary Damage targets and range */}
        {secondaryDamageTargets.map((slice) => (
          <Image
            key={slice}
            image={dialParams.damageTypes.secondaryDamage.type === 'ballistic'
              ? ballisticDamage
              : dialParams.damageTypes.secondaryDamage.type === 'energetic'
                ? energeticDamage
                : meleeDamage}
            x={250}
            y={250}
            width={dialParams.damageTypes.secondaryDamage.type === 'ballistic'
              ? BALLISTIC_WIDTH
              : dialParams.damageTypes.secondaryDamage.type === 'energetic'
                ? ENERGETIC_WIDTH
                : MELEE_WIDTH
            }
            height={20}
            rotation={180}
            offsetX={dialParams.damageTypes.secondaryDamage.type === 'melee'
              ? MELEE_PADDING + ((slice - 1) * MELEE_OFFSET)
              : -8 + (slice * -8)
            }
            offsetY={-110}
          />  
        ))}
        <Text
          x={250}
          y={250}
          text={`${String(dialParams.damageTypes.secondaryDamage.range.minimum)}/${String(dialParams.damageTypes.secondaryDamage.range.maximum)}`}
          fontSize={16}
          fill={"#FFFFFF"}
          rotation={180}
          offsetY={-112}
          offsetX={dialParams.damageTypes.secondaryDamage.type === 'ballistic'
            ? (BALLISTIC_OFFSET * dialParams.damageTypes.secondaryDamage.targets) + BALLISTIC_PADDING + (BALLISTIC_WIDTH * -1) 
            : dialParams.damageTypes.secondaryDamage.type === 'energetic'
              ? (ENERGETIC_OFFSET * dialParams.damageTypes.secondaryDamage.targets) + ENERGETIC_PADDING + (ENERGETIC_WIDTH * -1)
              :  -4 + (MELEE_OFFSET * (dialParams.damageTypes.secondaryDamage.targets - 1)) + MELEE_PADDING + (MELEE_WIDTH * -1)
          } 
        />
        {/* Movement Symbol */}
        <Image
          image={mechMovement}
          x={250}
          y={250}
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

