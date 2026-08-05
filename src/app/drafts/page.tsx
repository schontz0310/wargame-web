/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Unit, Draft, DraftSettings, DraftUnitWithQuantity, DraftCardWithQuantity, DraftResult, DraftUnit, apiService, Card } from '@/lib/api'
import { safeLocalStorage } from '@/lib/storage'

export default function DraftsPage() {
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
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
  const [useCollectionAsSource, setUseCollectionAsSource] = useState(false)
  const [availableCards, setAvailableCards] = useState<Card[]>([])
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
  const [showSecretCardModal, setShowSecretCardModal] = useState(false)
  const [secretCardValue, setSecretCardValue] = useState('')
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
    respectFilters: false
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
        const parsedDrafts = JSON.parse(savedDrafts)
        // Migrate old drafts without availableUnits and new army fields
        const migratedDrafts = parsedDrafts.map((draft: any) => ({
          ...draft,
          availableUnits: draft.availableUnits || [],
          results: draft.results.map((result: any) => ({
            ...result,
            armyUnits: result.armyUnits || [],
            secretCards: result.secretCards || [],
            armyPoints: result.armyPoints || 0
          }))
        }))
        setDrafts(migratedDrafts)
        
        // Select first draft if available
        if (migratedDrafts.length > 0) {
          setSelectedDraft(migratedDrafts[0])
        }
      }

      // Load collection units from localStorage (client-side only)
      const savedHaveCollection = safeLocalStorage.getItem('myHaveCollection')
      if (savedHaveCollection) {
        const haveUnits = JSON.parse(savedHaveCollection)
        const unitsFromCollection: Unit[] = []
        
        // Extract units from have collection
        haveUnits.forEach((unit: any) => {
          // Add multiple copies based on quantity
          for (let i = 0; i < unit.quantity; i++) {
            unitsFromCollection.push({
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
        
        setCollectionUnits(unitsFromCollection)
      }
    } catch (error) {
      console.error('Error loading drafts:', error)
    }
  }, [isClient])

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
        const factionPrides = await apiService.getFactionPrides({ limit: 1000 })
        const mercenaryContracts = await apiService.getMercenaryContracts({ limit: 1000 })
        
        const allCards: Card[] = []
        
        // Convert Faction Prides to Cards
        factionPrides.factionPrides.forEach(fp => {
          allCards.push({
            id: fp.cardId,
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
        
        console.log('Total cards loaded:', allCards.length)
        setAvailableCards(allCards)
      } catch (error) {
        console.error('Error loading cards:', error)
      }
    }
    loadAllCards()
  }, [])

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
      alert('Configurações de draft inválidas')
      return
    }
    
    if (selectedUnits.length === 0) {
      alert('Selecione pelo menos uma unidade para o draft')
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
    const allCards = availableCards
    
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
        playerName: `Jogador ${i + 1}`,
        units: [],
        armyUnits: [],
        secretCards: [],
        totalPoints: 0,
        armyPoints: 0
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
            if (shuffledCards.length > 0) {
              const weights = shuffledCards.map(card => {
                const distributionCount = cardDistribution.get(card.id) || 0
                return Math.max(1, 10 - distributionCount)
              })
              
              const selectedCard = selectRandomWithWeights(shuffledCards, weights)
              
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
                cardType: selectedCard.type
              })
              
              currentPlayer.totalPoints += cardPoints
              
              // Update distribution tracking
              cardDistribution.set(selectedCard.id, (cardDistribution.get(selectedCard.id) || 0) + 1)
              
              // Remove from available pool
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
                quantity: 1
              })
              
              currentPlayer.totalPoints += selectedUnit.points
              
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
      alert('Erro ao regenerar draft. Tente novamente.')
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
        setImportMessage(`Coleção importada com sucesso! ${unitsFromFile.length} unidades carregadas.`)
        setImportSuccess(true)
        setShowImportModal(true)
      } catch (error) {
        console.error('Error importing collection:', error)
        setImportMessage('Erro ao importar coleção. Verifique se o arquivo JSON está no formato correto.')
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
          
          setConfigMessage('Configuração de draft exportada com sucesso!')
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
          
          setConfigMessage('Configuração de draft exportada com sucesso!')
          setConfigSuccess(true)
          setShowConfigModal(true)
        }
      } catch (error) {
        if ((error as any).name === 'AbortError') {
          // User cancelled the save dialog
          return
        }
        navigator.clipboard.writeText(dataStr).then(() => {
          setConfigMessage('Não foi possível baixar o arquivo. Os dados foram copiados para a área de transferência.')
          setConfigSuccess(true)
          setShowConfigModal(true)
        }).catch(() => {
          setConfigMessage('Erro ao exportar configuração. Tente novamente.')
          setConfigSuccess(false)
          setShowConfigModal(true)
        })
      }
    } catch (error) {
      console.error('Export config error:', error)
      setConfigMessage('Erro ao exportar configuração. Verifique o console para mais detalhes.')
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
          
          setConfigMessage(`Configuração importada com sucesso! ${configData.selectedUnits?.length || 0} tipos de unidades carregados.`)
          setConfigSuccess(true)
          setShowConfigModal(true)
        } else {
          setConfigMessage('Arquivo de configuração inválido. Verifique se é um arquivo de configuração de draft válido.')
          setConfigSuccess(false)
          setShowConfigModal(true)
        }
      } catch (error) {
        console.error('Error importing config:', error)
        setConfigMessage('Erro ao importar configuração. Verifique se o arquivo JSON está no formato correto.')
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

  // Army management functions
  const moveUnitToArmy = (playerId: number, unit: DraftUnit) => {
    if (!selectedDraft) return
    
    const updatedDraft = {
      ...selectedDraft,
      results: selectedDraft.results.map(result => {
        if (result.playerId === playerId) {
          // Remove from draft units
          const newDraftUnits = result.units.filter(u => u.id !== unit.id)
          // Add to army units
          const newArmyUnits = [...(result.armyUnits || []), unit]
          const secretCards = result.secretCards || []
          const newArmyPoints = newArmyUnits.reduce((sum, u) => sum + u.points, 0) + 
                               secretCards.reduce((sum, c) => sum + c.points, 0)
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

  const moveUnitToDraft = (playerId: number, unit: DraftUnit) => {
    if (!selectedDraft) return
    
    const updatedDraft = {
      ...selectedDraft,
      results: selectedDraft.results.map(result => {
        if (result.playerId === playerId) {
          // Remove from army units
          const newArmyUnits = (result.armyUnits || []).filter(u => u.id !== unit.id)
          // Add to draft units
          const newDraftUnits = [...result.units, unit]
          const secretCards = result.secretCards || []
          const newArmyPoints = newArmyUnits.reduce((sum, u) => sum + u.points, 0) + 
                               secretCards.reduce((sum, c) => sum + c.points, 0)
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
          // Move all army units back to draft
          const armyUnits = result.armyUnits || []
          const newDraftUnits = [...result.units, ...armyUnits]
          const secretCards = result.secretCards || []
          const newDraftPoints = newDraftUnits.reduce((sum, u) => sum + u.points, 0)
          const newArmyPoints = secretCards.reduce((sum, c) => sum + c.points, 0)
          
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
          const secretCards = result.secretCards || []
          const newArmyPoints = newArmyUnits.reduce((sum, u) => sum + u.points, 0) + 
                               secretCards.reduce((sum, c) => sum + c.points, 0)
          
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
          const secretCards = result.secretCards || []
          const newArmyPoints = newArmyUnits.reduce((sum, u) => sum + u.points, 0) + 
                               secretCards.reduce((sum, c) => sum + c.points, 0)
          
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

  // Secret card management functions
  const addSecretCard = (playerId: number, points: number) => {
    if (!selectedDraft) return
    
    const newSecretCard: DraftUnit = {
      id: `secret-${Date.now()}`,
      name: 'Card Secreto',
      type: 'Card',
      points: points,
      faction: '',
      quantity: 1,
      isCard: true
    }
    
    const updatedDraft = {
      ...selectedDraft,
      results: selectedDraft.results.map(result => {
        if (result.playerId === playerId) {
          const newSecretCards = [...(result.secretCards || []), newSecretCard]
          const armyUnits = result.armyUnits || []
          const newArmyPoints = armyUnits.reduce((sum, u) => sum + u.points, 0) + 
                               newSecretCards.reduce((sum, c) => sum + c.points, 0)
          
          return {
            ...result,
            secretCards: newSecretCards,
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

  const removeSecretCard = (playerId: number, cardId: string) => {
    if (!selectedDraft) return
    
    const updatedDraft = {
      ...selectedDraft,
      results: selectedDraft.results.map(result => {
        if (result.playerId === playerId) {
          const newSecretCards = (result.secretCards || []).filter(c => c.id !== cardId)
          const armyUnits = result.armyUnits || []
          const newArmyPoints = armyUnits.reduce((sum, u) => sum + u.points, 0) + 
                               newSecretCards.reduce((sum, c) => sum + c.points, 0)
          
          return {
            ...result,
            secretCards: newSecretCards,
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
              <p className="text-xs font-mono mt-1" style={{color:'#4a5e3a'}}>Crie e gerencie seus drafts de unidades</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => router.push('/search')} className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>
                BUSCAR
              </button>
              <label className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors cursor-pointer" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>
                IMP. COLEÇÃO
                <input type="file" accept=".json" onChange={importCollectionFromFile} className="hidden" />
              </label>
              <button onClick={exportDraftConfig} disabled={selectedUnits.length === 0 && drafts.length === 0} className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{background:'rgba(201,168,76,0.1)',border:'1px solid #c9a84c55',color:'#c9a84c'}}>
                EXP. CONFIG
              </button>
              <label className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors cursor-pointer" style={{background:'rgba(201,168,76,0.1)',border:'1px solid #c9a84c55',color:'#c9a84c'}}>
                IMP. CONFIG
                <input type="file" accept=".json" onChange={importDraftConfig} className="hidden" />
              </label>
              <button onClick={() => setIsCreating(true)} className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}>
                + NOVO DRAFT
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
                    Nenhum draft criado.<br />
                    Clique em &quot;+ NOVO DRAFT&quot;
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
                            {draft.results?.length || 0} jogadores / {draft.settings?.numberOfPlayers || 0} slots
                          </p>
                          <p className="font-mono text-xs mt-0.5" style={{color:'#2a3a1a'}}>
                            {new Date(draft.updatedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => showDeleteConfirmation(draft.id, e)}
                          className="font-mono text-xs ml-2 px-1" style={{color:'#6a3a3a'}}
                          title="Excluir draft"
                        >
                          DEL
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
                      <span>{selectedDraft.settings?.numberOfPlayers || 0} jogadores</span>
                      <span>/ {selectedDraft.settings?.boostersPerPlayer || 0} boosters</span>
                      <span>/ {selectedDraft.availableUnits?.length || 0} unidades</span>
                    </div>
                  </div>
                  <button
                    onClick={() => regenerateDraft(selectedDraft)}
                    disabled={isGenerating}
                    className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-50"
                    style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}
                  >
                    {isGenerating ? 'GERANDO...' : 'REGENERAR'}
                  </button>
                </div>
                
                <div className="p-4">
                  {!selectedDraft.results || selectedDraft.results.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="font-mono text-xs mb-4" style={{color:'#4a5e3a'}}>Draft ainda não foi gerado.</p>
                      <button
                        onClick={() => regenerateDraft(selectedDraft)}
                        className="px-6 py-2 font-mono text-xs corner-clip-sm transition-colors"
                        style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}
                      >
                        GERAR DRAFT
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="font-mono text-xs tracking-widest" style={{color:'#5a7a4a'}}>RESULTADOS DO DRAFT:</h3>
                      {selectedDraft.results?.map(result => (
                        <div key={result.playerId} className="p-3" style={{border:'1px solid #2a3a1a',background:'rgba(0,0,0,0.2)'}}>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-mono text-xs font-bold" style={{color:'#c9a84c'}}>{result.playerName}</h4>
                            <div className="flex gap-4 text-xs font-mono">
                              <span style={{color:'#7a9a5a'}}>Draft: {result.totalPoints} pts</span>
                              <span style={{color:'#c9a84c'}}>Army: {result.armyPoints || 0} pts</span>
                            </div>
                          </div>
                          
                          {/* Kanban-style Draft and Army */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Draft Column */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-mono text-xs" style={{color:'#5a7a4a'}}>DRAFT ({result.units.length})</span>
                                <span className="font-mono text-xs" style={{color:'#7a7a6a'}}>{result.totalPoints} pts</span>
                              </div>
                              <div className="space-y-1" style={{minHeight:'100px'}}>
                                {result.units.map((unit, index) => (
                                  <div 
                                    key={`${unit.id}-${index}`} 
                                    className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-opacity-10 transition-colors"
                                    style={{background:'rgba(90,90,90,0.05)',border:'1px solid #1a1a10'}}
                                    onClick={() => router.push(`/list?unitId=${unit.id}`)}
                                  >
                                    <div className="flex-1">
                                      <div className="font-mono text-xs" style={{color:'#a0a090'}}>{unit.name}</div>
                                      <div className="font-mono text-xs mt-0.5" style={{color:'#3a3a2a'}}>
                                        {unit.type} / {unit.faction}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono text-xs font-bold" style={{color:'#7a7a6a'}}>{unit.points}</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); moveUnitToArmy(result.playerId, unit) }}
                                        className="px-1.5 py-0.5 font-mono text-xs"
                                        style={{background:'rgba(122,154,90,0.2)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}
                                        title="Mover para Army"
                                      >
                                        →
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {result.units.length === 0 && (
                                  <div className="font-mono text-xs px-2 py-1 text-center" style={{color:'#3a3a2a'}}>
                                    Vazio
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Army Column */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-mono text-xs" style={{color:'#5a7a4a'}}>ARMY ({(result.armyUnits || []).length})</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs" style={{color:'#c9a84c'}}>{result.armyPoints || 0} pts</span>
                                  <button 
                                    onClick={() => moveAllUnitsToDraft(result.playerId)}
                                    disabled={(result.armyUnits || []).length === 0}
                                    className="px-1.5 py-0.5 font-mono text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{background:'rgba(150,50,50,0.2)',border:'1px solid #5a2a2a',color:'#c06060'}}
                                    title="Mover tudo para Draft"
                                  >
                                    ←
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1" style={{minHeight:'100px'}}>
                                {(result.armyUnits || []).map((unit, index) => (
                                  <div 
                                    key={`${unit.id}-${index}`} 
                                    className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-opacity-10 transition-colors"
                                    style={{background:'rgba(122,154,90,0.05)',border:'1px solid #1a2a10'}}
                                    onClick={() => router.push(`/list?unitId=${unit.id}`)}
                                  >
                                    <div className="flex-1">
                                      <div className="font-mono text-xs" style={{color:'#e8d5a0'}}>{unit.name}</div>
                                      <div className="font-mono text-xs mt-0.5" style={{color:'#4a5e3a'}}>
                                        {unit.type} / {unit.faction}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono text-xs font-bold" style={{color:'#c9a84c'}}>{unit.points}</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); moveUnitToDraft(result.playerId, unit) }}
                                        className="px-1.5 py-0.5 font-mono text-xs"
                                        style={{background:'rgba(90,90,90,0.2)',border:'1px solid #3a3a2a',color:'#7a7a6a'}}
                                        title="Mover para Draft"
                                      >
                                        ←
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {(result.armyUnits || []).length === 0 && (
                                  <div className="font-mono text-xs px-2 py-1 text-center" style={{color:'#3a5a2a'}}>
                                    Vazio
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Secret Cards */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-mono text-xs" style={{color:'#5a7a4a'}}>CARDS SECRETOS:</span>
                              <button 
                                onClick={() => { setEditingPlayerId(result.playerId); setSecretCardValue(''); setShowSecretCardModal(true) }}
                                className="px-2 py-0.5 font-mono text-xs"
                                style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}
                              >
                                + ADICIONAR CARD
                              </button>
                            </div>
                            <div className="space-y-1">
                              {(result.secretCards || []).map((card, index) => (
                                <div 
                                  key={`${card.id}-${index}`} 
                                  className="flex items-center justify-between px-2 py-1"
                                  style={{background:'rgba(201,168,76,0.05)',border:'1px solid #3a2a1a'}}
                                >
                                  <div className="flex-1">
                                    <div className="font-mono text-xs" style={{color:'#e8d5a0'}}>Card Secreto #{index + 1}</div>
                                    <div className="font-mono text-xs mt-0.5" style={{color:'#4a5e3a'}}>
                                      Valor: {card.points} pts
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => removeSecretCard(result.playerId, card.id)}
                                    className="px-1.5 py-0.5 font-mono text-xs"
                                    style={{background:'rgba(150,50,50,0.2)',border:'1px solid #5a2a2a',color:'#c06060'}}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              {(result.secretCards || []).length === 0 && (
                                <div className="font-mono text-xs px-2 py-1" style={{color:'#3a5a2a'}}>
                                  Nenhum card secreto adicionado
                                </div>
                              )}
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
                <p className="font-mono text-xs" style={{color:'#3a5a2a'}}>Selecione um draft para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>

        {/* Draft Animation Modal */}
        {isDrafting && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.85)'}}>
            <div className="p-8 max-w-2xl w-full mx-4" style={{background:'#0d1208',border:'1px solid #3a4a2a',boxShadow:'0 0 40px rgba(201,168,76,0.1)'}}>
              <div className="text-center">
                <h2 className="text-lg font-bold font-mono tracking-widest uppercase mb-6" style={{color:'#c9a84c'}}>SORTEANDO DRAFT...</h2>
                
                <div className="mb-6">
                  <div className="font-mono text-xs mb-2" style={{color:'#7a9a5a'}}>
                    BOOSTER {currentBooster} / JOGADOR {currentPlayer}
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
                    <div className="font-mono text-xs mb-2" style={{color:'#7a9a5a'}}>UNIDADE SORTEADA</div>
                    <div className="font-bold font-mono text-lg" style={{color:'#e8d5a0'}}>{draftAnimation.unit.name}</div>
                    <div className="font-mono text-xs mt-1" style={{color:'#5a7a4a'}}>
                      {draftAnimation.unit.type} / {draftAnimation.unit.faction} / {draftAnimation.unit.points}pts
                    </div>
                    <div className="font-mono text-xs mt-2" style={{color:'#c9a84c'}}>
                      → JOGADOR {draftAnimation.player}
                    </div>
                  </div>
                )}

                <div className="font-mono text-xs" style={{color:'#3a5a2a'}}>
                  Aguarde enquanto o draft é gerado...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.85)'}}>
            <div className="p-6 max-w-md w-full mx-4" style={{background:'#0d1208',border:'1px solid #5a2a2a'}}>
              <h3 className="font-mono text-sm font-bold tracking-widest uppercase mb-3" style={{color:'#c06060'}}>CONFIRMAR EXCLUSÃO</h3>
              <p className="font-mono text-xs mb-6" style={{color:'#5a7a4a'}}>
                Tem certeza? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button onClick={cancelDelete} className="flex-1 px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>
                  CANCELAR
                </button>
                <button onClick={confirmDeleteDraft} className="flex-1 px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(150,50,50,0.2)',border:'1px solid #7a2a2a',color:'#c06060'}}>
                  EXCLUIR
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
                {importSuccess ? 'IMPORTAÇÃO CONCLUÍDA' : 'ERRO NA IMPORTAÇÃO'}
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
                {configSuccess ? 'OPERAÇÃO CONCLUÍDA' : 'ERRO NA OPERAÇÃO'}
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
                <h3 className="font-mono text-sm font-bold tracking-widest uppercase" style={{color:'#c9a84c'}}>CRIAR NOVO DRAFT</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>NOME DO DRAFT *</label>
                  <input type="text" value={newDraftName} onChange={(e) => setNewDraftName(e.target.value)} className="w-full px-3 py-2 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} placeholder="Ex: Draft Torneio 2024" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>DESCRIÇÃO (opcional)</label>
                  <textarea value={newDraftDescription} onChange={(e) => setNewDraftDescription(e.target.value)} className="w-full px-3 py-2 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} placeholder="Descrição do draft..." rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>Nº JOGADORES</label>
                    <input type="number" min="1" max="8" value={draftSettings.numberOfPlayers} onChange={(e) => setDraftSettings({...draftSettings, numberOfPlayers: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>BOOSTERS/JOGADOR</label>
                    <input type="number" min="1" max="10" value={draftSettings.boostersPerPlayer} onChange={(e) => setDraftSettings({...draftSettings, boostersPerPlayer: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono mb-2" style={{color:'#5a7a4a'}}>FONTE DAS UNIDADES</label>
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setUseCollectionAsSource(false)} className="flex-1 px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors" style={{background: !useCollectionAsSource ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.3)', border: !useCollectionAsSource ? '1px solid #c9a84c' : '1px solid #3a4a2a', color: !useCollectionAsSource ? '#c9a84c' : '#5a7a4a'}}>
                      API ({availableUnits.length})
                    </button>
                    <button onClick={() => setUseCollectionAsSource(true)} disabled={collectionUnits.length === 0} className="flex-1 px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-40" style={{background: useCollectionAsSource ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.3)', border: useCollectionAsSource ? '1px solid #c9a84c' : '1px solid #3a4a2a', color: useCollectionAsSource ? '#c9a84c' : '#5a7a4a'}}>
                      COLEÇÃO ({collectionUnits.length})
                    </button>
                  </div>
                  {useCollectionAsSource && collectionUnits.length === 0 && (
                    <p className="font-mono text-xs mb-2" style={{color:'#c09060'}}>Use &quot;IMP. COLEÇÃO&quot; no cabeçalho primeiro.</p>
                  )}
                  <button onClick={() => setShowUnitSelector(true)} disabled={useCollectionAsSource && collectionUnits.length === 0} className="w-full px-4 py-2 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-40" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>
                    SELECIONAR UNIDADES ({selectedUnits.length})
                  </button>
                  {selectedUnits.length > 0 && (
                    <div className="mt-1 font-mono text-xs" style={{color:'#4a5e3a'}}>
                      Tipos: {[...new Set(selectedUnits.map(u => u.unit.type))].join(', ')}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono mb-2" style={{color:'#5a7a4a'}}>CARDS</label>
                  <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>
                    {availableCards.length} cards disponíveis (incluídos automaticamente)
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono mb-2" style={{color:'#5a7a4a'}}>CONFIG DO BOOSTER</label>
                  <div className="space-y-2">
                    {draftSettings.boosterConfigs.map((config, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input type="number" min="0" max="10" value={config.quantity} onChange={(e) => { const c = [...draftSettings.boosterConfigs]; c[index].quantity = parseInt(e.target.value) || 0; setDraftSettings({...draftSettings, boosterConfigs: c}) }} className="w-20 px-2 py-1 text-xs font-mono text-center" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
                        <span className="font-mono text-xs" style={{color: config.unitType === 'Card' ? '#c9a84c' : '#7a9a5a'}}>{config.unitType}</span>
                        {config.unitType === 'Card' && (
                          <span className="font-mono text-xs" style={{color:'#4a5e3a'}}>(cards disponíveis: {availableCards.length})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => { setIsCreating(false); setNewDraftName(''); setNewDraftDescription('') }} className="flex-1 px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#5a7a4a'}}>
                  CANCELAR
                </button>
                <button onClick={() => generateDraft()} disabled={!newDraftName.trim()} className="flex-1 px-4 py-2 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}>
                  CRIAR DRAFT
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
                <h3 className="font-mono text-xs tracking-widest uppercase" style={{color:'#c9a84c'}}>SELECIONAR UNIDADES ({filteredUnits.length})</h3>
                <button onClick={() => setShowUnitSelector(false)} className="font-mono text-xs px-2" style={{color:'#5a7a4a'}}>✕</button>
              </div>

              {/* Filters */}
              <div className="p-4" style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.2)'}}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>BUSCAR</label>
                    <input type="text" placeholder="Nome da unidade..." value={unitFilters.search} onChange={(e) => setUnitFilters({...unitFilters, search: e.target.value})} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
                  </div>
                  <div>
                    <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>TIPO</label>
                    <select value={unitFilters.type} onChange={(e) => setUnitFilters({...unitFilters, type: e.target.value})} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}>
                      <option value="">Todos</option>
                      {[...new Set(availableUnits.map(u => u.type))].sort().map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>PTS MIN</label>
                      <input type="number" placeholder="0" value={unitFilters.minPoints} onChange={(e) => setUnitFilters({...unitFilters, minPoints: e.target.value})} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>PTS MAX</label>
                      <input type="number" placeholder="999" value={unitFilters.maxPoints} onChange={(e) => setUnitFilters({...unitFilters, maxPoints: e.target.value})} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>FACÇÕES ({unitFilters.factions.length})</label>
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
                    <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>EXPANSÕES ({unitFilters.expansions.length})</label>
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
                  <button onClick={() => setUnitFilters({factions:[],expansions:[],type:'',minPoints:'',maxPoints:'',search:''})} className="px-3 py-1 font-mono text-xs corner-clip-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#5a7a4a'}}>LIMPAR</button>
                  <button onClick={() => setSelectedUnits([...selectedUnits, ...filteredUnits.filter(u => !selectedUnits.some(s => s.unit.id === u.id)).map(u => ({unit:u, quantity:1}))])} className="px-3 py-1 font-mono text-xs corner-clip-sm" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>SELECIONAR TODOS</button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <table className="w-full table-fixed">
                  <thead className="sticky top-0 z-10" style={{background:'rgba(10,15,6,0.97)',borderBottom:'1px solid #2a3a1a'}}>
                    <tr>
                      <th className="px-2 py-2 w-8 text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>SEL</th>
                      <th className="px-2 py-2 w-32 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>NOME</th>
                      <th className="px-2 py-2 w-16 text-center text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>TIPO</th>
                      <th className="px-2 py-2 w-20 text-center text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>FACÇÃO</th>
                      <th className="px-2 py-2 w-12 text-center text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>PTS</th>
                      <th className="px-2 py-2 w-24 text-center text-xs font-mono" style={{color:'#5a7a4a'}}>QTD</th>
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
                <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>{selectedUnits.length} SELECIONADAS</div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedUnits([])} className="px-4 py-1.5 font-mono text-xs corner-clip-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#5a7a4a'}}>LIMPAR</button>
                  <button onClick={() => setShowUnitSelector(false)} className="px-4 py-1.5 font-mono text-xs corner-clip-sm" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}>CONFIRMAR</button>
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
                <h3 className="font-mono text-xs tracking-widest uppercase" style={{color:'#c9a84c'}}>ADICIONAR UNIDADE AO ARMY - JOGADOR {editingPlayerId}</h3>
                <button onClick={() => { setShowArmyUnitSelector(false); setEditingPlayerId(null) }} className="font-mono text-xs px-2" style={{color:'#5a7a4a'}}>✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr style={{background:'rgba(0,0,0,0.3)'}}>
                      <th className="px-2 py-2 text-left" style={{borderBottom:'1px solid #2a3a1a',borderRight:'1px solid #2a3a1a',color:'#5a7a4a'}}>NOME</th>
                      <th className="px-2 py-2 text-center" style={{borderBottom:'1px solid #2a3a1a',borderRight:'1px solid #2a3a1a',color:'#5a7a4a'}}>TIPO</th>
                      <th className="px-2 py-2 text-center" style={{borderBottom:'1px solid #2a3a1a',borderRight:'1px solid #2a3a1a',color:'#5a7a4a'}}>FACÇÃO</th>
                      <th className="px-2 py-2 text-center" style={{borderBottom:'1px solid #2a3a1a',color:'#5a7a4a'}}>CUSTO</th>
                      <th className="px-2 py-2 text-center" style={{borderBottom:'1px solid #2a3a1a',color:'#5a7a4a'}}>AÇÃO</th>
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
                            ADICIONAR
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="px-4 py-3 flex justify-end" style={{borderTop:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                <button onClick={() => { setShowArmyUnitSelector(false); setEditingPlayerId(null) }} className="px-4 py-1.5 font-mono text-xs corner-clip-sm" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}>FECHAR</button>
              </div>
            </div>
          </div>
        )}

        {/* Secret Card Modal */}
        {showSecretCardModal && editingPlayerId && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.85)'}}>
            <div className="p-6 max-w-md w-full mx-4" style={{background:'#0d1208',border:'1px solid #3a2a1a'}}>
              <h3 className="font-mono text-sm font-bold tracking-widest uppercase mb-4" style={{color:'#c9a84c'}}>ADICIONAR CARD SECRETO</h3>
              <p className="font-mono text-xs mb-4" style={{color:'#5a7a4a'}}>Jogador {editingPlayerId}</p>
              
              <div className="mb-4">
                <label className="block text-xs font-mono mb-2" style={{color:'#5a7a4a'}}>VALOR DO CARD (pontos)</label>
                <input 
                  type="number" 
                  value={secretCardValue} 
                  onChange={(e) => setSecretCardValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono" 
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a2a1a',color:'#c9a84c',outline:'none'}}
                  placeholder="Ex: 10"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => { setShowSecretCardModal(false); setEditingPlayerId(null); setSecretCardValue('') }}
                  className="px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" 
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a2a1a',color:'#7a9a5a'}}
                >
                  CANCELAR
                </button>
                <button 
                  onClick={() => {
                    const points = parseInt(secretCardValue)
                    if (points > 0) {
                      addSecretCard(editingPlayerId, points)
                      setShowSecretCardModal(false)
                      setEditingPlayerId(null)
                      setSecretCardValue('')
                    }
                  }}
                  disabled={!secretCardValue || parseInt(secretCardValue) <= 0}
                  className="px-4 py-2 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed" 
                  style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}
                >
                  ADICIONAR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.85)'}}>
            <div className="p-6 max-w-md w-full mx-4" style={{background:'#0d1208',border:'1px solid #5a2a2a'}}>
              <h3 className="font-mono text-sm font-bold tracking-widest uppercase mb-3" style={{color:'#c06060'}}>CONFIRMAR EXCLUSÃO</h3>
              <p className="font-mono text-xs mb-6" style={{color:'#5a7a4a'}}>
                Tem certeza? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={cancelDelete} className="px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>
                  CANCELAR
                </button>
                <button onClick={confirmDeleteDraft} className="px-4 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(150,50,50,0.2)',border:'1px solid #7a2a2a',color:'#c06060'}}>
                  EXCLUIR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
