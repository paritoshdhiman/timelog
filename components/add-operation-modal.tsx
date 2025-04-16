"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { PlusCircle, Trash2 } from "lucide-react"
import { type Operation, type Well, type CompletionType, type SectorType, OPERATION_TYPES, PARTY_TYPES, COMPLETION_TYPES, SECTOR_TYPES, type ProjectConfiguration, isWellUsed, isSectorUsed, type Personnel, type MainEvent, MAIN_EVENTS } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import { Toggle } from "@/components/ui/toggle"
import { CheckCircle2 } from "lucide-react"
import { PersonnelSelector } from "@/components/personnel-selector"
import { useToast } from "@/components/ui/use-toast"

interface AddOperationModalProps {
  isOpen: boolean
  onClose: () => void
  wells: Well[]
  onAddOperations: (operations: Operation[]) => void
  existingOperations: Operation[]
  configuration: ProjectConfiguration
  projectPersonnel: Personnel
  initialValues?: {
    wellId?: string
    type?: Operation["type"]
    party?: string
    completionType?: CompletionType
    mainEvent?: MainEvent
    sector?: SectorType
  } | null
  selectedCompletionType: CompletionType | undefined
  selectedSector?: SectorType | null
}

interface OperationRow {
  id: string
  wellId: string
  wellName: string
  type: Operation["type"]
  party: string
  stageNumber?: number
  startTime: Date
  endTime: Date | null
  completed: boolean
  completionType?: CompletionType
  sector?: SectorType
  mainEvent?: MainEvent
  comments?: string
}

export function AddOperationModal({
  isOpen,
  onClose,
  wells,
  onAddOperations,
  existingOperations,
  configuration,
  projectPersonnel,
  initialValues,
  selectedCompletionType,
  selectedSector
}: AddOperationModalProps) {
  const { toast } = useToast()
  const [searchQueries, setSearchQueries] = useState<{ [key: string]: string }>({})

  const filterItems = (items: any[], query: string, getName: (item: any) => string) => {
    if (!query) return items
    const lowerQuery = query.toLowerCase()
    return items.filter(item => getName(item).toLowerCase().includes(lowerQuery))
  }

  const [startTime, setStartTime] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })

  const [operationRows, setOperationRows] = useState<OperationRow[]>([
    { 
      id: uuidv4(), 
      wellId: initialValues?.wellId || "", 
      type: initialValues?.type || "PUMP", 
      party: initialValues?.party || "", 
      stageNumber: undefined,
      startTime: new Date(),
      endTime: null,
      completed: false,
      completionType: initialValues?.completionType || selectedCompletionType,
      sector: initialValues?.sector || selectedSector || undefined,
      wellName: initialValues?.wellId ? wells.find(w => w.id === initialValues.wellId)?.name || "" : "",
      mainEvent: initialValues?.mainEvent || undefined,
      comments: ""
    },
  ])

  // Update operation rows when initial values change
  useEffect(() => {
    if (initialValues || selectedSector) {
      setOperationRows([{ 
        id: uuidv4(), 
        wellId: initialValues?.wellId || "", 
        type: initialValues?.type || "PUMP", 
        party: initialValues?.party || "", 
        stageNumber: undefined,
        startTime: new Date(),
        endTime: null,
        completed: false,
        completionType: initialValues?.completionType || selectedCompletionType,
        sector: initialValues?.sector || selectedSector || undefined,
        wellName: initialValues?.wellId ? wells.find(w => w.id === initialValues.wellId)?.name || "" : "",
        mainEvent: initialValues?.mainEvent || undefined,
        comments: ""
      }])
    }
  }, [initialValues, wells, selectedCompletionType, selectedSector])

  // Update all operation rows when start time changes
  const updateStartTimeForAllRows = (newStartTime: string) => {
    const date = new Date(newStartTime)
    if (!isNaN(date.getTime())) {
      setStartTime(newStartTime)
      setOperationRows(rows => 
        rows.map(row => ({
          ...row,
          startTime: date
        }))
      )
    }
  }

  // Filter wells and sectors based on configuration
  const usedWells = wells.filter(well => isWellUsed(well.id, configuration))
  const usedSectors = SECTOR_TYPES.filter(sector => isSectorUsed(sector, configuration))

  const generateStagesForWell = (wellId: string): { id: string; number: number; isCompleted: boolean }[] => {
    if (!wellId) return []

    const maxStages = wells.find(w => w.id === wellId)?.plannedNumberOfStages || 0
    const stages = Array.from({ length: maxStages }, (_, i) => i + 1)

    // Get all completed stages for this well
    const completedStages = existingOperations
      .filter(op => op.wellId === wellId && op.type === "PUMP" && op.completed && op.stage !== null && op.stage !== undefined)
      .map(op => Number(op.stage))

    return stages.map(number => ({
      id: `${wellId}-${number}`,
      number,
      isCompleted: completedStages.includes(number)
    }))
  }

  const handleAddRow = () => {
    const startDate = new Date(startTime)
    setOperationRows([
      ...operationRows,
      { 
        id: uuidv4(), 
        wellId: "", 
        type: "PUMP", 
        party: "", 
        stageNumber: undefined,
        startTime: startDate,
        endTime: null,
        completed: false,
        completionType: selectedCompletionType,
        sector: undefined,
        wellName: "",
        mainEvent: undefined,
        comments: ""
      },
    ])
  }

  const handleRemoveRow = (id: string) => {
    if (operationRows.length > 1) {
      setOperationRows(operationRows.filter((row) => row.id !== id))
    }
  }

  const updateRow = (id: string, field: keyof OperationRow, value: any) => {
    setOperationRows(operationRows.map((row) => {
      if (row.id === id) {
        // Reset stage number when well changes
        if (field === "wellId") {
          return { ...row, [field]: value, stageNumber: undefined }
        }
        return { ...row, [field]: value }
      }
      return row
    }))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    const hasEmptyFields = operationRows.some(
      (row) => !row.wellId || !row.type || !row.sector
    )

    if (hasEmptyFields) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields for each operation (including sector).",
        variant: "destructive",
      })
      return
    }

    // Create operations from rows and update end times based on sector changes
    const newOperations: Operation[] = operationRows.map((row) => {
      const operation: Operation = {
        id: row.id,
        wellId: row.wellId,
        type: row.type,
        startTime: row.startTime.toISOString(),
        endTime: row.endTime?.toISOString(),
        completed: row.completed,
        sector: row.sector,
        personnel: projectPersonnel,
        mainEvent: row.mainEvent,
        stage: row.stageNumber || undefined,
        completionType: row.completionType,
        party: row.party
      }

      // Find the last operation in the same sector or PAD operations that need to be ended
      const lastOperations = existingOperations
        .filter(op => {
          // For PAD operations, we want to end them when any new operation is added
          if (op.sector === "PAD") {
            return true
          }
          // For regular sectors, only end operations in the same sector
          return op.sector === row.sector
        })
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

      // Update end times for relevant operations
      lastOperations.forEach(lastOp => {
        if (!lastOp.endTime) {
          const lastOpIndex = existingOperations.findIndex(op => op.id === lastOp.id)
          if (lastOpIndex !== -1) {
            existingOperations[lastOpIndex] = {
              ...lastOp,
              endTime: row.startTime.toISOString()
            }
          }
        }
      })

      return operation
    })

    onAddOperations(newOperations)
  }

  const handleStageNumberChange = (index: number, value: string) => {
    setOperationRows(rows =>
      rows.map((row, i) =>
        i === index
          ? { ...row, stageNumber: value === "" ? undefined : Number(value) }
          : row
      )
    )
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          onClose()
          const now = new Date()
          const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          setStartTime(formattedNow)
          setOperationRows([{ 
            id: uuidv4(), 
            wellId: "", 
            type: "PUMP", 
            party: "", 
            stageNumber: undefined,
            startTime: now,
            endTime: null,
            completed: false,
            completionType: selectedCompletionType,
            sector: undefined,
            wellName: "",
            mainEvent: undefined,
            comments: ""
          }])
        }
      }}
    >
      <DialogContent className="sm:max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
            Add Operations
          </DialogTitle>
          <DialogDescription>
            Add one or more operations to the timeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => updateStartTimeForAllRows(e.target.value)}
                className="w-[300px]"
              />
              <p className="text-sm text-muted-foreground">
                This will also become the end time for any previous operation on the selected sector.
              </p>
            </div>

            <div className="space-y-4">
              {operationRows.map((row) => (
                <div key={row.id} className="space-y-4 p-4 border border-red-600/20 rounded-lg">
                  <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1.5fr_1.5fr] gap-4 items-start">
                    <div className="grid gap-2">
                      <Label htmlFor={`well-${row.id}`} className="text-black">Well</Label>
                      <Select 
                        value={row.wellId} 
                        onValueChange={(value: string) => updateRow(row.id, "wellId", value)}
                      >
                        <SelectTrigger id={`well-${row.id}`} className="border-red-600/20 text-black">
                          <SelectValue placeholder="Select well" />
                        </SelectTrigger>
                        <SelectContent>
                          <input
                            className="flex h-10 w-full rounded-md border border-red-600/20 bg-transparent px-3 py-2 text-sm text-black placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search wells..."
                            value={searchQueries[`well-${row.id}`] || ''}
                            onChange={(e) => setSearchQueries(prev => ({ ...prev, [`well-${row.id}`]: e.target.value }))}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          {filterItems(usedWells, searchQueries[`well-${row.id}`] || '', well => well.name).map((well) => (
                            <SelectItem key={well.id} value={well.id}>
                              {well.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`operation-${row.id}`} className="text-black">Operation Type</Label>
                      <Select
                        value={row.type}
                        onValueChange={(value: string) => updateRow(row.id, "type", value)}
                      >
                        <SelectTrigger id={`operation-${row.id}`} className="border-red-600/20 text-black">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <input
                            className="flex h-10 w-full rounded-md border border-red-600/20 bg-transparent px-3 py-2 text-sm text-black placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search types..."
                            value={searchQueries[`operation-${row.id}`] || ''}
                            onChange={(e) => setSearchQueries(prev => ({ ...prev, [`operation-${row.id}`]: e.target.value }))}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          {filterItems([...OPERATION_TYPES], searchQueries[`operation-${row.id}`] || '', type => type).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`completion-type-${row.id}`} className="text-black">Completion Type</Label>
                      <Select
                        value={row.completionType || "none"}
                        onValueChange={(value: CompletionType | "none") => updateRow(row.id, "completionType", value === "none" ? undefined : value)}
                      >
                        <SelectTrigger id={`completion-type-${row.id}`} className="border-red-600/20 text-black">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <input
                            className="flex h-10 w-full rounded-md border border-red-600/20 bg-transparent px-3 py-2 text-sm text-black placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search types..."
                            value={searchQueries[`completion-type-${row.id}`] || ''}
                            onChange={(e) => setSearchQueries(prev => ({ ...prev, [`completion-type-${row.id}`]: e.target.value }))}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          <SelectItem value="none">None</SelectItem>
                          {filterItems([...COMPLETION_TYPES], searchQueries[`completion-type-${row.id}`] || '', type => type).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`sector-${row.id}`} className="text-black">Sector *</Label>
                      <Select
                        value={row.sector || ""}
                        onValueChange={(value: SectorType) => updateRow(row.id, "sector", value)}
                        required
                      >
                        <SelectTrigger id={`sector-${row.id}`} className="border-red-600/20 text-black">
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                        <SelectContent>
                          <input
                            className="flex h-10 w-full rounded-md border border-red-600/20 bg-transparent px-3 py-2 text-sm text-black placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search sectors..."
                            value={searchQueries[`sector-${row.id}`] || ''}
                            onChange={(e) => setSearchQueries(prev => ({ ...prev, [`sector-${row.id}`]: e.target.value }))}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          {filterItems(usedSectors, searchQueries[`sector-${row.id}`] || '', sector => sector).map((sector) => (
                            <SelectItem key={sector} value={sector}>
                              {sector}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`stage-${row.id}`} className="text-black">Stage</Label>
                      <Select
                        value={row.stageNumber?.toString() || ""}
                        onValueChange={(value: string) => updateRow(row.id, "stageNumber", value === "" ? undefined : Number(value))}
                      >
                        <SelectTrigger id={`stage-${row.id}`} className="border-red-600/20 text-black">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateStagesForWell(row.wellId).map((stage) => (
                            <SelectItem 
                              key={stage.id} 
                              value={stage.number.toString()}
                              className="flex items-center gap-2"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span>{stage.number}</span>
                                {stage.isCompleted && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`main-event-${row.id}`} className="text-black">Main Event</Label>
                      <Select
                        value={row.mainEvent || "none"}
                        onValueChange={(value: MainEvent | "none") => updateRow(row.id, "mainEvent", value === "none" ? undefined : value)}
                      >
                        <SelectTrigger id={`main-event-${row.id}`} className="border-red-600/20 text-black">
                          <SelectValue placeholder="Select main event" />
                        </SelectTrigger>
                        <SelectContent>
                          <input
                            className="flex h-10 w-full rounded-md border border-red-600/20 bg-transparent px-3 py-2 text-sm text-black placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search main events..."
                            value={searchQueries[`main-event-${row.id}`] || ''}
                            onChange={(e) => setSearchQueries(prev => ({ ...prev, [`main-event-${row.id}`]: e.target.value }))}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          <SelectItem value="none">None</SelectItem>
                          {filterItems([...MAIN_EVENTS], searchQueries[`main-event-${row.id}`] || '', event => event).map((event) => (
                            <SelectItem key={event} value={event}>
                              {event}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`party-${row.id}`} className="text-black">Party</Label>
                      <Select
                        value={row.party}
                        onValueChange={(value: string) => updateRow(row.id, "party", value)}
                      >
                        <SelectTrigger id={`party-${row.id}`} className="border-red-600/20 text-black">
                          <SelectValue placeholder="Select party" />
                        </SelectTrigger>
                        <SelectContent>
                          <input
                            className="flex h-10 w-full rounded-md border border-red-600/20 bg-transparent px-3 py-2 text-sm text-black placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search parties..."
                            value={searchQueries[`party-${row.id}`] || ''}
                            onChange={(e) => setSearchQueries(prev => ({ ...prev, [`party-${row.id}`]: e.target.value }))}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          {filterItems([...PARTY_TYPES], searchQueries[`party-${row.id}`] || '', party => party).map((party) => (
                            <SelectItem key={party} value={party}>
                              {party}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`comments-${row.id}`} className="text-black">Comments</Label>
                      <Input
                        id={`comments-${row.id}`}
                        value={row.comments || ""}
                        onChange={(e) => updateRow(row.id, "comments", e.target.value)}
                        className="border-red-600/20 text-black"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddRow}
              className="flex items-center gap-2 border-red-600/20 text-black"
            >
              <PlusCircle className="h-4 w-4" />
              Add Another Well
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}