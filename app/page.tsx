"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SetupModal } from "@/components/setup-modal"
import { AddOperationModal } from "@/components/add-operation-modal"
import { Timeline } from "@/components/timeline"
import { WellTimeline } from "@/components/well-timeline"
import { ConfigureProjectModal } from "@/components/configure-project-modal"
import { ProjectPersonnel } from "@/components/project-personnel"
import type { Operation, Well, ProjectConfiguration, SectorType, Personnel, CompletionType, MainEvent } from "@/lib/types"
import { SECTOR_TYPES, OPERATION_TYPES, COMPLETION_TYPES, MAIN_EVENTS } from "@/lib/types"
import { Settings, Settings2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProjectInfoCard } from "@/components/project-info-card"
import { SectorTimeline } from "@/components/sector-timeline"
import { OldTimelineTable } from "@/components/old-timeline-table"
import { EditOperationModal } from "@/components/edit-operation-modal"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"

// Load state from localStorage
const loadState = () => {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem('projectState')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse saved state:', e)
      return null
    }
  }
  return null
}

export default function Home() {
  const [projectNumber, setProjectNumber] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string | null>(null)
  const [basin, setBasin] = useState<string | null>(null)
  const [crewName, setCrewName] = useState<string | null>(null)
  const [wells, setWells] = useState<Well[]>([])
  const [operations, setOperations] = useState<Operation[]>([])
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("sacred")
  const [initialAddValues, setInitialAddValues] = useState<{
    wellId?: string
    type?: Operation["type"]
    party?: string
    completionType?: CompletionType
    mainEvent?: MainEvent
  } | null>(null)
  const [configuration, setConfiguration] = useState<ProjectConfiguration>({
    wellColors: [],
    sectorColors: [],
    personnel: {
      engineers: [],
      pumpOperators: [],
      supervisors: [],
      customerReps: []
    }
  })
  const [projectPersonnel, setProjectPersonnel] = useState<Personnel>({
    engineer: "",
    pumpOperator: "",
    supervisor: "",
    customerRep: ""
  })
  const [selectedCompletionType, setSelectedCompletionType] = useState<CompletionType | undefined>(undefined)
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null)
  const [selectedSector, setSelectedSector] = useState<SectorType | null>(null)
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)
  const [isPersonnelExpanded, setIsPersonnelExpanded] = useState(true);

  // Load saved state on mount
  useEffect(() => {
    const savedState = loadState()
    if (savedState) {
      setProjectNumber(savedState.projectNumber)
      setProjectName(savedState.projectName)
      setBasin(savedState.basin)
      setCrewName(savedState.crewName)
      setWells(savedState.wells)
      setOperations(savedState.operations)
      setConfiguration(savedState.configuration)
      setProjectPersonnel(savedState.projectPersonnel)
      setActiveTab(savedState.activeTab || "sacred")
      setSelectedCompletionType(savedState.selectedCompletionType || undefined)
      setSelectedWellId(savedState.selectedWellId || null)
      setSelectedSector(savedState.selectedSector || null)
    }
  }, [])

  // Save state when it changes
  useEffect(() => {
    if (typeof window === 'undefined' || !projectNumber) return
    const state = {
      projectNumber,
      projectName,
      basin,
      crewName,
      wells,
      operations,
      configuration,
      projectPersonnel,
      activeTab,
      selectedCompletionType,
      selectedWellId,
      selectedSector
    }
    localStorage.setItem('projectState', JSON.stringify(state))
  }, [projectNumber, projectName, basin, crewName, wells, operations, configuration, projectPersonnel, activeTab, selectedCompletionType, selectedWellId, selectedSector])

  // Initialize configuration when wells are set
  useEffect(() => {
    if (wells.length > 0 && (!configuration.wellColors.length || !configuration.sectorColors.length)) {
      setConfiguration(prev => ({
        ...prev,
        wellColors: wells.map(well => ({
          wellId: well.id,
          color: "#000000",
          isUsed: true
        })),
        sectorColors: SECTOR_TYPES.map(sector => ({
          sector,
          color: "#000000",
          isUsed: true
        }))
      }))
    }
  }, [wells, configuration.wellColors.length, configuration.sectorColors.length])

  // Add this function to get the last entered well
  const getLastEnteredWell = () => {
    // Sort operations by start time (newest first)
    const sortedOps = [...operations].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
    return sortedOps[0]?.wellId
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!projectNumber || isSetupModalOpen || isAddModalOpen || isConfigureModalOpen) return;
      
      // Get the last entered well
      const lastWell = getLastEnteredWell()
      // Use the selected well if available, otherwise use the last entered well
      const wellToUse = selectedWellId || lastWell || wells.find(w => configuration.wellColors.find(c => c.wellId === w.id)?.isUsed)?.id;
        
      if (!wellToUse) return;

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'p':
            e.preventDefault();
            setInitialAddValues({ 
              wellId: wellToUse, 
              type: "PUMP",
              party: "LOS",
              mainEvent: "Frac"
            });
            setIsAddModalOpen(true);
            break;
          case 'd':
            e.preventDefault();
            setInitialAddValues({ 
              wellId: wellToUse, 
              type: "NPT/DT",
              party: "LOS"
            });
            setIsAddModalOpen(true);
            break;
          case 'n':
            e.preventDefault();
            setInitialAddValues({ 
              wellId: wellToUse, 
              type: "NP",
              party: "LOS",
              mainEvent: "Well Swap (Zippering)"
            });
            setIsAddModalOpen(true);
            break;
          case 'z':
            e.preventDefault();
            setInitialAddValues({ 
              wellId: wellToUse, 
              type: "NP",
              party: "LOS",
              mainEvent: "Well Swap (Zippering)"
            });
            setIsAddModalOpen(true);
            break;
          case 'w':
            e.preventDefault();
            setInitialAddValues({ 
              wellId: wellToUse, 
              type: "NP",
              party: "LOS",
              mainEvent: "Well Open/Close"
            });
            setIsAddModalOpen(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectNumber, wells, isSetupModalOpen, isAddModalOpen, isConfigureModalOpen, configuration, selectedWellId, activeTab, selectedSector, operations]);

  const handleSetupComplete = async (
    projectNum: string,
    name: string,
    basinName: string,
    fetchedWells: Well[],
    crew?: string,
  ) => {
    setProjectNumber(projectNum)
    setProjectName(name)
    setBasin(basinName)
    setCrewName(crew || null)
    setWells(fetchedWells)
    setOperations([])
    setConfiguration({
      wellColors: [],
      sectorColors: [],
      personnel: {
        engineers: [],
        pumpOperators: [],
        supervisors: [],
        customerReps: []
      }
    })
    setProjectPersonnel({
      engineer: "",
      pumpOperator: "",
      supervisor: "",
      customerRep: ""
    })
    setIsSetupModalOpen(false)
  }

  const handleAddOperations = (newOperations: Operation[]) => {
    setOperations((prev) => {
      // Add new operations with personnel
      const updatedOperations = [
        ...prev,
        ...newOperations.map(op => ({
          ...op,
          personnel: projectPersonnel,
          completionType: op.completionType
        }))
      ]

      // Sort all operations by start time
      const sortedOperations = updatedOperations.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )

      // Update end times based on sector rules
      return sortedOperations.map(op => {
        // Find the next operation that should end this operation
        const nextOperation = sortedOperations
          .filter(next => {
            // Must be after current operation
            if (new Date(next.startTime) <= new Date(op.startTime)) return false;
            
            // For PAD operations, end when any new operation starts
            if (op.sector === "PAD") {
              return true;
            }
            
            // For regular sectors (A/B/C/D), only end when:
            // 1. Next operation in same sector starts, OR
            // 2. A PAD operation starts
            return next.sector === op.sector || next.sector === "PAD";
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
        
        return {
          ...op,
          endTime: nextOperation ? nextOperation.startTime : undefined,
          completionType: op.completionType
        }
      })
    })
    setIsAddModalOpen(false)
  }

  const handleEditOperation = (editedOperation: Operation) => {
    setOperations((prev) => {
      // First update the edited operation
      const updatedOperations = prev.map((op) => 
        op.id === editedOperation.id ? { ...editedOperation, completionType: editedOperation.completionType } : op
      )

      // Sort all operations by start time
      const sortedOperations = updatedOperations.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )

      // Update end times based on sector rules
      return sortedOperations.map(op => {
        // Find the next operation that should end this operation
        const nextOperation = sortedOperations
          .filter(next => {
            // Must be after current operation
            if (new Date(next.startTime) <= new Date(op.startTime)) return false;
            
            // For PAD operations, end when any new operation starts
            if (op.sector === "PAD") {
              return true;
            }
            
            // For regular sectors (A/B/C/D), only end when:
            // 1. Next operation in same sector starts, OR
            // 2. A PAD operation starts
            return next.sector === op.sector || next.sector === "PAD";
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
        
        return {
          ...op,
          endTime: nextOperation ? nextOperation.startTime : undefined,
          completionType: op.completionType
        }
      })
    })
  }

  const handleDeleteOperation = (operation: Operation) => {
    setOperations((prev) => {
      // First remove the operation
      const remainingOperations = prev.filter((op) => op.id !== operation.id)

      // Sort operations by well and start time
      const sortedOperations = remainingOperations.sort((a, b) => {
        if (a.wellId !== b.wellId) return a.wellId.localeCompare(b.wellId)
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      })

      // Group operations by well
      const wellOperations: { [wellId: string]: Operation[] } = {}
      sortedOperations.forEach(op => {
        if (!wellOperations[op.wellId]) wellOperations[op.wellId] = []
        wellOperations[op.wellId].push(op)
      })

      // Update end times for each well's operations
      return sortedOperations.map(op => {
        const wellOps = wellOperations[op.wellId]
        const opIndex = wellOps.findIndex(o => o.id === op.id)
        const nextOp = opIndex < wellOps.length - 1 ? wellOps[opIndex + 1] : null
        
        return {
          ...op,
          endTime: nextOp ? nextOp.startTime : undefined
        }
      })
    })
  }

  const handleSaveConfiguration = (config: ProjectConfiguration) => {
    setConfiguration(config)
  }

  return (
    <div className="container mx-auto py-6 max-w-[1400px]">
      <div className="flex flex-col items-center mb-8">
        <div className="w-full max-w-xs mb-4">
          <Image
            src="https://libertyenergy.com/wp-content/uploads/2023/05/Liberty-Energy-Horizontal-Logo.png"
            alt="Liberty Energy"
            width={300}
            height={80}
            className="w-full h-auto"
          />
        </div>
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
          TimeLog - Sector Ops
        </h1>
      </div>

      {!projectNumber ? (
        <SetupModal isOpen={true} onClose={() => {}} onSetupComplete={handleSetupComplete} />
      ) : (
        <>
          <ProjectInfoCard
            projectNumber={projectNumber}
            projectName={projectName}
            basin={basin || ""}
            crew={crewName || ""}
          />
          <div className="flex gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => setIsSetupModalOpen(true)}
              className="bg-white hover:bg-gray-50"
            >
              Change Import
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsConfigureModalOpen(true)}
              className="bg-white hover:bg-gray-50"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Configure Project
            </Button>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-red-600 to-rose-500 text-white hover:from-red-500 hover:to-rose-400"
            >
              Add Operations
            </Button>
          </div>
          <div className="mb-6">
            <Collapsible 
              open={isPersonnelExpanded} 
              onOpenChange={setIsPersonnelExpanded}
              defaultOpen={true}
            >
              <div className="flex items-center gap-2 py-2 cursor-pointer w-full">
                <CollapsibleTrigger className="flex items-center gap-2">
                  {isPersonnelExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <h3 className="text-sm font-medium">Personnel Selection</h3>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <Card className="p-4 border-red-600/20">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Engineer</Label>
                      <Select
                        value={projectPersonnel.engineer}
                        onValueChange={(value) => setProjectPersonnel(prev => ({ ...prev, engineer: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Engineer" />
                        </SelectTrigger>
                        <SelectContent>
                          {configuration.personnel.engineers.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Pump Operator</Label>
                      <Select
                        value={projectPersonnel.pumpOperator}
                        onValueChange={(value) => setProjectPersonnel(prev => ({ ...prev, pumpOperator: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Pump Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {configuration.personnel.pumpOperators.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Supervisor</Label>
                      <Select
                        value={projectPersonnel.supervisor}
                        onValueChange={(value) => setProjectPersonnel(prev => ({ ...prev, supervisor: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Supervisor" />
                        </SelectTrigger>
                        <SelectContent>
                          {configuration.personnel.supervisors.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Customer Rep</Label>
                      <Select
                        value={projectPersonnel.customerRep}
                        onValueChange={(value) => setProjectPersonnel(prev => ({ ...prev, customerRep: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Customer Rep" />
                        </SelectTrigger>
                        <SelectContent>
                          {configuration.personnel.customerReps.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="space-y-2">
                      <Label>Completion Type</Label>
                      <Select
                        value={selectedCompletionType || "none"}
                        onValueChange={(value: CompletionType | "none") => setSelectedCompletionType(value === "none" ? undefined : value as CompletionType)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select Completion Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {COMPLETION_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {operations.length > 0 ? (
            <Tabs defaultValue="sacred" className="space-y-4" onValueChange={(value) => {
              if (value === "sacred") {
                setSelectedSector("PAD")
              }
            }}>
              <TabsList className="bg-white border border-red-600/20">
                <TabsTrigger 
                  value="sacred"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600/10 data-[state=active]:to-rose-500/10"
                >
                  Sacred Timeline
                </TabsTrigger>
                <TabsTrigger 
                  value="variant"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600/10 data-[state=active]:to-rose-500/10"
                >
                  Variant Timeline
                </TabsTrigger>
                <TabsTrigger 
                  value="old"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600/10 data-[state=active]:to-rose-500/10"
                >
                  Elden Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sacred">
                <Timeline
                  operations={operations}
                  wells={wells}
                  onEditOperation={handleEditOperation}
                  onDeleteOperation={handleDeleteOperation}
                  configuration={configuration}
                  projectPersonnel={projectPersonnel}
                />
              </TabsContent>

              <TabsContent value="variant">
                <SectorTimeline
                  operations={operations}
                  wells={wells}
                  onEditOperation={handleEditOperation}
                  onDeleteOperation={handleDeleteOperation}
                  configuration={configuration}
                  onSectorSelect={setSelectedSector}
                  projectPersonnel={projectPersonnel}
                />
              </TabsContent>

              <TabsContent value="old">
                <OldTimelineTable
                  operations={operations}
                  wells={wells}
                  configuration={configuration}
                  onEditOperation={setEditingOperation}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="p-8 text-center border-red-600/20">
              <p className="text-muted-foreground">
                No operations added yet. Click 'Add Operations' to get started.
              </p>
            </Card>
          )}
        </>
      )}

      <AddOperationModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setInitialAddValues(null)
        }}
        wells={wells}
        onAddOperations={handleAddOperations}
        existingOperations={operations}
        configuration={configuration}
        projectPersonnel={projectPersonnel}
        initialValues={initialAddValues}
        selectedCompletionType={selectedCompletionType}
        selectedSector={selectedSector}
      />

      <ConfigureProjectModal
        isOpen={isConfigureModalOpen}
        onClose={() => setIsConfigureModalOpen(false)}
        configuration={configuration}
        onSave={handleSaveConfiguration}
        wells={wells}
      />

      <SetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSetupComplete={handleSetupComplete}
      />

      {editingOperation && (
        <EditOperationModal
          isOpen={!!editingOperation}
          onClose={() => setEditingOperation(null)}
          operation={editingOperation}
          wells={wells}
          onSave={handleEditOperation}
          onDelete={handleDeleteOperation}
          configuration={configuration}
          projectPersonnel={projectPersonnel}
          existingOperations={operations}
        />
      )}
    </div>
  )
}

