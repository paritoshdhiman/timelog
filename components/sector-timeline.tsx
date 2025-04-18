"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, AlertTriangle, Download, CheckCircle2 } from "lucide-react"
import { type Operation, type SectorType, type Well, type ProjectConfiguration, type Personnel, getOperationTypeColor, getOperationTypeBadgeStyles, getWellColor, getSectorColor } from "@/lib/types"
import { EditOperationModal } from "@/components/edit-operation-modal"
import { operationsToCSV, downloadCSV } from "@/lib/csv-utils"
import { Toggle } from "@/components/ui/toggle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SectorTimelineProps {
  operations: Operation[]
  wells: Well[]
  onEditOperation: (operation: Operation) => void
  onDeleteOperation: (operation: Operation) => void
  configuration: ProjectConfiguration
  onSectorSelect?: (sector: SectorType | null) => void
  projectPersonnel: Personnel
}

export function SectorTimeline({ 
  operations, 
  wells, 
  onEditOperation, 
  onDeleteOperation, 
  configuration,
  onSectorSelect,
  projectPersonnel
}: SectorTimelineProps) {
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)
  const [selectedSector, setSelectedSector] = useState<SectorType | null>(null)

  // Get unique sectors from operations that are marked as active in configuration
  const activeSectors = [...new Set(operations
    .map(op => op.sector)
    .filter((sector): sector is SectorType => 
      !!sector && 
      sector !== "PAD" && // Exclude PAD from active sectors
      configuration.sectorColors.some(c => c.sector === sector && c.isUsed)
    ))]
    .sort((a, b) => a.localeCompare(b)) // Sort sectors alphabetically

  useEffect(() => {
    // If no sector is selected and there are operations, select the first sector
    if (!selectedSector && activeSectors.length > 0) {
      setSelectedSector(activeSectors[0])
      onSectorSelect?.(activeSectors[0])  // Notify parent of initial sector selection
    }
  }, [activeSectors, selectedSector, onSectorSelect])

  // Filter operations for the selected sector (including PAD operations)
  const sectorOperations = selectedSector 
    ? operations.filter(op => op.sector === selectedSector || op.sector === "PAD")
    : []

  // Sort operations by start time (newest first)
  const sortedOperations = [...sectorOperations].sort((a, b) => {
    const aTime = new Date(a.startTime).getTime()
    const bTime = new Date(b.startTime).getTime()
    return bTime - aTime
  })

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "Ongoing"
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(dateObj)
  }

  const formatDuration = (startStr: string, endStr: string | undefined) => {
    if (!endStr) return "Ongoing"
    
    const start = new Date(startStr)
    const end = new Date(endStr)
    
    // Set seconds and milliseconds to 0 for accurate minute calculation
    start.setSeconds(0, 0)
    end.setSeconds(0, 0)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid Duration"

    const durationMs = end.getTime() - start.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.round((durationMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  const handleDownloadCSV = () => {
    if (!wells) {
      console.error("Wells data is not available")
      return
    }
    if (!selectedSector) return

    const csvContent = operationsToCSV(sectorOperations)
    const sectorName = selectedSector.replace(/\s+/g, "-").toLowerCase()
    downloadCSV(csvContent, `${sectorName}-timeline.csv`)
  }

  const handleToggleComplete = (operation: Operation) => {
    onEditOperation({
      ...operation,
      completed: !operation.completed
    })
  }

  const handleDeleteOperation = (operation: Operation) => {
    onDeleteOperation(operation)
  }

  // Group operations by time
  const groupOperationsByTime = (operations: Operation[]) => {
    // Deduplicate operations by ID
    const uniqueOperations = operations.reduce((acc, operation) => {
      if (!acc.find(op => op.id === operation.id)) {
        acc.push(operation)
      }
      return acc
    }, [] as Operation[])

    const groups: { startTime: string; operations: Operation[] }[] = []
    let currentGroup: Operation[] = []
    let currentTime: string | null = null

    uniqueOperations.forEach((op) => {
      if (!currentTime) {
        currentTime = op.startTime
        currentGroup = [op]
      } else if (op.startTime === currentTime) {
        currentGroup.push(op)
      } else {
        groups.push({ startTime: currentTime, operations: currentGroup })
        currentTime = op.startTime
        currentGroup = [op]
      }
    })

    if (currentGroup.length > 0) {
      groups.push({ startTime: currentTime!, operations: currentGroup })
    }

    return groups
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
          Variant Timeline
        </h2>
        <Button
          className="flex items-center gap-1 border-red-600/20"
          onClick={handleDownloadCSV}
          disabled={!selectedSector || sectorOperations.length === 0}
        >
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </Button>
      </div>

      <Tabs 
        value={selectedSector || ""} 
        onValueChange={(value) => {
          setSelectedSector(value as SectorType)
          onSectorSelect?.(value as SectorType)
        }}
      >
        <TabsList className="flex flex-wrap h-auto p-1 gap-1 mb-6 justify-start bg-transparent">
          {activeSectors.map((sector) => {
            const sectorColor = getSectorColor(sector, configuration)
            return (
              <TabsTrigger
                key={sector}
                value={sector}
                style={{
                  '--tab-color': 'transparent',
                  '--tab-color-active': `${sectorColor}20`,
                  '--tab-border-color': sectorColor,
                } as React.CSSProperties}
                className="data-[state=active]:bg-[var(--tab-color-active)] data-[state=active]:border-[var(--tab-border-color)] bg-[var(--tab-color)] border rounded-md transition-colors"
              >
                {sector}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <div className="mt-6">
          {activeSectors.map((sector) => (
            <TabsContent key={sector} value={sector}>
              <div className="relative">
                <div className="absolute left-[140px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600 via-rose-500 to-red-400" />

                <div className="space-y-8">
                  {groupOperationsByTime(sortedOperations).map((group, groupIndex) => {
                    const firstOp = group.operations[0]
                    const opTypeColor = getOperationTypeColor(firstOp.type)

                    return (
                      <div
                        key={groupIndex}
                        className="relative pl-[170px] animate-fadeIn"
                        style={{ animationDelay: `${groupIndex * 0.1}s` }}
                      >
                        <div className="absolute left-0 top-6 w-[130px] text-right pr-4 text-sm font-medium">
                          {formatDateTime(group.startTime)}
                        </div>

                        <div className="absolute left-[140px] top-[28px] w-[30px] h-0.5 bg-gradient-to-r from-rose-500 to-red-600" />

                        <Card
                          className={`overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4 ${opTypeColor}`}
                        >
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              {group.operations.map((operation) => {
                                const opBadgeStyles = getOperationTypeBadgeStyles(operation.type)
                                const well = wells.find(w => w.id === operation.wellId)

                                return (
                                  <div
                                    key={operation.id}
                                    className="flex items-center justify-between bg-slate-50 p-3 rounded-md border border-slate-200 transition-all duration-200 hover:bg-slate-100"
                                  >
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        {operation.sector && (
                                          <Badge 
                                            variant="outline" 
                                            className="border"
                                            style={{ 
                                              backgroundColor: getSectorColor(operation.sector, configuration),
                                              color: '#FFFFFF',
                                              borderColor: 'transparent'
                                            }}
                                          >
                                            {operation.sector}
                                          </Badge>
                                        )}
                                        <Badge 
                                          variant="outline" 
                                          className="bg-slate-100 border"
                                          style={{ 
                                            backgroundColor: getWellColor(operation.wellId, configuration),
                                            color: '#FFFFFF',
                                            borderColor: 'transparent'
                                          }}
                                        >
                                          {well?.name}
                                        </Badge>
                                        <Badge className={opBadgeStyles}>
                                          {operation.type}
                                        </Badge>
                                        {operation.stage && (
                                          <Badge variant="outline" className="bg-slate-100 border">
                                            Stage {operation.stage}
                                          </Badge>
                                        )}
                                        {operation.party && (
                                          <Badge variant="outline" className="bg-slate-100 border">
                                            {operation.party}
                                          </Badge>
                                        )}
                                        {operation.type === "PUMP" && (
                                          <Toggle
                                            pressed={operation.completed}
                                            onPressedChange={() => handleToggleComplete(operation)}
                                            className={`gap-2 ${
                                              operation.completed 
                                                ? "bg-green-50 text-green-700 border-green-200" 
                                                : "bg-gray-50 text-gray-700 border-gray-200"
                                            }`}
                                          >
                                            <CheckCircle2 className="h-4 w-4" />
                                            {operation.completed ? "Complete" : "Incomplete"}
                                          </Toggle>
                                        )}
                                      </div>
                                      {operation.endTime && (
                                        <span className="text-xs text-muted-foreground">
                                          Until: {formatDateTime(operation.endTime)} (
                                          {formatDuration(operation.startTime, operation.endTime)})
                                        </span>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingOperation(operation)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })}

                  {sortedOperations.length === 0 && (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">No operations for this sector yet.</p>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}

          {!selectedSector && (
            <Card className="p-8 text-center border-red-600/20">
              <p className="text-muted-foreground">Select a sector to view its timeline.</p>
            </Card>
          )}
        </div>
      </Tabs>

      {editingOperation && (
        <EditOperationModal
          isOpen={!!editingOperation}
          onClose={() => setEditingOperation(null)}
          operation={editingOperation}
          wells={wells}
          onSave={onEditOperation}
          onDelete={handleDeleteOperation}
          configuration={configuration}
          projectPersonnel={projectPersonnel}
          existingOperations={operations}
        />
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
} 