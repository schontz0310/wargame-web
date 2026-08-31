/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Unit, Draft, DraftSettings, DraftUnitWithQuantity, DraftCardWithQuantity, DraftResult, DraftUnit, apiService, Card, IPilot, IGear, pilotPointsLabel } from '@/lib/api'
import { safeLocalStorage } from '@/lib/storage'
import { useT } from '@/hooks/useT'

// A unit's mech code (e.g. "AOD113") is the basename of its imageUrl, and matches
// a pilot's preferredMechId 1:1 — used to auto-pair a unique unit with its pilot.
function mechCodeFromImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null
  const match = imageUrl.match(/([^/]+)\.[a-zA-Z0-9]+$/)
  return match ? match[1] : null
}

function pilotToCard(pilot: IPilot): Card {
  return {
    id: pilot.cardId,
    dbId: pilot.id,
    name: pilot.name,
    type: 'P',
    typeName: 'Pilot',
    cost: pilot.points,
    faction: pilot.factionLeft || pilot.factionRight || '',
    factionLeft: pilot.factionLeft ?? undefined,
    factionRight: pilot.factionRight ?? undefined,
    class: pilot.class,
    rarity: 'Common',
    expansion: pilot.expansion,
    collectionNumber: pilot.collectionNumber,
    imageUrl: pilot.imageUrl || '',
    description: pilot.description || '',
    isUnique: pilot.isUnique,
    cardModel: 'single',
  }
}

export default function DraftsPage() {
  const router = useRouter()
  const t = useT()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [mechDetailsById, setMechDetailsById] = useState<Map<string, Unit>>(new Map())
  const [isCreating, setIsCreating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newDraftName, setNewDraftName] = useState('')
  const [newDraftDescription, setNewDraftDescription] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null)
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([])
  const [selectedUnits, setSelectedUnits] = useState<DraftUnitWithQuantity[]>([])
  const [showUnitSelector, setShowUnitSelector] = useState(false)
  const [collectionUnits, setCollectionUnits] = useState<Unit[]>([])
  const [rawHaveCollection, setRawHaveCollection] = useState<{ id: string; quantity: number }[]>([])
  const [useCollectionAsSource, setUseCollectionAsSource] = useState(false)
  const [availableCards, setAvailableCards] = useState<Card[]>([])
  const [pilotsByMechCode, setPilotsByMechCode] = useState<Map<string, IPilot>>(new Map())
  const [pilotsById, setPilotsById] = useState<Map<string, IPilot>>(new Map())
  const [availablePilotCards, setAvailablePilotCards] = useState<Card[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configMessage, setConfigMessage] = useState('')
  const [configSuccess, setConfigSuccess] = useState(false)
  const [isDrafting, setIsDrafting] = useState(false)
  const [currentBooster, setCurrentBooster] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [draftAnimation, setDraftAnimation] = useState<{unit: Unit, player: number} | null>(null)
  const [unitFilters, setUnitFilters] = useState({
    factions: [] as string[],
    expansions: [] as string[],
    type: '',
    minPoints: '',
    maxPoints: '',
    search: ''
  })
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null)
  const [showArmyUnitSelector, setShowArmyUnitSelector] = useState(false)
  const [draftSettings, setDraftSettings] = useState<DraftSettings>({
    numberOfPlayers: 2,
    boostersPerPlayer: 3,
    boosterConfigs: [
      { unitType: 'Infantry', quantity: 3 },
      { unitType: 'Vehicle', quantity: 1 },
      { unitType: 'Mech', quantity: 1 },
      { unitType: 'Card', quantity: 1 }
    ],
    useCollection: false,
    respectFilters: false,
    armyPointLimit: 300
  })
  const [isClient, setIsClient] = useState(false)

  // Set client-side flag
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load drafts from localStorage on mount (client-side only)
  useEffect(() => {
    if (!isClient) return;
    
    try {
      const savedDrafts = safeLocalStorage.getItem('myDrafts')
      if (savedDrafts) {
        const parsedDrafts = (JSON.parse(savedDrafts) as any[]).filter((d: any) => !d.id?.startsWith('std-'))
        // Migrate old drafts without availableUnits, new army fields, per-copy instanceIds,
        // and the older separate pilot/gear attachment fields (now unified into 2 CEC slots)
        const withInstanceId = (u: DraftUnit): DraftUnit => {
          const withId: any = u.instanceId ? u : { ...u, instanceId: crypto.randomUUID() }
          if (withId.attachedInstanceIds) return withId
          const legacySlots = [withId.attachedPilotInstanceId, ...(withId.attachedGearInstanceIds || [])].filter(Boolean)
          if (legacySlots.length === 0) return withId
          const { attachedPilotInstanceId, attachedGearInstanceIds, ...rest } = withId
          return { ...rest, attachedInstanceIds: legacySlots.slice(0, 2) }
        }
        const migratedDrafts = parsedDrafts.map((draft: any) => ({
          ...draft,
          availableUnits: draft.availableUnits || [],
          results: draft.results.map((result: any) => ({
            ...result,
            units: (result.units || []).map(withInstanceId),
            armyUnits: (result.armyUnits || []).map(withInstanceId),
            armyPoints: result.armyPoints || 0
          }))
        }))
        setDrafts(migratedDrafts)
        
        // Select first draft if available
        if (migratedDrafts.length > 0) {
          setSelectedDraft(migratedDrafts[0])
        }
      }

      // Load collection units from localStorage (client-side only). "My collection" only
      // stores a sparse {id, quantity} — the full unit record (isUnique, imageUrl, class,
      // etc.) is filled in later once the API's unit list is loaded, see the effect below.
      const savedHaveCollection = safeLocalStorage.getItem('myHaveCollection')
      if (savedHaveCollection) {
        setRawHaveCollection(JSON.parse(savedHaveCollection))
      }
    } catch (error) {
      console.error('Error loading drafts:', error)
    }
  }, [isClient])

  // Expand the collection's sparse {id, quantity} entries into full Unit records by matching
  // against the API's unit list — a stored collection entry never carried isUnique/imageUrl/
  // class, so without this a unique mech from the collection could never be paired with its
  // pilot during a draft (isUnique would silently read as false).
  useEffect(() => {
    if (rawHaveCollection.length === 0 || availableUnits.length === 0) return
    const byId = new Map(availableUnits.map(u => [u.id, u]))
    const unitsFromCollection: Unit[] = []
    rawHaveCollection.forEach((entry: any) => {
      const full = byId.get(entry.id)
      for (let i = 0; i < entry.quantity; i++) {
        unitsFromCollection.push(full ? { ...full } : {
          ...entry,
          expansion: entry.expansion || '',
          collectionNumber: entry.collectionNumber || 0,
          variant: entry.variant || '',
          speedMode: entry.speedMode || '',
          class: entry.class || '',
          health: entry.health || 0,
          maxMovement: entry.maxMovement || 0,
          maxAttack: entry.maxAttack || 0,
          maxDefense: entry.maxDefense || 0,
          maxDamage: entry.maxDamage || 0,
          isUnique: entry.isUnique || false,
          rank: entry.rank || 'NA',
          imageUrl: entry.imageUrl || '',
          attackStats: entry.attackStats || [],
          combatDial: entry.combatDial || [],
          heatDial: entry.heatDial || []
        } as Unit)
      }
    })
    setCollectionUnits(unitsFromCollection)
  }, [rawHaveCollection, availableUnits])

  // Load all units from API using the existing service
  useEffect(() => {
    const loadAllUnits = async () => {
      try {
        console.log('Loading units from API using apiService...')
        const allUnits = await apiService.getAllUnits()
        console.log('Total units loaded:', allUnits.length)
        setAvailableUnits(allUnits)
        setFilteredUnits(allUnits)
      } catch (error) {
        console.error('Error loading units:', error)
      }
    }
    loadAllUnits()
  }, [])

  // Load all cards from API
  useEffect(() => {
    const loadAllCards = async () => {
      try {
        console.log('Loading cards from API...')
        const factionPrides = await apiService.getFactionPrides({ limit: 100 })
        const mercenaryContracts = await apiService.getMercenaryContracts({ limit: 100 })

        // Gears are paginated (100/page); fetch every page
        const gearCards: IGear[] = []
        let gearPage = 1
        let gearTotalPages = 1
        do {
          const res = await apiService.getGears({ page: gearPage, limit: 100 })
          gearTotalPages = res.totalPages
          gearCards.push(...res.gears)
          gearPage++
        } while (gearPage <= gearTotalPages)

        const situationalAlliances = await apiService.getSituationalAlliances({ limit: 100 })

        const allCards: Card[] = []
        
        // Convert Faction Prides to Cards
        factionPrides.factionPrides.forEach(fp => {
          allCards.push({
            id: fp.cardId,
            dbId: fp.id,
            name: fp.faction,
            type: 'F',
            typeName: 'Faction Pride',
            cost: fp.cost,
            alternativeCost: fp.alternativeCost ?? undefined,
            haveAlternativeCost: fp.haveAlternativeCost,
            haveLogo: fp.haveLogo,
            haveSeeText: fp.haveSeeText,
            faction: fp.faction,
            factionLogoVersion: fp.logoVariant as Card['factionLogoVersion'],
            rarity: 'Common',
            expansion: fp.expansion,
            collectionNumber: fp.collectionNumber,
            imageUrl: '',
            description: fp.description,
            flavorText: fp.flavorText ?? undefined,
            isUnique: false,
            cardModel: 'single',
            frontImage: '/images/cards/faction-pride-front.png',
            backImage: '/images/cards/faction-pride-back.png',
          })
        })
        
        // Convert Mercenary Contracts to Cards
        mercenaryContracts.mercenaryContracts.forEach(mc => {
          allCards.push({
            id: mc.cardId,
            dbId: mc.id,
            name: mc.faction,
            type: 'MC',
            typeName: 'Mercenary Contract',
            cost: mc.cost,
            alternativeCost: mc.alternativeCost ?? undefined,
            haveAlternativeCost: mc.haveAlternativeCost ?? false,
            haveLogo: mc.haveLogo ?? false,
            haveSeeText: mc.haveSeeText ?? false,
            faction: mc.faction,
            factionLogoVersion: mc.logoVariant as Card['factionLogoVersion'],
            rarity: 'Common',
            expansion: mc.expansion,
            collectionNumber: mc.collectionNumber,
            imageUrl: '',
            description: mc.description,
            flavorText: mc.flavorText ?? undefined,
            isUnique: false,
            cardModel: mc.cardModel,
            contractText: mc.contractText ?? undefined,
            frontImage: mc.cardModel === 'double' ? '/images/cards/mercenary-contract-front-double.png' : '/images/cards/mercenary-contract-front-single.png',
            backImage: '/images/cards/mercenary-contract-back.png',
          })
        })
        
        // Convert Gears to Cards
        gearCards.forEach(g => {
          allCards.push({
            id: g.cardId,
            dbId: g.id,
            name: g.name,
            type: 'G',
            typeName: 'Gear',
            cost: g.points,
            faction: g.faction || '',
            class: g.class,
            attachesTo: g.attachesTo,
            rarity: 'Common',
            expansion: g.expansion,
            collectionNumber: g.collectionNumber,
            imageUrl: g.imageUrl || '',
            description: g.effect || '',
            isUnique: false,
            cardModel: 'single',
          })
        })

        // Convert Situational Alliances to Cards
        situationalAlliances.situationalAlliances.forEach(sa => {
          allCards.push({
            id: sa.cardId,
            dbId: sa.id,
            name: sa.name,
            type: 'SA',
            typeName: 'Situational Alliance',
            cost: sa.cost,
            faction: sa.name,
            factionLeft: sa.factionLeft,
            factionRight: sa.factionRight,
            rarity: 'Common',
            expansion: sa.expansion,
            collectionNumber: sa.collectionNumber,
            imageUrl: '',
            description: sa.description,
            flavorText: sa.flavorText ?? undefined,
            isUnique: false,
            cardModel: 'double',
            frontImage: '/images/cards/situational-alliance-front-double.png',
            backImage: '/images/cards/situational-alliance-back.png',
          })
        })

        console.log('Total cards loaded:', allCards.length)
        setAvailableCards(allCards)
      } catch (error) {
        console.error('Error loading cards:', error)
      }
    }
    loadAllCards()
  }, [])

  // Load all pilots: indexed by their preferred mech code (so a unique unit drawn
  // during a draft can be automatically paired with its pilot card), and as regular
  // drawable Cards (so pilots can also come up in the normal "Card" booster slot).
  useEffect(() => {
    const loadPilots = async () => {
      try {
        const map = new Map<string, IPilot>()
        const byId = new Map<string, IPilot>()
        const cards: Card[] = []
        let page = 1
        let totalPages = 1
        do {
          const res = await apiService.getPilots({ page, limit: 100 })
          totalPages = res.totalPages
          res.pilots.forEach(p => {
            if (p.preferredMechId) map.set(p.preferredMechId, p)
            byId.set(p.id, p)
            cards.push(pilotToCard(p))
          })
          page++
        } while (page <= totalPages)
        console.log('Total pilots loaded:', map.size)
        setPilotsByMechCode(map)
        setPilotsById(byId)
        setAvailablePilotCards(cards)
      } catch (error) {
        console.error('Error loading pilots:', error)
      }
    }
    loadPilots()
  }, [])

  // Lazily fetch each armied mech's full unit record (weapon damage types, class, faction),
  // used both to validate a gear's "attaches to" requirement and as a fallback for a mech's
  // own class/faction when a draft was saved before those fields were tracked on DraftUnit.
  useEffect(() => {
    if (!selectedDraft) return
    const mechIds = new Set<string>()
    selectedDraft.results.forEach(result => {
      (result.armyUnits || []).forEach(u => {
        if (!u.isCard && u.type?.toLowerCase() === 'mech') mechIds.add(u.id)
      })
    })
    const missing = [...mechIds].filter(id => !mechDetailsById.has(id))
    if (missing.length === 0) return
    let cancelled = false
    Promise.all(missing.map(id => apiService.getUnit(id).then(unit => [id, unit] as const))).then(results => {
      if (cancelled) return
      setMechDetailsById(prev => {
        const next = new Map(prev)
        results.forEach(([id, unit]) => { if (unit) next.set(id, unit) })
        return next
      })
    })
    return () => { cancelled = true }
  }, [selectedDraft, mechDetailsById])

  // A mech's class/faction as tracked on its DraftUnit, falling back to the freshly-fetched
  // full unit record when the draft was saved before those fields existed on DraftUnit.
  const mechClassOf = (mech: DraftUnit): string | undefined => mech.class || mechDetailsById.get(mech.id)?.class
  const mechFactionOf = (mech: DraftUnit): string => mech.faction || mechDetailsById.get(mech.id)?.faction || ''

  // Filter units based on filters
  useEffect(() => {
    const sourceUnits = useCollectionAsSource ? collectionUnits : availableUnits
    let filtered = sourceUnits

    if (unitFilters.factions.length > 0) {
      filtered = filtered.filter(unit => {
        const matchesType = !unitFilters.type || unit.type === unitFilters.type
        const matchesPoints = (!unitFilters.minPoints || unit.points >= parseInt(unitFilters.minPoints)) &&
                             (!unitFilters.maxPoints || unit.points <= parseInt(unitFilters.maxPoints))
        const matchesSearch = !unitFilters.search || 
          unit.name.toLowerCase().includes(unitFilters.search.toLowerCase()) ||
          unit.variant.toLowerCase().includes(unitFilters.search.toLowerCase())
        const matchesFaction = unitFilters.factions.length === 0 || unitFilters.factions.includes(unit.faction)
        const matchesExpansion = unitFilters.expansions.length === 0 || unitFilters.expansions.includes(unit.expansion)
        
        return matchesType && matchesPoints && matchesSearch && matchesFaction && matchesExpansion
      })
    }

    if (unitFilters.expansions.length > 0) {
      const filteredUnitsList = filtered.filter(unit => {
        const matchesType = !unitFilters.type || unit.type === unitFilters.type
        const matchesPoints = (!unitFilters.minPoints || unit.points >= parseInt(unitFilters.minPoints)) &&
                             (!unitFilters.maxPoints || unit.points <= parseInt(unitFilters.maxPoints))
        const matchesSearch = !unitFilters.search || 
          unit.name.toLowerCase().includes(unitFilters.search.toLowerCase()) ||
          unit.variant.toLowerCase().includes(unitFilters.search.toLowerCase())
        const matchesFaction = unitFilters.factions.length === 0 || unitFilters.factions.includes(unit.faction)
        const matchesExpansion = unitFilters.expansions.length === 0 || unitFilters.expansions.includes(unit.expansion)
        
        return matchesType && matchesPoints && matchesSearch && matchesFaction && matchesExpansion
      })
      setFilteredUnits(filteredUnitsList)
    }

    if (unitFilters.maxPoints) {
      const maxPoints = parseInt(unitFilters.maxPoints)
      if (!isNaN(maxPoints)) {
        filtered = filtered.filter(unit => unit.points <= maxPoints)
      }
    }

    setFilteredUnits(filtered)
  }, [availableUnits, collectionUnits, useCollectionAsSource, unitFilters])

  // Save drafts to localStorage
  const saveDrafts = (updatedDrafts: Draft[]) => {
    setDrafts(updatedDrafts)
    if (isClient) {
      safeLocalStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
    }
  }

  // Show delete confirmation modal
  const showDeleteConfirmation = (draftId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setDraftToDelete(draftId)
    setShowDeleteModal(true)
  }

  // Confirm delete draft
  const confirmDeleteDraft = () => {
    if (draftToDelete) {
      const updatedDrafts = drafts.filter(d => d.id !== draftToDelete)
      saveDrafts(updatedDrafts)
      if (selectedDraft?.id === draftToDelete) {
        setSelectedDraft(null)
      }
    }
    setShowDeleteModal(false)
    setDraftToDelete(null)
  }

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDraftToDelete(null)
  }

  // Cryptographically secure random number generator
  const getSecureRandom = () => {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0] / (0xFFFFFFFF + 1)
  }

  // Fisher-Yates shuffle algorithm for true randomization
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(getSecureRandom() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Weighted random selection to avoid clustering
  const selectRandomWithWeights = <T,>(items: T[], weights?: number[]): T => {
    if (items.length === 0) throw new Error('Cannot select from empty array')
    
    if (!weights || weights.length !== items.length) {
      // Use secure random for uniform distribution
      const randomIndex = Math.floor(getSecureRandom() * items.length)
      return items[randomIndex]
    }
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    let random = getSecureRandom() * totalWeight
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return items[i]
      }
    }
    
    return items[items.length - 1]
  }

  const generateDraftAnimated = async (customSettings?: DraftSettings) => {
    if (!newDraftName.trim()) return
    
    const settings = customSettings || draftSettings
    
    // Validate settings
    if (!settings || !settings.numberOfPlayers || !settings.boosterConfigs) {
      alert(t('drafts.invalidSettings'))
      return
    }

    if (selectedUnits.length === 0) {
      alert(t('drafts.selectUnitsFirst'))
      return
    }
    
    // Start animation
    setIsDrafting(true)
    setCurrentBooster(0)
    setCurrentPlayer(0)
    
    // Use selected units with quantities and shuffle them thoroughly
    const allUnits = selectedUnits.flatMap(selectedUnit => 
      Array(selectedUnit.quantity).fill(selectedUnit.unit)
    )
    
    // Use ALL available cards automatically (not just selected)
    const allCards = [...availableCards, ...availablePilotCards]
    
    // Pre-shuffle the entire pool multiple times for maximum randomness
    let shuffledUnits = shuffleArray(allUnits)
    for (let i = 0; i < 3; i++) {
      shuffledUnits = shuffleArray(shuffledUnits)
    }
    
    // Initialize players with randomized order
    const playerOrder = shuffleArray(Array.from({ length: settings.numberOfPlayers }, (_, i) => i))
    const players: DraftResult[] = []
    for (let i = 0; i < settings.numberOfPlayers; i++) {
      players.push({
        playerId: i + 1,
        playerName: `${t('control.player')} ${i + 1}`,
        units: [],
        armyUnits: [],
        totalPoints: 0,
        armyPoints: 0,
        ...(settings.armyPointLimit && settings.armyPointLimit > 0
          ? { armyPointsLimit: settings.armyPointLimit }
          : {})
      })
    }
    
    // Create available units pool with pre-shuffled units
    const availableUnitsPool = [...shuffledUnits]
    const availableCardsPool = shuffleArray(allCards)
    const totalBoosters = settings.numberOfPlayers * settings.boostersPerPlayer
    
    // Track unit and card distribution to avoid clustering
    const unitDistribution = new Map<string, number>()
    const cardDistribution = new Map<string, number>()
    
    // Animate draft process with improved randomization
    for (let boosterIndex = 0; boosterIndex < totalBoosters; boosterIndex++) {
      // Round-robin distribution: players are indexed 0-based in array but displayed as 1-based
      const currentPlayerIndex = boosterIndex % settings.numberOfPlayers
      
      const currentPlayer = players[currentPlayerIndex]

      // Unique units drawn in this booster whose pilot should auto-fill this booster's
      // Card slot(s), bypassing the normal random card draw for those slots.
      const forcedPilotCards: Card[] = []

      // Update UI state (display 1-based player number)
      setCurrentBooster(boosterIndex + 1)
      setCurrentPlayer(currentPlayer.playerId)
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For each unit type in booster config
      for (const config of settings.boosterConfigs) {
        // Handle cards
        if (config.unitType === 'Card') {
          const availableCards = availableCardsPool.filter((card: Card) => 
            !config.cardType || card.type === config.cardType
          )
          
          const shuffledCards = shuffleArray(availableCards)

          for (let j = 0; j < config.quantity; j++) {
            // A unique unit drawn earlier in this booster auto-fills the card slot
            // with its pilot, ahead of the normal random draw.
            const forcedCard = forcedPilotCards.shift()
            const selectedCard = forcedCard ?? (shuffledCards.length > 0
              ? selectRandomWithWeights(shuffledCards, shuffledCards.map(card => {
                  const distributionCount = cardDistribution.get(card.id) || 0
                  return Math.max(1, 10 - distributionCount)
                }))
              : undefined)

            if (selectedCard) {
              // Show animation of card being drawn
              setDraftAnimation({ unit: selectedCard as any, player: currentPlayerIndex + 1 })
              await new Promise(resolve => setTimeout(resolve, 800))

              // Add card to player
              const cardPoints = typeof selectedCard.cost === 'string'
                ? parseInt(selectedCard.cost.split('/')[0])
                : selectedCard.cost

              currentPlayer.units.push({
                id: selectedCard.id,
                name: selectedCard.name,
                type: selectedCard.type,
                points: cardPoints,
                faction: selectedCard.faction,
                expansion: selectedCard.expansion,
                collectionNumber: selectedCard.collectionNumber,
                quantity: 1,
                isCard: true,
                cardType: selectedCard.type,
                cardDbId: selectedCard.dbId,
                instanceId: crypto.randomUUID(),
                class: selectedCard.class,
                factionLeft: selectedCard.factionLeft,
                factionRight: selectedCard.factionRight,
                attachesTo: selectedCard.attachesTo
              })

              currentPlayer.totalPoints += cardPoints

              // Update distribution tracking
              cardDistribution.set(selectedCard.id, (cardDistribution.get(selectedCard.id) || 0) + 1)

              if (!forcedCard) {
                // Remove from available pool (forced pilot cards never came from it)
                const poolIndex = availableCardsPool.indexOf(selectedCard)
                if (poolIndex > -1) {
                  availableCardsPool.splice(poolIndex, 1)
                }

                const cardIndex = shuffledCards.indexOf(selectedCard)
                if (cardIndex > -1) {
                  shuffledCards.splice(cardIndex, 1)
                }
              }
            }
          }
        } else {
          // Handle units
          const availableUnits = availableUnitsPool.filter((unit: any) => 
            unit.type.toLowerCase() === config.unitType.toLowerCase()
          )
          
          // Shuffle available units of this type
          const shuffledTypeUnits = shuffleArray(availableUnits)
          
          // Select random units for this config with anti-clustering
          for (let j = 0; j < config.quantity; j++) {
            if (shuffledTypeUnits.length > 0) {
              // Calculate weights to reduce clustering (favor less distributed units)
              const weights = shuffledTypeUnits.map(unit => {
                const distributionCount = unitDistribution.get(unit.id) || 0
                return Math.max(1, 10 - distributionCount) // Higher weight for less distributed units
              })
              
              const selectedUnit = selectRandomWithWeights(shuffledTypeUnits, weights)
              
              // Show animation of unit being drawn
              setDraftAnimation({ unit: selectedUnit, player: currentPlayerIndex + 1 })
              await new Promise(resolve => setTimeout(resolve, 800))
              
              // Add to player
              currentPlayer.units.push({
                id: selectedUnit.id,
                name: selectedUnit.name,
                type: selectedUnit.type,
                points: selectedUnit.points,
                faction: selectedUnit.faction,
                expansion: selectedUnit.expansion,
                collectionNumber: selectedUnit.collectionNumber,
                quantity: 1,
                instanceId: crypto.randomUUID(),
                class: selectedUnit.class
              })

              currentPlayer.totalPoints += selectedUnit.points

              // A unique unit with a matching pilot auto-fills this booster's card slot
              if (selectedUnit.isUnique) {
                const mechCode = mechCodeFromImageUrl(selectedUnit.imageUrl)
                const pilot = mechCode ? pilotsByMechCode.get(mechCode) : undefined
                if (pilot && !forcedPilotCards.some(c => c.dbId === pilot.id)) {
                  forcedPilotCards.push(pilotToCard(pilot))
                }
              }

              // Update distribution tracking
              unitDistribution.set(selectedUnit.id, (unitDistribution.get(selectedUnit.id) || 0) + 1)

              // Remove from available pool
              const poolIndex = availableUnitsPool.indexOf(selectedUnit)
              if (poolIndex > -1) {
                availableUnitsPool.splice(poolIndex, 1)
              }
              
              // Remove from shuffled type units
              const typeIndex = shuffledTypeUnits.indexOf(selectedUnit)
              if (typeIndex > -1) {
                shuffledTypeUnits.splice(typeIndex, 1)
              }
            }
          }
        }
      }
    }
    
    // Clear animation
    setDraftAnimation(null)
    
    // Create new draft
    const newDraft: Draft = {
      id: Date.now().toString(),
      name: newDraftName,
      description: newDraftDescription,
      settings: settings,
      availableUnits: selectedUnits,
      results: players,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Save to localStorage (client-side only)
    const existingDrafts = JSON.parse(safeLocalStorage.getItem('myDrafts') || '[]')
    const updatedDrafts = [...existingDrafts, newDraft]
    if (isClient) {
      safeLocalStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
    }
    
    // Update state
    setDrafts(updatedDrafts)
    setNewDraftName('')
    setNewDraftDescription('')
    setSelectedUnits([])
    setIsCreating(false)
    setIsDrafting(false)
    setCurrentBooster(0)
    setCurrentPlayer(0)
  }

  const generateDraft = generateDraftAnimated

  // Regenerate draft
  const regenerateDraft = async (draft: Draft) => {
    setIsGenerating(true)
    
    try {
      // Delete the old draft first
      const updatedDrafts = drafts.filter(d => d.id !== draft.id)
      saveDrafts(updatedDrafts)
      
      // Use the same settings to regenerate
      setNewDraftName(draft.name)
      setNewDraftDescription(draft.description || '')
      
      // Generate new results with the draft's settings directly
      await generateDraft(draft.settings)
      
    } catch (error) {
      console.error('Error regenerating draft:', error)
      alert(t('drafts.regenErr'))
    } finally {
      setIsGenerating(false)
    }
  }

  // Import collection from JSON file
  const importCollectionFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string)
        const unitsFromFile: Unit[] = []
        
        // Check for new format (v2.0) with separate have/want collections
        if (jsonData.version === "2.0" && jsonData.haveCollection && Array.isArray(jsonData.haveCollection)) {
          // Extract units from have collection
          jsonData.haveCollection.forEach((unit: any) => {
            // Add multiple copies based on quantity
            for (let i = 0; i < unit.quantity; i++) {
              unitsFromFile.push({
                ...unit,
                expansion: unit.expansion || '',
                collectionNumber: unit.collectionNumber || 0,
                variant: unit.variant || '',
                speedMode: unit.speedMode || '',
                class: unit.class || '',
                health: unit.health || 0,
                maxMovement: unit.maxMovement || 0,
                maxAttack: unit.maxAttack || 0,
                maxDefense: unit.maxDefense || 0,
                maxDamage: unit.maxDamage || 0,
                isUnique: unit.isUnique || false,
                rank: unit.rank || 'NA',
                imageUrl: unit.imageUrl || '',
                attackStats: unit.attackStats || [],
                combatDial: unit.combatDial || [],
                heatDial: unit.heatDial || []
              } as Unit)
            }
          })
        }
        // Legacy format - try to extract from old structure
        else if (jsonData.collection && Array.isArray(jsonData.collection)) {
          jsonData.collection.forEach((unit: any) => {
            // Add multiple copies based on quantity
            for (let i = 0; i < (unit.quantity || 1); i++) {
              unitsFromFile.push({
                ...unit,
                expansion: unit.expansion || '',
                collectionNumber: unit.collectionNumber || 0,
                variant: unit.variant || '',
                speedMode: unit.speedMode || '',
                class: unit.class || '',
                health: unit.health || 0,
                maxMovement: unit.maxMovement || 0,
                maxAttack: unit.maxAttack || 0,
                maxDefense: unit.maxDefense || 0,
                maxDamage: unit.maxDamage || 0,
                isUnique: unit.isUnique || false,
                rank: unit.rank || 'NA',
                imageUrl: unit.imageUrl || '',
                attackStats: unit.attackStats || [],
                combatDial: unit.combatDial || [],
                heatDial: unit.heatDial || []
              } as Unit)
            }
          })
        }
        // Very old format - object with unit IDs as keys
        else {
          Object.entries(jsonData).forEach(([unitId, data]: [string, any]) => {
            if (data.have > 0 && data.unit) {
              // Add multiple copies based on quantity
              for (let i = 0; i < data.have; i++) {
                unitsFromFile.push({
                  ...data.unit,
                  expansion: data.unit.expansion || '',
                  collectionNumber: data.unit.collectionNumber || 0,
                  variant: data.unit.variant || '',
                  speedMode: data.unit.speedMode || '',
                  class: data.unit.class || '',
                  health: data.unit.health || 0,
                  maxMovement: data.unit.maxMovement || 0,
                  maxAttack: data.unit.maxAttack || 0,
                  maxDefense: data.unit.maxDefense || 0,
                  maxDamage: data.unit.maxDamage || 0,
                  isUnique: data.unit.isUnique || false,
                  rank: data.unit.rank || 'NA',
                  imageUrl: data.unit.imageUrl || '',
                  attackStats: data.unit.attackStats || [],
                  combatDial: data.unit.combatDial || [],
                  heatDial: data.unit.heatDial || []
                } as Unit)
              }
            }
          })
        }
        
        setCollectionUnits(unitsFromFile)
        setUseCollectionAsSource(true)
        setImportMessage(`${t('drafts.importOkPre')} ${unitsFromFile.length} ${t('drafts.importOkPost')}`)
        setImportSuccess(true)
        setShowImportModal(true)
      } catch (error) {
        console.error('Error importing collection:', error)
        setImportMessage(t('drafts.importErrMsg'))
        setImportSuccess(false)
        setShowImportModal(true)
      }
    }
    reader.readAsText(file)
    
    // Reset input
    event.target.value = ''
  }

  // Export draft configuration to JSON
  const exportDraftConfig = async () => {
    try {
      // If we have a selected draft, export its configuration
      const configToExport = selectedDraft ? {
        exportDate: new Date().toISOString(),
        version: "1.0",
        draftSettings: selectedDraft.settings,
        selectedUnits: selectedDraft.availableUnits || [],
        useCollectionAsSource: false, // Default for existing drafts
        unitFilters: {
          factions: [],
          expansions: [],
          type: '',
          minPoints: '',
          maxPoints: '',
          search: ''
        },
        metadata: {
          totalSelectedUnits: selectedDraft.availableUnits?.length || 0,
          totalUnitInstances: selectedDraft.availableUnits?.reduce((sum, su) => sum + su.quantity, 0) || 0,
          sourceType: 'existing_draft',
          draftName: selectedDraft.name
        }
      } : {
        exportDate: new Date().toISOString(),
        version: "1.0",
        draftSettings,
        selectedUnits: selectedUnits.map(su => ({
          unit: su.unit,
          quantity: su.quantity
        })),
        useCollectionAsSource,
        unitFilters,
        metadata: {
          totalSelectedUnits: selectedUnits.length,
          totalUnitInstances: selectedUnits.reduce((sum, su) => sum + su.quantity, 0),
          sourceType: useCollectionAsSource ? 'collection' : 'api'
        }
      }

      const configData = configToExport

      const dataStr = JSON.stringify(configData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })

      try {
        // Check if File System Access API is supported
        if ('showSaveFilePicker' in window) {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: `draft-config-${new Date().toISOString().split('T')[0]}.json`,
            types: [{
              description: 'JSON files',
              accept: { 'application/json': ['.json'] }
            }]
          })
          
          const writable = await fileHandle.createWritable()
          await writable.write(dataStr)
          await writable.close()
          
          setConfigMessage(t('drafts.configExportOk'))
          setConfigSuccess(true)
          setShowConfigModal(true)
        } else {
          // Fallback to traditional download
          const url = URL.createObjectURL(dataBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = `draft-config-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          setConfigMessage(t('drafts.configExportOk'))
          setConfigSuccess(true)
          setShowConfigModal(true)
        }
      } catch (error) {
        if ((error as any).name === 'AbortError') {
          // User cancelled the save dialog
          return
        }
        navigator.clipboard.writeText(dataStr).then(() => {
          setConfigMessage(t('drafts.configExportClipboard'))
          setConfigSuccess(true)
          setShowConfigModal(true)
        }).catch(() => {
          setConfigMessage(t('drafts.configExportErr'))
          setConfigSuccess(false)
          setShowConfigModal(true)
        })
      }
    } catch (error) {
      console.error('Export config error:', error)
      setConfigMessage(t('drafts.configExportErr'))
      setConfigSuccess(false)
      setShowConfigModal(true)
    }
  }

  // Import draft configuration from JSON
  const importDraftConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const configData = JSON.parse(e.target?.result as string)
        
        if (configData.version === "1.0" && configData.draftSettings) {
          // Import draft settings
          setDraftSettings(configData.draftSettings)
          
          // Import selected units if available
          if (configData.selectedUnits && Array.isArray(configData.selectedUnits)) {
            setSelectedUnits(configData.selectedUnits)
          }
          
          // Import source preference
          if (typeof configData.useCollectionAsSource === 'boolean') {
            setUseCollectionAsSource(configData.useCollectionAsSource)
          }
          
          // Import filters
          if (configData.unitFilters) {
            setUnitFilters(configData.unitFilters)
          }
          
          setConfigMessage(`${t('drafts.configOkPre')} ${configData.selectedUnits?.length || 0} ${t('drafts.configOkPost')}`)
          setConfigSuccess(true)
          setShowConfigModal(true)
        } else {
          setConfigMessage(t('drafts.configErrMsg'))
          setConfigSuccess(false)
          setShowConfigModal(true)
        }
      } catch (error) {
        console.error('Error importing config:', error)
        setConfigMessage(t('drafts.importErrMsg'))
        setConfigSuccess(false)
        setShowConfigModal(true)
      }
    }
    reader.readAsText(file)
    
    // Reset input
    event.target.value = ''
  }

  const toggleUnitSelection = (unit: Unit) => {
    const isSelected = selectedUnits.some(u => u.unit.id === unit.id)
    if (isSelected) {
      setSelectedUnits(selectedUnits.filter(u => u.unit.id !== unit.id))
    } else {
      setSelectedUnits([...selectedUnits, { unit, quantity: 1 }])
    }
  }

  const updateUnitQuantity = (unitId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedUnits(selectedUnits.filter(u => u.unit.id !== unitId))
    } else {
      setSelectedUnits(selectedUnits.map(u => 
        u.unit.id === unitId ? { ...u, quantity } : u
      ))
    }
  }

  // A mech's code (e.g. "AOD113") is its expansion + zero-padded collectionNumber,
  // matching a pilot's preferredMechId 1:1 (see mechCodeFromImageUrl above). Falls back to
  // the freshly-fetched unit record when a draft was saved before these fields were tracked.
  const mechCode = (unit: DraftUnit): string => {
    if (unit.expansion && unit.collectionNumber) return `${unit.expansion}${String(unit.collectionNumber).padStart(3, '0')}`
    return mechCodeFromImageUrl(mechDetailsById.get(unit.id)?.imageUrl) || ''
  }

  // Points label for any drafted unit/card: a pilot shows "standard/preferred-mech" cost, everything else its plain points.
  const unitPointsLabel = (unit: DraftUnit): string => {
    const pilot = unit.cardType === 'P' && unit.cardDbId ? pilotsById.get(unit.cardDbId) : undefined
    return pilot ? pilotPointsLabel(pilot) : `${unit.points}`
  }

  // " / <class>" suffix for a subtitle line — omitted when there's no meaningful class (e.g. Infantry's "NA").
  const classSuffix = (unit: DraftUnit): string => unit.class && unit.class !== 'NA' ? ` / ${unit.class}` : ''

  // A pilot's "type" shows its pilotType abbreviation (Common=P, Legendary=L, Gunslinger=GS)
  // instead of the generic card type 'P' shared by every pilot.
  const PILOT_TYPE_ABBR: Record<string, string> = { CommonPilot: 'P', LegendaryPilot: 'L', GunslingerPilot: 'GS' }
  const unitTypeLabel = (unit: DraftUnit): string => {
    const pilot = unit.cardType === 'P' && unit.cardDbId ? pilotsById.get(unit.cardDbId) : undefined
    return pilot ? (PILOT_TYPE_ABBR[pilot.pilotType] || unit.type) : unit.type
  }

  // A gear's "attaches to" uses "Energy"; the mech's own attack data calls it "energetic".
  const DAMAGE_TYPE_ALIASES: Record<string, string> = { energy: 'energetic' }
  const WEAPON_DAMAGE_TYPES = ['ballistic', 'energetic', 'melee']

  // Faction abbreviations used in a Gunslinger pilot's recruitCosts labels, matched to full faction names.
  const GUNSLINGER_RECRUIT_FACTION_CODES: Record<string, string> = {
    "Bannson's Raiders": 'BR',
    'Clan Jade Falcon': 'CJF',
    'Clan Nova Cat': 'CNC',
    'Clan Sea Fox': 'CSF',
    'Clan Wolf': 'CW',
    "Dragon's Fury": 'DF',
    "Clan Hell's Horses": 'H',
    'House Davion': 'HD',
    'House Kurita': 'HK',
    'Highlanders': 'HL',
    'House Steiner': 'HS',
    'Rasalhague Dominion': 'RD',
    'Republic of the Sphere': 'RotS',
    'Spirit Cats': 'SC',
    'Stormhammers': 'SH',
    'Steel Wolves': 'SW',
    'Swordsworn': 'SS',
    'Wolf Hunters': 'WH',
  }

  // A "Gunslinger" pilot is a mercenary-for-hire: mounting one of a specific faction's mechs
  // costs an extra recruitment fee on top of its normal cost — the faction-specific entry in
  // its recruitCosts if listed, else the Base entry. Returns null when that faction explicitly
  // will not hire this pilot (a listed entry with no cost) — the attach must be blocked.
  const gunslingerRecruitCost = (pilot: IPilot, mechFaction: string): number | null => {
    if ((pilot.factionLeft || '').toLowerCase() !== 'gunslinger') return 0
    if (mechFaction.toLowerCase() === 'gunslinger') return 0 // already home faction, no fee
    const code = GUNSLINGER_RECRUIT_FACTION_CODES[mechFaction]
    const entries = pilot.recruitCosts || []
    const specific = code ? entries.find(rc => rc.label === code) : undefined
    if (specific) return specific.cost // may be null -> blocked
    const base = entries.find(rc => rc.label === 'Base')
    return base ? base.cost : 0
  }

  // A pilot/gear class of "NA" means "any class" (e.g. a pilot rated to fly Light through
  // Assault, with per-class costs spelled out in its description) — not a real restriction.
  const normalizedClass = (value?: string): string | undefined => value && value.toUpperCase() !== 'NA' ? value : undefined

  // Class requirement: a Pilot/Gear can only mount a Mech of the same class. Missing data
  // on either side is treated as unrestricted rather than silently blocking the attach.
  const classCompatible = (item: DraftUnit, mech: DraftUnit): boolean => {
    const itemClass = normalizedClass(item.class)
    const mechClass = normalizedClass(mechClassOf(mech))
    return !itemClass || !mechClass || itemClass.toLowerCase() === mechClass.toLowerCase()
  }

  // A pilot with no fixed class (class "NA") lists its per-class cost in its own description,
  // e.g. "...depending on class: L=11, M=16, H=19, A=30." — parse that into a class->cost map.
  const CLASS_LETTER_TO_NAME: Record<string, string> = { L: 'Light', M: 'Medium', H: 'Heavy', A: 'Assault' }
  const parsePilotClassCosts = (description?: string | null): Record<string, number> | null => {
    if (!description) return null
    const section = description.match(/depending on class:\s*([^.]+)\./i)?.[1] || description
    const costs: Record<string, number> = {}
    for (const m of section.matchAll(/\b([LMHA])\s*=\s*(\d+)/g)) {
      const name = CLASS_LETTER_TO_NAME[m[1].toUpperCase()]
      if (name) costs[name] = parseInt(m[2], 10)
    }
    return Object.keys(costs).length > 0 ? costs : null
  }

  // Faction requirement: no faction on the Pilot/Gear means it fits any mech. Otherwise the
  // mech's faction must match one of the item's faction(s) (Gear's can be a "A-B" combo).
  const factionCompatible = (item: DraftUnit, mech: DraftUnit): boolean => {
    const raw = [item.factionLeft, item.factionRight, item.cardType === 'G' ? item.faction : undefined].filter(Boolean) as string[]
    const tokens = raw.flatMap(f => f.split(/\s*-\s*/)).map(f => f.trim().toLowerCase()).filter(Boolean)
    // "Gunslinger" pilots are mercenaries-for-hire: they mount any faction's mech (recruit
    // cost aside), so that token never restricts the match — same as having no faction at all.
    const restricting = tokens.filter(t => t !== 'gunslinger')
    if (restricting.length === 0) return true
    return restricting.includes(mechFactionOf(mech).toLowerCase())
  }

  // Gear "attaches to" requirement: a weapon-specific type (Ballistic/Energy/Melee) must
  // match one of the mech's actual weapon damage types; generic categories are unrestricted.
  const attachesToCompatible = (item: DraftUnit, mech: DraftUnit): boolean => {
    if (item.cardType !== 'G' || !item.attachesTo) return true
    const normalized = item.attachesTo.toLowerCase()
    const mapped = DAMAGE_TYPE_ALIASES[normalized] || normalized
    if (!WEAPON_DAMAGE_TYPES.includes(mapped)) return true
    const mechUnit = mechDetailsById.get(mech.id)
    if (!mechUnit) return true // not loaded yet — fails open briefly, re-evaluated once fetched
    const mechTypes = new Set((mechUnit.attackStats || []).map(a => a.damageType.toLowerCase()))
    return mechTypes.has(mapped)
  }

  // A Gunslinger pilot some faction won't hire (a listed recruitCosts entry with no cost)
  // cannot be mounted on that faction's mech at all.
  const gunslingerRecruitable = (item: DraftUnit, mech: DraftUnit): boolean => {
    const pilot = item.cardType === 'P' && item.cardDbId ? pilotsById.get(item.cardDbId) : undefined
    if (!pilot) return true
    return gunslingerRecruitCost(pilot, mechFactionOf(mech)) !== null
  }

  const canAttachToMech = (item: DraftUnit, mech: DraftUnit): boolean =>
    classCompatible(item, mech) && factionCompatible(item, mech) && attachesToCompatible(item, mech) && gunslingerRecruitable(item, mech)

  // A pilot mounted on its preferred mech uses the combo's printed cost instead of its
  // standalone points; a class-"NA" pilot instead costs whatever its description lists for
  // the mounted mech's class; a Gunslinger pilot also adds its faction recruitment fee on top.
  const pilotContribution = (pilotUnit: DraftUnit, mech: DraftUnit): number => {
    const pilot = pilotUnit.cardDbId ? pilotsById.get(pilotUnit.cardDbId) : undefined
    const recruitFee = pilot ? (gunslingerRecruitCost(pilot, mechFactionOf(mech)) ?? 0) : 0

    let base = pilotUnit.points
    const mechClass = mechClassOf(mech)
    if (pilot && pilot.preferredMechId === mechCode(mech) && pilot.costInPreferredMech != null) {
      base = pilot.costInPreferredMech
    } else if (pilot && !normalizedClass(pilot.class) && mechClass) {
      const classCosts = parsePilotClassCosts(pilot.description)
      if (classCosts && classCosts[mechClass] != null) base = classCosts[mechClass]
    }
    return base + recruitFee
  }

  // Effective point cost of a mech: base cost plus each mounted CEC (pilot at conditional
  // cost, gear at flat cost). A mech has exactly 2 CEC slots, shared between pilot and gear.
  const mechEffectiveCost = (mech: DraftUnit, armyUnits: DraftUnit[]): number => {
    return (mech.attachedInstanceIds || []).reduce((cost, instanceId) => {
      const mounted = armyUnits.find(u => u.instanceId === instanceId)
      if (!mounted) return cost
      return cost + (mounted.cardType === 'P' ? pilotContribution(mounted, mech) : mounted.points)
    }, mech.points)
  }

  // Total army points: mechs count their effective (mech+CEC) cost; any pilot/gear already
  // mounted on a mech is skipped here so it isn't counted twice.
  const computeArmyPoints = (armyUnits: DraftUnit[]): number => {
    const attachedIds = new Set(armyUnits.flatMap(u => u.attachedInstanceIds || []))
    return armyUnits.reduce((sum, u) => {
      if (!u.isCard && u.type?.toLowerCase() === 'mech') return sum + mechEffectiveCost(u, armyUnits)
      if (u.instanceId && attachedIds.has(u.instanceId)) return sum // folded into its mech above
      return sum + u.points
    }, 0)
  }

  // Attach/detach a pilot or gear to/from a specific mech's CEC slots (by instanceId) within a player's army.
  const updateArmyAttachments = (playerId: number, updater: (armyUnits: DraftUnit[]) => DraftUnit[]) => {
    if (!selectedDraft) return

    const updatedDraft = {
      ...selectedDraft,
      results: selectedDraft.results.map(result => {
        if (result.playerId !== playerId) return result
        const newArmyUnits = updater([...(result.armyUnits || [])])
        return {
          ...result,
          armyUnits: newArmyUnits,
          armyPoints: computeArmyPoints(newArmyUnits)
        }
      }),
      updatedAt: new Date().toISOString()
    }

    const updatedDrafts = drafts.map(d => d.id === selectedDraft.id ? updatedDraft : d)
    setDrafts(updatedDrafts)
    setSelectedDraft(updatedDraft)
    if (isClient) {
      safeLocalStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
    }
  }

  // Mount a pilot or gear card into one of a mech's 2 CEC slots. A mech can only carry one
  // pilot at a time; mounting a new one bumps whichever pilot was already in a slot.
  const attachToMech = (playerId: number, mechInstanceId: string, cardInstanceId: string, isPilot: boolean) => {
    updateArmyAttachments(playerId, armyUnits => {
      const mech = armyUnits.find(u => u.instanceId === mechInstanceId)
      const card = armyUnits.find(u => u.instanceId === cardInstanceId)
      if (!mech || !card || !canAttachToMech(card, mech)) return armyUnits

      return armyUnits.map(u => {
        // Unmount the card from wherever else it might be mounted
        const withoutCard = { ...u, attachedInstanceIds: (u.attachedInstanceIds || []).filter(id => id !== cardInstanceId) }
        if (u.instanceId !== mechInstanceId) return withoutCard

        let slots = withoutCard.attachedInstanceIds || []
        if (isPilot) {
          // Only one pilot per mech: drop any other pilot currently in a slot
          slots = slots.filter(id => {
            const mounted = armyUnits.find(au => au.instanceId === id)
            return mounted?.cardType !== 'P'
          })
        }
        if (slots.length >= 2) return { ...withoutCard, attachedInstanceIds: slots }
        return { ...withoutCard, attachedInstanceIds: [...slots, cardInstanceId] }
      })
    })
  }

  const detachFromMech = (playerId: number, mechInstanceId: string, cardInstanceId: string) => {
    updateArmyAttachments(playerId, armyUnits => armyUnits.map(u =>
      u.instanceId === mechInstanceId
        ? { ...u, attachedInstanceIds: (u.attachedInstanceIds || []).filter(id => id !== cardInstanceId) }
        : u
    ))
  }

  // Army management functions
  const moveUnitToArmy = (playerId: number, unit: DraftUnit) => {
    if (!selectedDraft) return

    const updatedDraft = {
      ...selectedDraft,
      results: selectedDraft.results.map(result => {
        if (result.playerId === playerId) {
          const currentArmyPoints = computeArmyPoints(result.armyUnits || [])
          if (result.armyPointsLimit && result.armyPointsLimit > 0 &&
              currentArmyPoints + unit.points > result.armyPointsLimit) {
            return result
          }
          // Remove exactly one occurrence by reference
          const pool = [...result.units]
          const idx = pool.indexOf(unit)
          if (idx !== -1) pool.splice(idx, 1)
          // Add to army units
          const newArmyUnits = [...(result.armyUnits || []), unit]
          const newArmyPoints = computeArmyPoints(newArmyUnits)
          const newDraftPoints = pool.reduce((sum, u) => sum + u.points, 0)

          return {
            ...result,
            units: pool,
            armyUnits: newArmyUnits,
            totalPoints: newDraftPoints,
            armyPoints: newArmyPoints
          }
        }
        return result
      }),
      updatedAt: new Date().toISOString()
    }
    
    const updatedDrafts = drafts.map(d => d.id === selectedDraft.id ? updatedDraft : d)
    setDrafts(updatedDrafts)
    setSelectedDraft(updatedDraft)
    
    if (isClient) {
      safeLocalStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
    }
  }

  const moveUnitToDraft = (playerId: number, unit: DraftUnit) => {
    if (!selectedDraft) return
    
    const updatedDraft = {
      ...selectedDraft,
      results: selectedDraft.results.map(result => {
        if (result.playerId === playerId) {
          // Remove exactly one occurrence by reference
          const armyPool = [...(result.armyUnits || [])]
          const armyIdx = armyPool.indexOf(unit)
          if (armyIdx !== -1) armyPool.splice(armyIdx, 1)
          // If a pilot/gear that was mounted on a mech leaves, unmount it from that mech's CEC slot
          const newArmyUnits = armyPool.map(u =>
            u.attachedInstanceIds?.includes(unit.instanceId || '')
              ? { ...u, attachedInstanceIds: u.attachedInstanceIds.filter(id => id !== unit.instanceId) }
              : u
          )
          // If the mech itself leaves, drop its attachment refs (its pilot/gear stay in the army, unmounted)
          const leavingUnit = unit.attachedInstanceIds?.length
            ? { ...unit, attachedInstanceIds: undefined }
            : unit
          // Add back to draft units
          const newDraftUnits = [...result.units, leavingUnit]
          const newArmyPoints = computeArmyPoints(newArmyUnits)
          const newDraftPoints = newDraftUnits.reduce((sum, u) => sum + u.points, 0)

          return {
            ...result,
            units: newDraftUnits,
            armyUnits: newArmyUnits,
            totalPoints: newDraftPoints,
            armyPoints: newArmyPoints
          }
        }
        return result
      }),
      updatedAt: new Date().toISOString()
    }
    
    const updatedDrafts = drafts.map(d => d.id === selectedDraft.id ? updatedDraft : d)
    setDrafts(updatedDrafts)
    setSelectedDraft(updatedDraft)
    
    if (isClient) {
      safeLocalStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
    }
  }

  const moveAllUnitsToDraft = (playerId: number) => {
    if (!selectedDraft) return
    
    const updatedDraft = {
      ...selectedDraft,
      results: selectedDraft.results.map(result => {
        if (result.playerId === playerId) {
          // Move all army units back to draft, clearing attachments (they're meaningless outside the army)
          const armyUnits = (result.armyUnits || []).map(u => ({ ...u, attachedInstanceIds: undefined }))
          const newDraftUnits = [...result.units, ...armyUnits]
          const newDraftPoints = newDraftUnits.reduce((sum, u) => sum + u.points, 0)
          const newArmyPoints = 0
          
          return {
            ...result,
            units: newDraftUnits,
            armyUnits: [],
            totalPoints: newDraftPoints,
            armyPoints: newArmyPoints
          }
        }
        return result
      }),
      updatedAt: new Date().toISOString()
    }
    
    const updatedDrafts = drafts.map(d => d.id === selectedDraft.id ? updatedDraft : d)
    setDrafts(updatedDrafts)
    setSelectedDraft(updatedDraft)
    
    if (isClient) {
      safeLocalStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
    }
  }

  const addUnitToArmy = (playerId: number, unit: Unit) => {
    if (!selectedDraft) return
    
    const updatedDraft = {
      ...selectedDraft,
      results: selectedDraft.results.map(result => {
        if (result.playerId === playerId) {
          const newUnit: DraftUnit = {
            id: unit.id,
            name: unit.name,
            type: unit.type,
            points: unit.points,
            faction: unit.faction,
            expansion: unit.expansion,
            collectionNumber: unit.collectionNumber?.toString(),
            quantity: 1
          }
          const newArmyUnits = [...(result.armyUnits || []), newUnit]
          const newArmyPoints = newArmyUnits.reduce((sum, u) => sum + u.points, 0)
          
          return {
            ...result,
            armyUnits: newArmyUnits,
            armyPoints: newArmyPoints
          }
        }
        return result
      }),
      updatedAt: new Date().toISOString()
    }
    
    const updatedDrafts = drafts.map(d => d.id === selectedDraft.id ? updatedDraft : d)
    setDrafts(updatedDrafts)
    setSelectedDraft(updatedDraft)
    
    if (isClient) {
      safeLocalStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
    }
  }

  const removeUnitFromArmy = (playerId: number, unitId: string) => {
    if (!selectedDraft) return
    
    const updatedDraft = {
      ...selectedDraft,
      results: selectedDraft.results.map(result => {
        if (result.playerId === playerId) {
          const newArmyUnits = (result.armyUnits || []).filter(u => u.id !== unitId)
          const newArmyPoints = newArmyUnits.reduce((sum, u) => sum + u.points, 0)
          
          return {
            ...result,
            armyUnits: newArmyUnits,
            armyPoints: newArmyPoints
          }
        }
        return result
      }),
      updatedAt: new Date().toISOString()
    }
    
    const updatedDrafts = drafts.map(d => d.id === selectedDraft.id ? updatedDraft : d)
    setDrafts(updatedDrafts)
    setSelectedDraft(updatedDraft)
    
    if (isClient) {
      safeLocalStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
    }
  }

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)'}}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 pb-4" style={{borderBottom:'1px solid #2a3a1a'}}>
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold font-mono tracking-widest uppercase" style={{color:'#e8d5a0'}}>Drafts</h1>
              <p className="text-xs font-mono mt-1" style={{color:'#4a5e3a'}}>{t('drafts.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => router.push('/search')} className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>
                {t('drafts.btnSearch')}
              </button>
              <label className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors cursor-pointer" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>
                {t('drafts.btnImportCollection')}
                <input type="file" accept=".json" onChange={importCollectionFromFile} className="hidden" />
              </label>
              <button onClick={exportDraftConfig} disabled={selectedUnits.length === 0 && drafts.length === 0} className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{background:'rgba(201,168,76,0.1)',border:'1px solid #c9a84c55',color:'#c9a84c'}}>
                {t('drafts.btnExportConfig')}
              </button>
              <div className="relative group">
                <label className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors cursor-pointer block" style={{background:'rgba(201,168,76,0.1)',border:'1px solid #c9a84c55',color:'#c9a84c'}}>
                  {t('drafts.btnImportConfig')}
                  <input type="file" accept=".json" onChange={importDraftConfig} className="hidden" />
                </label>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 px-3 py-2 font-mono text-[10px] leading-snug pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                  style={{background:'#0d1208',border:'1px solid #c9a84c55',color:'#a89060'}}>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{borderBottomColor:'#c9a84c55'}} />
                  <div className="text-[#c9a84c] font-bold tracking-widest uppercase mb-1">{t('drafts.btnImportConfig')}</div>
                  {t('drafts.tooltipImportConfig')}
                </div>
              </div>
              <button onClick={() => setIsCreating(true)} className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}>
                {t('drafts.btnNewDraft')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Drafts List */}
          <div className="lg:col-span-1">
            <div style={{background:'#0d1208',border:'1px solid #3a4a2a'}}>
              <div className="px-4 py-2" style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                <h2 className="text-xs font-mono tracking-widest uppercase" style={{color:'#c9a84c'}}>DRAFTS ({drafts.length})</h2>
              </div>
              <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                {drafts.length === 0 ? (
                  <p className="font-mono text-xs text-center py-8" style={{color:'#3a5a2a'}}>
                    {t('drafts.listEmpty')}<br />
                    {t('drafts.listEmptyClick')}
                  </p>
                ) : (
                  drafts.map(draft => (
                    <div
                      key={draft.id}
                      className="p-2 cursor-pointer corner-clip-sm transition-colors"
                      style={{
                        background: selectedDraft?.id === draft.id ? 'rgba(201,168,76,0.1)' : 'rgba(0,0,0,0.2)',
                        border: selectedDraft?.id === draft.id ? '1px solid #c9a84c55' : '1px solid #2a3a1a'
                      }}
                      onClick={() => setSelectedDraft(draft)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-mono text-xs font-bold truncate" style={{color: selectedDraft?.id === draft.id ? '#c9a84c' : '#e8d5a0'}}>{draft.name}</h3>
                          <p className="font-mono text-xs mt-0.5" style={{color:'#4a5e3a'}}>
                            {draft.results?.length || 0} {t('drafts.players')} / {draft.settings?.numberOfPlayers || 0} {t('drafts.slots')}
                          </p>
                          <p className="font-mono text-xs mt-0.5" style={{color:'#2a3a1a'}}>
                            {new Date(draft.updatedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => showDeleteConfirmation(draft.id, e)}
                          className="font-mono text-xs ml-2 px-1" style={{color:'#6a3a3a'}}
                          title={t('drafts.excluirTitle')}
                        >
                          {t('drafts.excluir')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Draft Details */}
          <div className="lg:col-span-2">
            {selectedDraft ? (
              <div style={{background:'#0d1208',border:'1px solid #3a4a2a'}}>
                <div className="px-4 py-3 flex justify-between items-start" style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                  <div>
                    <h2 className="text-sm font-bold font-mono tracking-widest uppercase" style={{color:'#e8d5a0'}}>{selectedDraft.name}</h2>
                    {selectedDraft.description && (
                      <p className="text-xs font-mono mt-1" style={{color:'#5a7a4a'}}>{selectedDraft.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs font-mono" style={{color:'#4a5e3a'}}>
                      <span>{selectedDraft.settings?.numberOfPlayers || 0} {t('drafts.players')}</span>
                      <span>/ {selectedDraft.settings?.boostersPerPlayer || 0} {t('drafts.boosters')}</span>
                      <span>/ {selectedDraft.availableUnits?.length || 0} {t('drafts.units')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/game-mode?draftId=${selectedDraft.id}`)}
                      className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors"
                      style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}
                    >
                      {t('drafts.btnGameMode')}
                    </button>
                    <button
                      onClick={() => regenerateDraft(selectedDraft)}
                      disabled={isGenerating}
                      className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-50"
                      style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}
                    >
                      {isGenerating ? t('drafts.regenerating') : t('drafts.btnRegenerate')}
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {!selectedDraft.results || selectedDraft.results.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="font-mono text-xs mb-4" style={{color:'#4a5e3a'}}>{t('drafts.notGenerated')}</p>
                      <button
                        onClick={() => regenerateDraft(selectedDraft)}
                        className="px-6 py-2 font-mono text-xs corner-clip-sm transition-colors"
                        style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}
                      >
                        {t('drafts.btnGenerate')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="font-mono text-xs tracking-widest" style={{color:'#5a7a4a'}}>{t('drafts.resultsLabel')}</h3>
                      {selectedDraft.results?.map(result => (
                        <div key={result.playerId} className="p-3" style={{border:'1px solid #2a3a1a',background:'rgba(0,0,0,0.2)'}}>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-mono text-xs font-bold" style={{color:'#c9a84c'}}>{result.playerName}</h4>
                            <div className="flex gap-4 text-xs font-mono">
                              <span style={{color:'#7a9a5a'}}>{t('drafts.draftPts')} {result.totalPoints} pts</span>
                              <span style={{color:'#c9a84c'}}>{t('drafts.armyPts')} {result.armyPoints || 0} pts</span>
                            </div>
                          </div>
                          
                          {/* Kanban-style Draft and Army */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Draft Column */}
                            <div>
                              {(() => {
                                const draftedUnits = result.units.filter(u => !u.isCard)
                                const draftedCards = result.units.filter(u => u.isCard)
                                const armyPts = result.armyPoints || 0
                                const limit = result.armyPointsLimit || 0
                                const renderRow = (unit: DraftUnit, index: number) => {
                                  const wouldExceed = limit > 0 && armyPts + unit.points > limit
                                  return (
                                  <div
                                    key={`${unit.id}-${index}`}
                                    className="flex items-center justify-between px-2 py-1 transition-colors"
                                    style={{background: unit.isCard ? 'rgba(201,168,76,0.04)' : 'rgba(90,90,90,0.05)', border: `1px solid ${unit.isCard ? '#2a2010' : '#1a1a10'}`}}
                                  >
                                    <div className="flex-1 cursor-pointer" onClick={() => {
                                      if (unit.isCard) {
                                        const base = unit.cardType === 'MC' ? '/cards/mercenary-contract/detail'
                                          : unit.cardType === 'P' ? '/cards/pilot/detail'
                                          : unit.cardType === 'G' ? '/cards/gear/detail'
                                          : unit.cardType === 'SA' ? '/cards/situational-alliance/detail'
                                          : '/cards/faction-pride/detail'
                                        const dbId = unit.cardDbId || availableCards.find(c => c.id === unit.id)?.dbId || unit.id
                                        router.push(`${base}?id=${dbId}`)
                                      } else {
                                        router.push(`/list?unitId=${unit.id}`)
                                      }
                                    }}>
                                      <div className="font-mono text-xs" style={{color: unit.isCard ? '#c9a84c' : '#a0a090'}}>{unit.name}</div>
                                      <div className="font-mono text-xs mt-0.5" style={{color:'#3a3a2a'}}>
                                        {unitTypeLabel(unit)}{unit.faction ? ` / ${unit.faction}` : ''}{classSuffix(unit)}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono text-xs font-bold" style={{color: wouldExceed ? '#c06060' : '#7a7a6a'}}>{unitPointsLabel(unit)}</span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); moveUnitToArmy(result.playerId, unit) }}
                                        disabled={wouldExceed}
                                        className="px-1.5 py-0.5 font-mono text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                                        style={{background:'rgba(122,154,90,0.2)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}
                                        title={wouldExceed ? t('drafts.limitReached') : t('drafts.moveToArmy')}
                                      >
                                        →
                                      </button>
                                    </div>
                                  </div>
                                  )
                                }
                                return (
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-mono text-xs" style={{color:'#5a7a4a'}}>DRAFT ({result.units.length})</span>
                                      <span className="font-mono text-xs" style={{color:'#7a7a6a'}}>{result.totalPoints} pts</span>
                                    </div>
                                    {draftedUnits.length > 0 && (
                                      <div className="mb-1">
                                        <div className="font-mono text-xs px-1 mb-0.5" style={{color:'#3a5a2a'}}>{t('drafts.draftedUnits')} ({draftedUnits.length})</div>
                                        <div className="space-y-1">{draftedUnits.map((u, i) => renderRow(u, i))}</div>
                                      </div>
                                    )}
                                    {draftedCards.length > 0 && (
                                      <div>
                                        <div className="font-mono text-xs px-1 mb-0.5" style={{color:'#6a5a2a'}}>{t('drafts.draftedCards')} ({draftedCards.length})</div>
                                        <div className="space-y-1">{draftedCards.map((u, i) => renderRow(u, i))}</div>
                                      </div>
                                    )}
                                    {result.units.length === 0 && (
                                      <div className="font-mono text-xs px-2 py-1 text-center" style={{color:'#3a3a2a', minHeight:'100px'}}>
                                        {t('drafts.empty')}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                            
                            {/* Army Column */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-mono text-xs" style={{color:'#5a7a4a'}}>ARMY ({(result.armyUnits || []).length})</span>
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const armyPts = computeArmyPoints(result.armyUnits || [])
                                    return result.armyPointsLimit && result.armyPointsLimit > 0 ? (
                                      <span className="font-mono text-xs" style={{color: armyPts >= result.armyPointsLimit ? '#c06060' : '#c9a84c'}}>
                                        {armyPts} / {result.armyPointsLimit} pts
                                      </span>
                                    ) : (
                                      <span className="font-mono text-xs" style={{color:'#c9a84c'}}>{armyPts} pts</span>
                                    )
                                  })()}
                                  <button
                                    onClick={() => moveAllUnitsToDraft(result.playerId)}
                                    disabled={(result.armyUnits || []).length === 0}
                                    className="px-1.5 py-0.5 font-mono text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{background:'rgba(150,50,50,0.2)',border:'1px solid #5a2a2a',color:'#c06060'}}
                                    title={t('drafts.moveAllToDraft')}
                                  >
                                    ←
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1" style={{minHeight:'100px'}}>
                                {(() => {
                                  const armyUnits = result.armyUnits || []
                                  const attachedIds = new Set(armyUnits.flatMap(u => u.attachedInstanceIds || []))
                                  const mechs = armyUnits.filter(u => !u.isCard && u.type?.toLowerCase() === 'mech')
                                  const unattachedPilots = armyUnits.filter(u => u.isCard && u.cardType === 'P' && !attachedIds.has(u.instanceId || ''))
                                  const unattachedGear = armyUnits.filter(u => u.isCard && u.cardType === 'G' && !attachedIds.has(u.instanceId || ''))
                                  const otherUnits = armyUnits.filter(u =>
                                    !(!u.isCard && u.type?.toLowerCase() === 'mech') &&
                                    !(u.isCard && (u.cardType === 'P' || u.cardType === 'G'))
                                  )

                                  const attachRow = (unit: DraftUnit, onDetach: () => void) => (
                                    <div key={unit.instanceId} className="flex items-center justify-between px-2 py-1 ml-3" style={{background:'rgba(201,168,76,0.05)',borderLeft:'2px solid #4a5e35'}}>
                                      <div className="flex-1">
                                        <div className="font-mono text-[10px] uppercase tracking-wider" style={{color:'#6a7a5a'}}>{t('drafts.cecSlot')} · {unit.cardType === 'P' ? t('drafts.pilot') : t('drafts.gear')}</div>
                                        <div className="font-mono text-xs" style={{color:'#c9a84c'}}>{unit.name}</div>
                                      </div>
                                      <button onClick={onDetach} className="px-1.5 py-0.5 font-mono text-xs" style={{background:'rgba(90,90,90,0.2)',border:'1px solid #3a3a2a',color:'#7a7a6a'}} title={t('drafts.detach')}>✕</button>
                                    </div>
                                  )

                                  const attachSelector = (mech: DraftUnit, hasPilot: boolean, key: string) => {
                                    const candidates = [...(hasPilot ? [] : unattachedPilots), ...unattachedGear]
                                    const options = candidates.filter(o => canAttachToMech(o, mech))
                                    return (
                                      <div key={key} className="flex items-center gap-1 ml-3">
                                        <span className="font-mono text-[10px] uppercase tracking-wider" style={{color:'#3a5a2a'}}>{t('drafts.cecSlot')}</span>
                                        <select
                                          className="font-mono text-[10px] px-1 py-0.5 flex-1"
                                          style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}
                                          value=""
                                          disabled={options.length === 0}
                                          onChange={e => { if (e.target.value) attachToMech(result.playerId, mech.instanceId!, e.target.value, e.target.selectedOptions[0].dataset.pilot === '1') }}
                                        >
                                          <option value="">{options.length === 0 ? '—' : t('drafts.empty')}</option>
                                          {options.map(o => (
                                            <option key={o.instanceId} value={o.instanceId} data-pilot={o.cardType === 'P' ? '1' : '0'}>
                                              {o.name} ({o.cardType === 'P' ? t('drafts.pilot') : t('drafts.gear')}, {unitPointsLabel(o)} pts)
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )
                                  }

                                  return (
                                    <>
                                      {mechs.map(mech => {
                                        const slots = mech.attachedInstanceIds || []
                                        const mountedUnits = slots.map(id => armyUnits.find(u => u.instanceId === id)).filter((u): u is DraftUnit => !!u)
                                        const hasPilot = mountedUnits.some(u => u.cardType === 'P')
                                        const effCost = mechEffectiveCost(mech, armyUnits)
                                        return (
                                          <div key={mech.instanceId} className="space-y-0.5">
                                            <div className="flex items-center justify-between px-2 py-1 cursor-pointer transition-colors" style={{background:'rgba(122,154,90,0.05)',border:'1px solid #1a2a10'}} onClick={() => router.push(`/list?unitId=${mech.id}`)}>
                                              <div className="flex-1">
                                                <div className="font-mono text-xs" style={{color:'#e8d5a0'}}>{mech.name}</div>
                                                <div className="font-mono text-xs mt-0.5" style={{color:'#4a5e3a'}}>{mech.type} / {mechFactionOf(mech)}{classSuffix({ ...mech, class: mechClassOf(mech) })}</div>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <span className="font-mono text-xs font-bold" style={{color:'#c9a84c'}}>{effCost}</span>
                                                <button onClick={(e) => { e.stopPropagation(); moveUnitToDraft(result.playerId, mech) }} className="px-1.5 py-0.5 font-mono text-xs" style={{background:'rgba(90,90,90,0.2)',border:'1px solid #3a3a2a',color:'#7a7a6a'}} title={t('drafts.moveToDraft')}>←</button>
                                              </div>
                                            </div>
                                            {mountedUnits.map(u => attachRow(u, () => detachFromMech(result.playerId, mech.instanceId!, u.instanceId!)))}
                                            {Array.from({ length: 2 - slots.length }, (_, i) => attachSelector(mech, hasPilot, `empty-${i}`))}
                                          </div>
                                        )
                                      })}
                                      {[...otherUnits, ...unattachedPilots, ...unattachedGear].map((unit, index) => (
                                        <div
                                          key={`${unit.id}-${index}`}
                                          className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-opacity-10 transition-colors"
                                          style={{background:'rgba(122,154,90,0.05)',border:'1px solid #1a2a10'}}
                                          onClick={() => {
                                            if (unit.isCard) {
                                              const base = unit.cardType === 'MC' ? '/cards/mercenary-contract/detail'
                                                : unit.cardType === 'P' ? '/cards/pilot/detail'
                                                : unit.cardType === 'G' ? '/cards/gear/detail'
                                                : unit.cardType === 'SA' ? '/cards/situational-alliance/detail'
                                                : '/cards/faction-pride/detail'
                                              const dbId = unit.cardDbId || availableCards.find(c => c.id === unit.id)?.dbId || unit.id
                                              router.push(`${base}?id=${dbId}`)
                                            } else {
                                              router.push(`/list?unitId=${unit.id}`)
                                            }
                                          }}
                                        >
                                          <div className="flex-1">
                                            <div className="font-mono text-xs" style={{color: unit.isCard ? '#c9a84c' : '#e8d5a0'}}>{unit.name}</div>
                                            <div className="font-mono text-xs mt-0.5" style={{color:'#4a5e3a'}}>
                                              {unitTypeLabel(unit)} / {unit.faction}{classSuffix(unit)}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <span className="font-mono text-xs font-bold" style={{color:'#c9a84c'}}>{unitPointsLabel(unit)}</span>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); moveUnitToDraft(result.playerId, unit) }}
                                              className="px-1.5 py-0.5 font-mono text-xs"
                                              style={{background:'rgba(90,90,90,0.2)',border:'1px solid #3a3a2a',color:'#7a7a6a'}}
                                              title={t('drafts.moveToDraft')}
                                            >
                                              ←
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </>
                                  )
                                })()}
                                {(result.armyUnits || []).length === 0 && (
                                  <div className="font-mono text-xs px-2 py-1 text-center" style={{color:'#3a5a2a'}}>
                                    {t('drafts.empty')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center" style={{background:'rgba(0,0,0,0.2)',border:'1px dashed #2a3a1a'}}>
                <p className="font-mono text-xs" style={{color:'#3a5a2a'}}>{t('drafts.selectDraft')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Draft Animation Modal */}
        {isDrafting && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.85)'}}>
            <div className="p-8 max-w-2xl w-full mx-4" style={{background:'#0d1208',border:'1px solid #3a4a2a',boxShadow:'0 0 40px rgba(201,168,76,0.1)'}}>
              <div className="text-center">
                <h2 className="text-lg font-bold font-mono tracking-widest uppercase mb-6" style={{color:'#c9a84c'}}>{t('drafts.drawing')}</h2>

                <div className="mb-6">
                  <div className="font-mono text-xs mb-2" style={{color:'#7a9a5a'}}>
                    {t('drafts.boosterN')} {currentBooster} / {t('drafts.playerN')} {currentPlayer}
                  </div>
                  <div className="w-full h-1" style={{background:'#1a2a10'}}>
                    <div 
                      className="h-1 transition-all duration-300"
                      style={{background:'#c9a84c', width:`${(currentBooster / (draftSettings.numberOfPlayers * draftSettings.boostersPerPlayer)) * 100}%`}}
                    />
                  </div>
                </div>

                {draftAnimation && (
                  <div className="p-6 mb-4 animate-pulse" style={{background:'rgba(201,168,76,0.08)',border:'1px solid #c9a84c55'}}>
                    <div className="font-mono text-xs mb-2" style={{color:'#7a9a5a'}}>{t('drafts.unitDrawn')}</div>
                    <div className="font-bold font-mono text-lg" style={{color:'#e8d5a0'}}>{draftAnimation.unit.name}</div>
                    <div className="font-mono text-xs mt-1" style={{color:'#5a7a4a'}}>
                      {draftAnimation.unit.type} / {draftAnimation.unit.faction} / {draftAnimation.unit.points}pts
                    </div>
                    <div className="font-mono text-xs mt-2" style={{color:'#c9a84c'}}>
                      {t('drafts.toPlayerN')} {draftAnimation.player}
                    </div>
                  </div>
                )}

                <div className="font-mono text-xs" style={{color:'#3a5a2a'}}>
                  {t('drafts.waiting')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.85)'}}>
            <div className="p-6 max-w-md w-full mx-4" style={{background:'#0d1208',border:'1px solid #5a2a2a'}}>
              <h3 className="font-mono text-sm font-bold tracking-widest uppercase mb-3" style={{color:'#c06060'}}>{t('drafts.confirmDelete')}</h3>
              <p className="font-mono text-xs mb-6" style={{color:'#5a7a4a'}}>
                {t('drafts.deleteWarning')}
              </p>
              <div className="flex gap-3">
                <button onClick={cancelDelete} className="flex-1 px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>
                  {t('common.cancel')}
                </button>
                <button onClick={confirmDeleteDraft} className="flex-1 px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(150,50,50,0.2)',border:'1px solid #7a2a2a',color:'#c06060'}}>
                  {t('drafts.excluir')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Collection Modal */}
        {showImportModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.85)'}}>
            <div className="p-6 max-w-md w-full mx-4 text-center" style={{background:'#0d1208',border:`1px solid ${importSuccess ? '#3a5a2a' : '#5a2a2a'}`}}>
              <div className="font-mono text-xs mb-2" style={{color: importSuccess ? '#7a9a5a' : '#c06060'}}>
                {importSuccess ? '[ OK ]' : '[ ERRO ]'}
              </div>
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-3" style={{color: importSuccess ? '#c9a84c' : '#c06060'}}>
                {importSuccess ? t('drafts.importSuccessTitle') : t('drafts.importErrorTitle')}
              </h3>
              <p className="font-mono text-xs mb-6" style={{color:'#5a7a4a'}}>{importMessage}</p>
              <button onClick={() => setShowImportModal(false)} className="w-full px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background: importSuccess ? 'rgba(122,154,90,0.15)' : 'rgba(150,50,50,0.2)', border:`1px solid ${importSuccess ? '#3a5a2a' : '#7a2a2a'}`, color: importSuccess ? '#7a9a5a' : '#c06060'}}>
                OK
              </button>
            </div>
          </div>
        )}

        {/* Config Import/Export Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.85)'}}>
            <div className="p-6 max-w-md w-full mx-4 text-center" style={{background:'#0d1208',border:`1px solid ${configSuccess ? '#3a5a2a' : '#5a2a2a'}`}}>
              <div className="font-mono text-xs mb-2" style={{color: configSuccess ? '#7a9a5a' : '#c06060'}}>
                {configSuccess ? '[ OK ]' : '[ ERRO ]'}
              </div>
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-3" style={{color: configSuccess ? '#c9a84c' : '#c06060'}}>
                {configSuccess ? t('drafts.opSuccessTitle') : t('drafts.opErrorTitle')}
              </h3>
              <p className="font-mono text-xs mb-6" style={{color:'#5a7a4a'}}>{configMessage}</p>
              <button onClick={() => setShowConfigModal(false)} className="w-full px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background: configSuccess ? 'rgba(122,154,90,0.15)' : 'rgba(150,50,50,0.2)', border:`1px solid ${configSuccess ? '#3a5a2a' : '#7a2a2a'}`, color: configSuccess ? '#7a9a5a' : '#c06060'}}>
                OK
              </button>
            </div>
          </div>
        )}

        {/* Create Draft Modal */}
        {isCreating && !isDrafting && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.85)'}}>
            <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" style={{background:'#0d1208',border:'1px solid #3a4a2a'}}>
              <div className="px-6 py-3" style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                <h3 className="font-mono text-sm font-bold tracking-widest uppercase" style={{color:'#c9a84c'}}>{t('drafts.createTitle')}</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('drafts.nameLabel')}</label>
                  <input type="text" value={newDraftName} onChange={(e) => setNewDraftName(e.target.value)} className="w-full px-3 py-2 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} placeholder={t('drafts.namePlaceholder')} autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('drafts.descLabel')}</label>
                  <textarea value={newDraftDescription} onChange={(e) => setNewDraftDescription(e.target.value)} className="w-full px-3 py-2 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} placeholder={t('drafts.descPlaceholder')} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('drafts.numPlayersLabel')}</label>
                    <input type="number" min="1" max="8" value={draftSettings.numberOfPlayers} onChange={(e) => setDraftSettings({...draftSettings, numberOfPlayers: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('drafts.boostersPlayerLabel')}</label>
                    <input type="number" min="1" max="10" value={draftSettings.boostersPerPlayer} onChange={(e) => setDraftSettings({...draftSettings, boostersPerPlayer: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('drafts.armyPointLimitLabel')}</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDraftSettings({...draftSettings, armyPointLimit: (draftSettings.armyPointLimit ?? 300) > 0 ? 0 : 300})}
                      className="px-3 py-1.5 font-mono text-xs corner-clip-sm"
                      style={{background: !(draftSettings.armyPointLimit ?? 300) ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.3)', border: !(draftSettings.armyPointLimit ?? 300) ? '1px solid #c9a84c' : '1px solid #3a4a2a', color: !(draftSettings.armyPointLimit ?? 300) ? '#c9a84c' : '#5a7a4a'}}
                    >
                      {t('drafts.noLimit')}
                    </button>
                    {(draftSettings.armyPointLimit ?? 300) > 0 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDraftSettings({...draftSettings, armyPointLimit: Math.max(150, (draftSettings.armyPointLimit ?? 300) - 150)})}
                          className="px-2 py-1.5 font-mono text-xs"
                          style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}
                        >−</button>
                        <span className="px-3 py-1.5 font-mono text-xs text-center" style={{minWidth:'70px',background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}>
                          {draftSettings.armyPointLimit ?? 300} pts
                        </span>
                        <button
                          onClick={() => setDraftSettings({...draftSettings, armyPointLimit: (draftSettings.armyPointLimit ?? 300) + 150})}
                          className="px-2 py-1.5 font-mono text-xs"
                          style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}
                        >+</button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono mb-2" style={{color:'#5a7a4a'}}>{t('drafts.sourceLabel')}</label>
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setUseCollectionAsSource(false)} className="flex-1 px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors" style={{background: !useCollectionAsSource ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.3)', border: !useCollectionAsSource ? '1px solid #c9a84c' : '1px solid #3a4a2a', color: !useCollectionAsSource ? '#c9a84c' : '#5a7a4a'}}>
                      API ({availableUnits.length})
                    </button>
                    <button onClick={() => setUseCollectionAsSource(true)} disabled={collectionUnits.length === 0} className="flex-1 px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-40" style={{background: useCollectionAsSource ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.3)', border: useCollectionAsSource ? '1px solid #c9a84c' : '1px solid #3a4a2a', color: useCollectionAsSource ? '#c9a84c' : '#5a7a4a'}}>
                      {t('drafts.collection')} ({collectionUnits.length})
                    </button>
                  </div>
                  {useCollectionAsSource && collectionUnits.length === 0 && (
                    <p className="font-mono text-xs mb-2" style={{color:'#c09060'}}>{t('drafts.useImportHint')}</p>
                  )}
                  <button onClick={() => setShowUnitSelector(true)} disabled={useCollectionAsSource && collectionUnits.length === 0} className="w-full px-4 py-2 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-40" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>
                    {t('drafts.btnSelectUnits')} ({selectedUnits.length})
                  </button>
                  {selectedUnits.length > 0 && (
                    <div className="mt-1 font-mono text-xs" style={{color:'#4a5e3a'}}>
                      {t('drafts.typesLabel')} {[...new Set(selectedUnits.map(u => u.unit.type))].join(', ')}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono mb-2" style={{color:'#5a7a4a'}}>{t('drafts.cardsLabel')}</label>
                  <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>
                    {availableCards.length} {t('drafts.cardsAutoIncluded')}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono mb-2" style={{color:'#5a7a4a'}}>{t('drafts.boosterConfigLabel')}</label>
                  <div className="space-y-2">
                    {draftSettings.boosterConfigs.map((config, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input type="number" min="0" max="10" value={config.quantity} onChange={(e) => { const c = [...draftSettings.boosterConfigs]; c[index].quantity = parseInt(e.target.value) || 0; setDraftSettings({...draftSettings, boosterConfigs: c}) }} className="w-20 px-2 py-1 text-xs font-mono text-center" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
                        <span className="font-mono text-xs" style={{color: config.unitType === 'Card' ? '#c9a84c' : '#7a9a5a'}}>{config.unitType}</span>
                        {config.unitType === 'Card' && (
                          <span className="font-mono text-xs" style={{color:'#4a5e3a'}}>({t('drafts.cardsAvailableN')} {availableCards.length})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => { setIsCreating(false); setNewDraftName(''); setNewDraftDescription('') }} className="flex-1 px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#5a7a4a'}}>
                  {t('common.cancel')}
                </button>
                <button onClick={() => generateDraft()} disabled={!newDraftName.trim()} className="flex-1 px-4 py-2 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}>
                  {t('drafts.btnCreate')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unit Selector Modal */}
        {showUnitSelector && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.85)'}}>
            <div className="max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" style={{background:'#0d1208',border:'1px solid #3a4a2a'}}>
              <div className="px-4 py-3 flex justify-between items-center" style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                <h3 className="font-mono text-xs tracking-widest uppercase" style={{color:'#c9a84c'}}>{t('drafts.selectorTitle')} ({filteredUnits.length})</h3>
                <button onClick={() => setShowUnitSelector(false)} className="font-mono text-xs px-2" style={{color:'#5a7a4a'}}>✕</button>
              </div>

              {/* Filters */}
              <div className="p-4" style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.2)'}}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('drafts.btnSearch')}</label>
                    <input type="text" placeholder={t('drafts.unitNamePlaceholder')} value={unitFilters.search} onChange={(e) => setUnitFilters({...unitFilters, search: e.target.value})} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('search.type')}</label>
                    <select value={unitFilters.type} onChange={(e) => setUnitFilters({...unitFilters, type: e.target.value})} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}>
                      <option value="">{t('drafts.allTypes')}</option>
                      {[...new Set(availableUnits.map(u => u.type))].sort().map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('drafts.ptsMin')}</label>
                      <input type="number" placeholder="0" value={unitFilters.minPoints} onChange={(e) => setUnitFilters({...unitFilters, minPoints: e.target.value})} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('drafts.ptsMax')}</label>
                      <input type="number" placeholder="999" value={unitFilters.maxPoints} onChange={(e) => setUnitFilters({...unitFilters, maxPoints: e.target.value})} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('drafts.factionsLabel')} ({unitFilters.factions.length})</label>
                    <div className="max-h-24 overflow-y-auto p-2" style={{border:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                      {[...new Set(availableUnits.map(u => u.faction))].sort().map(faction => (
                        <label key={faction} className="flex items-center gap-2 py-0.5 cursor-pointer">
                          <input type="checkbox" checked={unitFilters.factions.includes(faction)} onChange={(e) => { if(e.target.checked) setUnitFilters({...unitFilters, factions:[...unitFilters.factions,faction]}); else setUnitFilters({...unitFilters, factions:unitFilters.factions.filter(f=>f!==faction)}) }} style={{accentColor:'#c9a84c'}} />
                          <span className="font-mono text-xs" style={{color:'#7a9a5a'}}>{faction}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('drafts.expansionsLabel')} ({unitFilters.expansions.length})</label>
                    <div className="max-h-24 overflow-y-auto p-2" style={{border:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                      {[...new Set(availableUnits.map(u => u.expansion))].sort().map(expansion => (
                        <label key={expansion} className="flex items-center gap-2 py-0.5 cursor-pointer">
                          <input type="checkbox" checked={unitFilters.expansions.includes(expansion)} onChange={(e) => { if(e.target.checked) setUnitFilters({...unitFilters, expansions:[...unitFilters.expansions,expansion]}); else setUnitFilters({...unitFilters, expansions:unitFilters.expansions.filter(ex=>ex!==expansion)}) }} style={{accentColor:'#c9a84c'}} />
                          <span className="font-mono text-xs" style={{color:'#7a9a5a'}}>{expansion}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setUnitFilters({factions:[],expansions:[],type:'',minPoints:'',maxPoints:'',search:''})} className="px-3 py-1 font-mono text-xs corner-clip-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#5a7a4a'}}>{t('drafts.btnClear')}</button>
                  <button onClick={() => setSelectedUnits([...selectedUnits, ...filteredUnits.filter(u => !selectedUnits.some(s => s.unit.id === u.id)).map(u => ({unit:u, quantity:1}))])} className="px-3 py-1 font-mono text-xs corner-clip-sm" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>{t('drafts.btnSelectAll')}</button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <table className="w-full table-fixed">
                  <thead className="sticky top-0 z-10" style={{background:'rgba(10,15,6,0.97)',borderBottom:'1px solid #2a3a1a'}}>
                    <tr>
                      <th className="px-2 py-2 w-8 text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('drafts.colSel')}</th>
                      <th className="px-2 py-2 w-32 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('search.colName')}</th>
                      <th className="px-2 py-2 w-16 text-center text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('search.colType')}</th>
                      <th className="px-2 py-2 w-20 text-center text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('drafts.colFaction')}</th>
                      <th className="px-2 py-2 w-12 text-center text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>PTS</th>
                      <th className="px-2 py-2 w-24 text-center text-xs font-mono" style={{color:'#5a7a4a'}}>{t('drafts.colQty')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.map((unit) => {
                      const selectedUnit = selectedUnits.find(u => u.unit.id === unit.id)
                      const isSelected = !!selectedUnit
                      return (
                        <tr key={unit.id} style={{borderBottom:'1px solid #1a2a10', background: isSelected ? 'rgba(201,168,76,0.06)' : 'transparent'}}>
                          <td className="px-2 py-1.5 text-center" style={{borderRight:'1px solid #1a2a10'}}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleUnitSelection(unit)} style={{accentColor:'#c9a84c'}} />
                          </td>
                          <td className="px-2 py-1.5" style={{borderRight:'1px solid #1a2a10'}}>
                            <div className="font-mono text-xs truncate" style={{color:'#e8d5a0'}}>{unit.name} {unit.isUnique && "★"}</div>
                            <div className="font-mono text-xs truncate" style={{color:'#3a5a2a'}}>{unit.variant}</div>
                          </td>
                          <td className="px-2 py-1.5 text-xs font-mono text-center capitalize" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{unit.type}</td>
                          <td className="px-2 py-1.5 text-xs font-mono text-center truncate" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{unit.faction}</td>
                          <td className="px-2 py-1.5 text-xs font-mono font-bold text-center" style={{color:'#c9a84c',borderRight:'1px solid #1a2a10'}}>{unit.points}</td>
                          <td className="px-2 py-1.5 text-center">
                            {isSelected ? (
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={(e) => { e.stopPropagation(); updateUnitQuantity(unit.id, selectedUnit.quantity - 1) }} className="w-5 h-5 text-xs font-mono flex items-center justify-center" style={{background:'rgba(150,50,50,0.3)',border:'1px solid #5a2a2a',color:'#c06060'}}>-</button>
                                <input type="number" min="1" value={selectedUnit.quantity} onChange={(e) => updateUnitQuantity(unit.id, parseInt(e.target.value)||1)} className="w-10 h-5 text-xs font-mono text-center" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} onClick={(e) => e.stopPropagation()} />
                                <button onClick={(e) => { e.stopPropagation(); updateUnitQuantity(unit.id, selectedUnit.quantity + 1) }} className="w-5 h-5 text-xs font-mono flex items-center justify-center" style={{background:'rgba(122,154,90,0.2)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>+</button>
                              </div>
                            ) : (
                              <span className="font-mono text-xs" style={{color:'#2a3a1a'}}>-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="px-4 py-3 flex justify-between items-center" style={{borderTop:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>{selectedUnits.length} {t('drafts.nSelected')}</div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedUnits([])} className="px-4 py-1.5 font-mono text-xs corner-clip-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#5a7a4a'}}>{t('drafts.btnClear')}</button>
                  <button onClick={() => setShowUnitSelector(false)} className="px-4 py-1.5 font-mono text-xs corner-clip-sm" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}>{t('drafts.btnConfirm')}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Army Unit Selector Modal */}
        {showArmyUnitSelector && editingPlayerId && selectedDraft && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.85)'}}>
            <div className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" style={{background:'#0d1208',border:'1px solid #3a4a2a'}}>
              <div className="px-4 py-3 flex justify-between items-center" style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                <h3 className="font-mono text-xs tracking-widest uppercase" style={{color:'#c9a84c'}}>{t('drafts.armySelectorTitle')} {editingPlayerId}</h3>
                <button onClick={() => { setShowArmyUnitSelector(false); setEditingPlayerId(null) }} className="font-mono text-xs px-2" style={{color:'#5a7a4a'}}>✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr style={{background:'rgba(0,0,0,0.3)'}}>
                      <th className="px-2 py-2 text-left" style={{borderBottom:'1px solid #2a3a1a',borderRight:'1px solid #2a3a1a',color:'#5a7a4a'}}>{t('search.colName')}</th>
                      <th className="px-2 py-2 text-center" style={{borderBottom:'1px solid #2a3a1a',borderRight:'1px solid #2a3a1a',color:'#5a7a4a'}}>{t('search.colType')}</th>
                      <th className="px-2 py-2 text-center" style={{borderBottom:'1px solid #2a3a1a',borderRight:'1px solid #2a3a1a',color:'#5a7a4a'}}>{t('drafts.colFaction')}</th>
                      <th className="px-2 py-2 text-center" style={{borderBottom:'1px solid #2a3a1a',color:'#5a7a4a'}}>{t('drafts.colCost')}</th>
                      <th className="px-2 py-2 text-center" style={{borderBottom:'1px solid #2a3a1a',color:'#5a7a4a'}}>{t('drafts.colAction')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDraft.availableUnits.map(({unit}) => (
                      <tr key={unit.id} style={{borderBottom:'1px solid #1a2a10'}}>
                        <td className="px-2 py-1.5" style={{borderRight:'1px solid #1a2a10'}}>
                          <div className="font-mono text-xs truncate" style={{color:'#e8d5a0'}}>{unit.name}</div>
                          <div className="font-mono text-xs truncate" style={{color:'#3a5a2a'}}>{unit.variant}</div>
                        </td>
                        <td className="px-2 py-1.5 text-xs font-mono text-center" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{unit.type}</td>
                        <td className="px-2 py-1.5 text-xs font-mono text-center truncate" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{unit.faction}</td>
                        <td className="px-2 py-1.5 text-xs font-mono font-bold text-center" style={{color:'#c9a84c',borderRight:'1px solid #1a2a10'}}>{unit.points}</td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            onClick={() => addUnitToArmy(editingPlayerId, unit)}
                            className="px-2 py-1 font-mono text-xs"
                            style={{background:'rgba(122,154,90,0.2)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}
                          >
                            {t('drafts.btnAdd')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="px-4 py-3 flex justify-end" style={{borderTop:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                <button onClick={() => { setShowArmyUnitSelector(false); setEditingPlayerId(null) }} className="px-4 py-1.5 font-mono text-xs corner-clip-sm" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}>{t('drafts.btnClose')}</button>
              </div>
            </div>
          </div>
        )}


        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.85)'}}>
            <div className="p-6 max-w-md w-full mx-4" style={{background:'#0d1208',border:'1px solid #5a2a2a'}}>
              <h3 className="font-mono text-sm font-bold tracking-widest uppercase mb-3" style={{color:'#c06060'}}>{t('drafts.confirmDelete')}</h3>
              <p className="font-mono text-xs mb-6" style={{color:'#5a7a4a'}}>
                {t('drafts.deleteWarning')}
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={cancelDelete} className="px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>
                  {t('common.cancel')}
                </button>
                <button onClick={confirmDeleteDraft} className="px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(150,50,50,0.2)',border:'1px solid #7a2a2a',color:'#c06060'}}>
                  {t('drafts.excluir')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
