'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Unit, Draft, DraftSettings, DraftUnitWithQuantity, DraftResult, apiService } from '@/lib/api'

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
  const [draftSettings, setDraftSettings] = useState<DraftSettings>({
    numberOfPlayers: 2,
    boostersPerPlayer: 3,
    boosterConfigs: [
      { unitType: 'Infantry', quantity: 3 },
      { unitType: 'Vehicle', quantity: 1 },
      { unitType: 'Mech', quantity: 1 }
    ],
    useCollection: false,
    respectFilters: false
  })

  // Load drafts from localStorage on mount
  useEffect(() => {
    try {
      const savedDrafts = localStorage.getItem('myDrafts')
      if (savedDrafts) {
        const parsedDrafts = JSON.parse(savedDrafts)
        // Migrate old drafts without availableUnits
        const migratedDrafts = parsedDrafts.map((draft: Draft) => ({
          ...draft,
          availableUnits: draft.availableUnits || []
        }))
        setDrafts(migratedDrafts)
        
        // Select first draft if available
        if (migratedDrafts.length > 0) {
          setSelectedDraft(migratedDrafts[0])
        }
      }

      // Load collection units from localStorage
      const savedHaveCollection = localStorage.getItem('myHaveCollection')
      if (savedHaveCollection) {
        const jsonData = JSON.parse(savedHaveCollection)
        const unitsFromCollection: Unit[] = []
        
        // Extract units from have collection
        jsonData.forEach((unit: any) => {
          // Add multiple copies based on quantity
          for (let i = 0; i < unit.quantity; i++) {
            unitsFromCollection.push(unit)
          }
        })
        setCollectionUnits(unitsFromCollection)
      }
    } catch (error) {
      console.error('Error loading drafts:', error)
    }
  }, [])

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
    localStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
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
      const updatedDrafts = drafts.filter((d: Draft) => d.id !== draftToDelete)
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
        totalPoints: 0
      })
    }
    
    // Create available units pool with pre-shuffled units
    const availableUnitsPool = [...shuffledUnits]
    const totalBoosters = settings.numberOfPlayers * settings.boostersPerPlayer
    
    // Track unit distribution to avoid clustering
    const unitDistribution = new Map<string, number>()
    
    // Animate draft process with improved randomization
    for (let boosterIndex = 0; boosterIndex < totalBoosters; boosterIndex++) {
      // Randomize player order occasionally to avoid patterns
      const shouldRandomizeOrder = boosterIndex % (settings.numberOfPlayers * 2) === 0
      const currentPlayerIndex = shouldRandomizeOrder 
        ? playerOrder[boosterIndex % settings.numberOfPlayers]
        : boosterIndex % settings.numberOfPlayers
      
      const currentPlayer = players[currentPlayerIndex]
      
      // Update UI state
      setCurrentBooster(boosterIndex + 1)
      setCurrentPlayer(currentPlayerIndex + 1)
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For each unit type in booster config
      for (const config of settings.boosterConfigs) {
        const availableUnits = availableUnitsPool.filter((unit: Unit) => 
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
    
    // Save to localStorage
    const existingDrafts = JSON.parse(localStorage.getItem('myDrafts') || '[]')
    const updatedDrafts = [...existingDrafts, newDraft]
    localStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
    
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
        else if (Array.isArray(jsonData) && jsonData.length > 0 && (jsonData[0] as { quantity?: number }).quantity !== undefined) {
          jsonData.forEach((unit: any) => {
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
          Object.entries(jsonData).forEach(([, data]: [string, any]) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Drafts</h1>
              <p className="text-gray-600 mt-2">Crie e gerencie seus drafts de unidades</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/search')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🔍 Buscar Unidades
              </button>
              <label className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer">
                📁 Importar Coleção
                <input
                  type="file"
                  accept=".json"
                  onChange={importCollectionFromFile}
                  className="hidden"
                />
              </label>
              <button
                onClick={exportDraftConfig}
                disabled={selectedUnits.length === 0 && drafts.length === 0}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📤 Exportar Config
              </button>
              <label className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer">
                📥 Importar Config
                <input
                  type="file"
                  accept=".json"
                  onChange={importDraftConfig}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ➕ Novo Draft
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Drafts List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Drafts ({drafts.length})</h2>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {drafts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum draft criado ainda.<br />
                    Clique em &quot;Gerar Draft&quot; para começar o processo de draft!
                  </p>
                ) : (
                  drafts.map(draft => (
                    <div
                      key={draft.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDraft?.id === draft.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDraft(draft)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{draft.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {draft.results?.length || 0} jogadores • {draft.settings?.numberOfPlayers || 0} slots
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(draft.updatedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => showDeleteConfirmation(draft.id, e)}
                          className="text-red-500 hover:text-red-700 ml-2"
                          title="Excluir draft"
                        >
                          🗑️
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedDraft.name}</h2>
                      {selectedDraft.description && (
                        <p className="text-gray-600 mt-1">{selectedDraft.description}</p>
                      )}
                      <div className="flex gap-4 mt-3 text-sm text-gray-500">
                        <span>{selectedDraft.settings?.numberOfPlayers || 0} jogadores</span>
                        <span>{selectedDraft.settings?.boostersPerPlayer || 0} boosters/jogador</span>
                        <span>Config: {selectedDraft.settings?.boosterConfigs?.map(c => `${c.quantity} ${c.unitType}`).join(', ') || 'Não configurado'}</span>
                        <span>{selectedDraft.availableUnits?.length || 0} unidades disponíveis</span>
                      </div>
                    </div>
                    <button
                      onClick={() => regenerateDraft(selectedDraft)}
                      disabled={isGenerating}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? '🔄 Gerando...' : '🎲 Regenerar'}
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {!selectedDraft.results || selectedDraft.results.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">Este draft ainda não foi gerado.</p>
                      <button
                        onClick={() => regenerateDraft(selectedDraft)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        🎲 Gerar Draft
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h3 className="font-medium text-gray-900 mb-4">Resultados do Draft:</h3>
                      {selectedDraft.results?.map(result => (
                        <div key={result.playerId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-gray-900">{result.playerName}</h4>
                            <span className="text-sm font-medium text-blue-600">{result.totalPoints} pontos</span>
                          </div>
                          <div className="space-y-2">
                            {result.units.map((unit, index) => (
                              <div key={`${unit.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{unit.name}</div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    <span className="inline-block mr-3">{unit.type}</span>
                                    <span className="inline-block mr-3">• {unit.faction}</span>
                                    {unit.expansion && (
                                      <span className="inline-block mr-3">• {unit.expansion}</span>
                                    )}
                                    {unit.collectionNumber && (
                                      <span className="inline-block">• #{unit.collectionNumber}</span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-gray-600">{unit.points} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg">Selecione um draft para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>

        {/* Draft Animation Modal */}
        {isDrafting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">🎲 Sorteando Draft...</h2>
                
                <div className="mb-6">
                  <div className="text-lg text-gray-700 mb-2">
                    Booster {currentBooster} - Jogador {currentPlayer}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(currentBooster / (draftSettings.numberOfPlayers * draftSettings.boostersPerPlayer)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {draftAnimation && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-4 animate-pulse">
                    <div className="text-xl font-semibold text-blue-900 mb-2">
                      🎯 Unidade Sorteada!
                    </div>
                    <div className="text-lg text-gray-800 font-medium">
                      {draftAnimation.unit.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {draftAnimation.unit.type} • {draftAnimation.unit.faction} • {draftAnimation.unit.points}pts
                    </div>
                    <div className="mt-3 text-sm text-blue-700">
                      → Adicionado ao Jogador {draftAnimation.player}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  Aguarde enquanto o draft é gerado automaticamente...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Exclusão</h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir este draft? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteDraft}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Collection Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className={`text-4xl mb-4 ${importSuccess ? 'text-green-500' : 'text-red-500'}`}>
                  {importSuccess ? '✅' : '❌'}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {importSuccess ? 'Importação Concluída' : 'Erro na Importação'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {importMessage}
                </p>
                <button
                  onClick={() => setShowImportModal(false)}
                  className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
                    importSuccess 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Config Import/Export Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <div className={`text-4xl mb-4 ${configSuccess ? 'text-green-500' : 'text-red-500'}`}>
                  {configSuccess ? '✅' : '❌'}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {configSuccess ? 'Operação Concluída' : 'Erro na Operação'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {configMessage}
                </p>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
                    configSuccess 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Draft Modal */}
        {isCreating && !isDrafting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Criar Novo Draft</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Draft *
                  </label>
                  <input
                    type="text"
                    value={newDraftName}
                    onChange={(e) => setNewDraftName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Draft Torneio 2024"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={newDraftDescription}
                    onChange={(e) => setNewDraftDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descrição do draft..."
                    rows={3}
                  />
                </div>

                {/* Draft Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Jogadores</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={draftSettings.numberOfPlayers}
                    onChange={(e) => setDraftSettings({
                      ...draftSettings,
                      numberOfPlayers: parseInt(e.target.value) || 1
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Boosters por Jogador
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={draftSettings.boostersPerPlayer}
                    onChange={(e) => setDraftSettings({
                      ...draftSettings,
                      boostersPerPlayer: parseInt(e.target.value) || 1
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Unit Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fonte das Unidades
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setUseCollectionAsSource(false)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !useCollectionAsSource 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🌐 API ({availableUnits.length})
                    </button>
                    <button
                      onClick={() => setUseCollectionAsSource(true)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        useCollectionAsSource 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      disabled={collectionUnits.length === 0}
                    >
                      📁 Coleção ({collectionUnits.length})
                    </button>
                  </div>
                  {useCollectionAsSource && collectionUnits.length === 0 && (
                    <p className="text-sm text-orange-600 mb-3">
                      ⚠️ Nenhuma coleção carregada. Use o botão &quot;Importar Coleção&quot; no cabeçalho.
                    </p>
                  )}
                  <button
                    onClick={() => setShowUnitSelector(true)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    disabled={useCollectionAsSource && collectionUnits.length === 0}
                  >
                    🎯 Selecionar Unidades ({selectedUnits.length})
                  </button>
                </div>

                {/* Unit Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidades Disponíveis ({selectedUnits.length} selecionadas)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowUnitSelector(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Selecionar Unidades
                    </button>
                    {selectedUnits.length > 0 && (
                      <button
                        onClick={() => setSelectedUnits([])}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Limpar Seleção
                      </button>
                    )}
                  </div>
                  {selectedUnits.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Tipos selecionados: {[...new Set(selectedUnits.map(u => u.unit.type))].join(', ')}
                    </div>
                  )}
                </div>

                {/* Booster Configuration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Configuração do Booster</label>
                  <div className="space-y-3">
                    {draftSettings.boosterConfigs.map((config, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={config.quantity}
                          onChange={(e) => {
                            const newConfigs = [...draftSettings.boosterConfigs]
                            newConfigs[index].quantity = parseInt(e.target.value) || 0
                            setDraftSettings({
                              ...draftSettings,
                              boosterConfigs: newConfigs
                            })
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <span className="text-sm text-gray-700">{config.unitType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setNewDraftName('')
                    setNewDraftDescription('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => generateDraft()}
                  disabled={!newDraftName.trim()}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Criar Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unit Selector Modal */}
        {showUnitSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Selecionar Unidades para o Draft ({filteredUnits.length} unidades)
                </h3>
                <button
                  onClick={() => setShowUnitSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Filters */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                    <input
                      type="text"
                      placeholder="Nome da unidade..."
                      value={unitFilters.search}
                      onChange={(e) => setUnitFilters({...unitFilters, search: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={unitFilters.type}
                      onChange={(e) => setUnitFilters({...unitFilters, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Todos</option>
                      {[...new Set(availableUnits.map(u => u.type))].sort().map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pontos Min</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={unitFilters.minPoints}
                        onChange={(e) => setUnitFilters({...unitFilters, minPoints: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pontos Max</label>
                      <input
                        type="number"
                        placeholder="999"
                        value={unitFilters.maxPoints}
                        onChange={(e) => setUnitFilters({...unitFilters, maxPoints: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-select Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facções ({unitFilters.factions.length} selecionadas)</label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                      {[...new Set(availableUnits.map(u => u.faction))].sort().map(faction => (
                        <label key={faction} className="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={unitFilters.factions.includes(faction)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUnitFilters({...unitFilters, factions: [...unitFilters.factions, faction]})
                              } else {
                                setUnitFilters({...unitFilters, factions: unitFilters.factions.filter(f => f !== faction)})
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{faction}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expansões ({unitFilters.expansions.length} selecionadas)</label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                      {[...new Set(availableUnits.map(u => u.expansion))].sort().map(expansion => (
                        <label key={expansion} className="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={unitFilters.expansions.includes(expansion)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUnitFilters({...unitFilters, expansions: [...unitFilters.expansions, expansion]})
                              } else {
                                setUnitFilters({...unitFilters, expansions: unitFilters.expansions.filter(ex => ex !== expansion)})
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{expansion}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setUnitFilters({factions: [], expansions: [], type: '', minPoints: '', maxPoints: '', search: ''})}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                  <button
                    onClick={() => setSelectedUnits([...selectedUnits, ...filteredUnits.filter(unit => !selectedUnits.some(s => s.unit.id === unit.id)).map(unit => ({ unit, quantity: 1 }))])}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Selecionar Todos Filtrados
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="bg-white max-h-[calc(100vh-400px)] overflow-y-auto">
                  <table className="w-full bg-white table-fixed divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-blue-200 sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-8 border-r border-gray-200">
                          <span className="text-xs">Sel</span>
                        </th>
                        <th scope="col" className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32 border-r border-gray-200">
                          <span className="text-xs">Nome</span>
                        </th>
                        <th scope="col" className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-16 border-r border-gray-200">
                          <span className="text-xs">Tipo</span>
                        </th>
                        <th scope="col" className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-20 border-r border-gray-200">
                          <span className="text-xs">Facção</span>
                        </th>
                        <th scope="col" className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-12 border-r border-gray-200">
                          <span className="text-xs">Pts</span>
                        </th>
                        <th scope="col" className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-20 border-r border-gray-200">
                          <span className="text-xs">Quantidade</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUnits.map((unit) => {
                        const selectedUnit = selectedUnits.find(u => u.unit.id === unit.id)
                        const isSelected = !!selectedUnit
                        return (
                          <tr key={unit.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                            <td className="px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleUnitSelection(unit)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <div className="text-xs font-medium text-gray-900 truncate">
                                {unit.name} {unit.isUnique && "★"}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {unit.variant}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-xs text-gray-900 text-center capitalize">
                              {unit.type}
                            </td>
                            <td className="px-2 py-2 text-xs text-gray-900 text-center truncate">
                              {unit.faction}
                            </td>
                            <td className="px-2 py-2 text-xs text-gray-900 font-medium text-center">
                              {unit.points}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {isSelected ? (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateUnitQuantity(unit.id, selectedUnit.quantity - 1)
                                    }}
                                    className="w-6 h-6 bg-red-500 text-white text-xs rounded hover:bg-red-600 flex items-center justify-center"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedUnit.quantity}
                                    onChange={(e) => {
                                      const qty = parseInt(e.target.value) || 1
                                      updateUnitQuantity(unit.id, qty)
                                    }}
                                    className="w-12 h-6 text-xs text-center border border-gray-300 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateUnitQuantity(unit.id, selectedUnit.quantity + 1)
                                    }}
                                    className="w-6 h-6 bg-green-500 text-white text-xs rounded hover:bg-green-600 flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {selectedUnits.length} unidades selecionadas
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedUnits([])}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Limpar Tudo
                  </button>
                  <button
                    onClick={() => setShowUnitSelector(false)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Confirmar Seleção
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmar Exclusão
              </h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir este draft? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteDraft}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
