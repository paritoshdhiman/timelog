"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Operation, type OperationType, type CompletionType, type SectorType, type Well, type ProjectConfiguration, type Personnel, type MainEvent, OPERATION_TYPES, PARTY_TYPES, COMPLETION_TYPES, SECTOR_TYPES, isWellUsed, isSectorUsed, MAIN_EVENTS } from "@/lib/types"
import { Trash2 } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import { CheckCircle2 } from "lucide-react"
import { PersonnelSelector } from "@/components/personnel-selector"

interface EditOperationModalProps {
  isOpen: boolean
  onClose: () => void
  operation: Operation
  onSave: (operation: Operation) => void
  onDelete: (operation: Operation) => void
  wells: Well[]
  configuration: ProjectConfiguration
  projectPersonnel: Personnel
  existingOperations: Operation[]
}

export function EditOperationModal({
  isOpen,
  onClose,
  operation,
  onSave,
  onDelete,
  wells,
  configuration,
  projectPersonnel,
  existingOperations,
}: EditOperationModalProps) {
  const [editedOperation, setEditedOperation] = useState<Operation>({
    ...operation,
    endTime: operation.endTime || undefined,
    stage: operation.stage || undefined,
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [personnel, setPersonnel] = useState<Personnel>(() => operation.personnel || {
    engineer: "",
    pumpOperator: "",
    supervisor: "",
    customerRep: ""
  })

  // Filter wells and sectors based on configuration
  const usedWells = wells.filter(well => isWellUsed(well.id, configuration))
  const usedSectors = SECTOR_TYPES.filter(sector => isSectorUsed(sector, configuration))

  // Reset form when operation changes
  useEffect(() => {
    setEditedOperation(operation)
    setPersonnel(operation.personnel || {
      engineer: "",
      pumpOperator: "",
      supervisor: "",
      customerRep: ""
    })
  }, [operation])

  useEffect(() => {
    // Skip if this is a new operation being created
    if (!operation.id) return;

    // Find the next operation that should set this operation's end time
    const nextOperation = existingOperations
      .filter(op => {
        // Filter operations that occurred after this one
        if (new Date(op.startTime) <= new Date(operation.startTime)) return false;
        
        // Business Logic for PAD Sector:
        // - PAD operations end when any new operation starts
        if (operation.sector === "PAD") {
          return true;
        }
        
        // Business Logic for Other Sectors (A, B, C, D, etc.):
        // - Sector-specific operations end when:
        //   1. The next operation in the same sector starts, OR
        //   2. A PAD operation starts
        return op.sector === operation.sector || op.sector === "PAD";
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

    // If we found a next operation, set this operation's end time to the next operation's start time
    if (nextOperation) {
      setEditedOperation(prev => ({
        ...prev,
        endTime: nextOperation.startTime
      }));
    }
  }, [operation.id, operation.startTime, operation.sector, existingOperations]);

  const calculateEndTime = (newStartTime: string | undefined, newSector: SectorType | undefined) => {
    // Return undefined if either parameter is undefined
    if (!newStartTime || !newSector) return undefined;

    // Find the next operation that should set this operation's end time
    const nextOperation = existingOperations
      .filter(op => {
        // Filter operations that occurred after the new start time
        if (new Date(op.startTime) <= new Date(newStartTime)) return false;
        
        // Business Logic for PAD Sector:
        // - PAD operations end when any new operation starts
        if (newSector === "PAD") {
          return true;
        }
        
        // Business Logic for Other Sectors (A, B, C, D, etc.):
        // - Sector-specific operations end when:
        //   1. The next operation in the same sector starts, OR
        //   2. A PAD operation starts
        return op.sector === newSector || op.sector === "PAD";
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

    return nextOperation?.startTime;
  };

  const generateStagesForWell = (wellId: string): { id: string; number: number; isCompleted: boolean }[] => {
    if (!wellId || !wells || wells.length === 0) return []

    const well = wells.find(w => w.id === wellId)
    if (!well) return []

    const maxStages = well.plannedNumberOfStages || 0
    const stages = Array.from({ length: maxStages }, (_, i) => i + 1)

    // Get all completed stages for this well
    const completedStages = existingOperations
      ?.filter((op: Operation) => op.wellId === wellId && op.type === "PUMP" && op.completed && op.stage !== null && op.stage !== undefined)
      .map((op: Operation) => Number(op.stage)) || []

    return stages.map(number => ({
      id: `${wellId}-${number}`,
      number,
      isCompleted: completedStages.includes(number)
    }))
  }

  if (!operation || !editedOperation) return null

  const formatDateTimeLocal = (dateStr: string | null | undefined) => {
    if (!dateStr) return ""

    // Parse the ISO string to a Date object
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ""

    // Format to YYYY-MM-DDThh:mm format required by datetime-local input
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedOperation: Operation = {
      id: editedOperation.id,
      wellId: editedOperation.wellId,
      type: editedOperation.type,
      startTime: editedOperation.startTime,
      endTime: editedOperation.endTime,
      stage: editedOperation.stage,
      sector: editedOperation.sector,
      party: editedOperation.party,
      mainEvent: editedOperation.mainEvent,
      completed: editedOperation.completed,
      personnel: projectPersonnel,
      completionType: editedOperation.completionType
    }

    onSave(updatedOperation)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
            Edit Operation
          </DialogTitle>
          {/* <DialogDescription>
            Edit the details of this operation.
          </DialogDescription> */}
        </DialogHeader>

        <div className="grid gap-6">
          {/* Personnel Section */}
          <div className="grid gap-4">
            <h3 className="font-medium text-muted-foreground">Personnel</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Engineer</Label>
                <Select
                  value={personnel.engineer || ""}
                  onValueChange={(value) => setPersonnel({ ...personnel, engineer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select engineer" />
                  </SelectTrigger>
                  <SelectContent>
                    {configuration.personnel.engineers?.map((engineer) => (
                      <SelectItem key={engineer} value={engineer}>
                        {engineer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pump Operator</Label>
                <Select
                  value={personnel.pumpOperator || ""}
                  onValueChange={(value) => setPersonnel({ ...personnel, pumpOperator: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pump operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {configuration.personnel.pumpOperators?.map((operator) => (
                      <SelectItem key={operator} value={operator}>
                        {operator}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Supervisor</Label>
                <Select
                  value={personnel.supervisor || ""}
                  onValueChange={(value) => setPersonnel({ ...personnel, supervisor: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {configuration.personnel.supervisors?.map((supervisor) => (
                      <SelectItem key={supervisor} value={supervisor}>
                        {supervisor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Customer Rep</Label>
                <Select
                  value={personnel.customerRep || ""}
                  onValueChange={(value) => setPersonnel({ ...personnel, customerRep: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer rep" />
                  </SelectTrigger>
                  <SelectContent>
                    {configuration.personnel.customerReps?.map((rep) => (
                      <SelectItem key={rep} value={rep}>
                        {rep}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Operation Details Section */}
          <div className="grid gap-4">
            <h3 className="font-medium text-muted-foreground">Operation Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Well</Label>
                <Select
                  value={editedOperation.wellId}
                  onValueChange={(value) => setEditedOperation({ ...editedOperation, wellId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a well" />
                  </SelectTrigger>
                  <SelectContent>
                    {usedWells.map((well) => (
                      <SelectItem key={well.id} value={well.id}>
                        {well.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editedOperation.type}
                  onValueChange={(value) => setEditedOperation({ ...editedOperation, type: value as OperationType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Stage</Label>
                <Select
                  value={editedOperation.stage?.toString() || ""}
                  onValueChange={(value) => setEditedOperation({ ...editedOperation, stage: value ? parseInt(value, 10) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateStagesForWell(editedOperation.wellId).map((stage) => (
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

              <div className="space-y-2">
                <Label>Sector</Label>
                <Select
                  value={editedOperation.sector || ""}
                  onValueChange={(value) => {
                    const newSector = value as SectorType;
                    const newEndTime = calculateEndTime(editedOperation.startTime, newSector);
                    setEditedOperation({ 
                      ...editedOperation, 
                      sector: newSector,
                      endTime: newEndTime
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {usedSectors.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Completion Type</Label>
                <Select
                  value={editedOperation.completionType || ""}
                  onValueChange={(value) => setEditedOperation({ ...editedOperation, completionType: value as CompletionType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select completion type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLETION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Main Event</Label>
                <Select
                  value={editedOperation.mainEvent || ""}
                  onValueChange={(value) => setEditedOperation({ ...editedOperation, mainEvent: value as MainEvent })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select main event" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAIN_EVENTS.map((event) => (
                      <SelectItem key={event} value={event}>
                        {event}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Party</Label>
                <Select
                  value={editedOperation.party || ""}
                  onValueChange={(value) => setEditedOperation({ ...editedOperation, party: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select party" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="datetime-local"
                  value={formatDateTimeLocal(editedOperation.startTime)}
                  onChange={(e) => {
                    if (e.target.value) {
                      const date = new Date(e.target.value)
                      // Set seconds and milliseconds to 0
                      date.setSeconds(0, 0)
                      const newStartTime = date.toISOString();
                      const newEndTime = calculateEndTime(newStartTime, editedOperation.sector);
                      setEditedOperation({ 
                        ...editedOperation, 
                        startTime: newStartTime,
                        endTime: newEndTime
                      });
                    } else {
                      setEditedOperation({ ...editedOperation, startTime: "" });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={formatDateTimeLocal(editedOperation.endTime)}
                  disabled
                />
              </div>

              <div className="flex items-center space-x-2">
                <Toggle
                  pressed={editedOperation.completed}
                  onPressedChange={(pressed) => setEditedOperation({ ...editedOperation, completed: pressed })}
                  className={`gap-2 ${
                    editedOperation.completed
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-gray-50 text-gray-700 border-gray-200"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {editedOperation.completed ? "Complete" : "Incomplete"}
                </Toggle>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {!showDeleteConfirm ? (
            <>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600"
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => {
                onDelete(operation)
                onClose()
              }}>
                Confirm Delete
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

