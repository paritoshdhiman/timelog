"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, AlertTriangle, Download, CheckCircle2 } from "lucide-react"
import { type Operation, type OperationType, type CompletionType, type SectorType, type Well, type ProjectConfiguration, type Personnel, type MainEvent, OPERATION_TYPES, PARTY_TYPES, COMPLETION_TYPES, SECTOR_TYPES, isWellUsed, isSectorUsed, MAIN_EVENTS, getOperationTypeColor, getOperationTypeBadgeStyles } from "@/lib/types"
import { EditOperationModal } from "@/components/edit-operation-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { operationsToCSV, downloadCSV } from "@/lib/csv-utils"
import { Toggle } from "@/components/ui/toggle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface WellTimelineProps {
  operations: Operation[]
  wells: Well[]
  onEditOperation: (operation: Operation) => void
  onDeleteOperation: (operation: Operation) => void
  configuration: any
  onWellSelect?: (wellId: string | null) => void
  projectPersonnel: Personnel
}

// Helper function to group operations by time period
const groupOperationsByTime = (operations: Operation[]) => {
  const timeGroups: { [key: string]: Operation[] } = {}

  // Sort operations by start time
  const sortedOperations = [...operations].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  sortedOperations.forEach((operation) => {
    if (!operation.startTime) return
    
    // Group by exact same start time
    timeGroups[operation.startTime] = timeGroups[operation.startTime] || []
    timeGroups[operation.startTime].push(operation)
  })

  // Convert to array and sort by start time (newest first)
  return Object.entries(timeGroups)
    .map(([timeKey, ops]) => {
      return {
        startTime: new Date(timeKey),
        operations: ops,
      }
    })
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()) // Reversed order
}

export function WellTimeline({ operations, wells, onEditOperation, onDeleteOperation, configuration, onWellSelect, projectPersonnel }: WellTimelineProps) {
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("variant")

  // Get unique well IDs from operations
  const wellsWithOperations = [...new Set(operations.map((op) => op.wellId))]

  // If no well is selected and there are operations, select the first well
  if (!selectedWellId && wellsWithOperations.length > 0) {
    setSelectedWellId(wellsWithOperations[0])
  }

  // Filter operations for the selected well
  const wellOperations = selectedWellId ? operations.filter((op) => op.wellId === selectedWellId) : []

  // Sort operations by start time (newest first)
  const sortedOperations = [...wellOperations].sort((a, b) => {
    const aTime = new Date(a.startTime).getTime()
    const bTime = new Date(b.startTime).getTime()
    return bTime - aTime
  })

  // Find gaps in the timeline
  const timeGaps: { start: string; end: string }[] = []

  if (sortedOperations.length > 1) {
    for (let i = 0; i < sortedOperations.length - 1; i++) {
      const currentEnd = sortedOperations[i].endTime
      const nextStart = sortedOperations[i + 1].startTime

      if (currentEnd && nextStart) {
        const currentEndDate = new Date(currentEnd)
        const nextStartDate = new Date(nextStart)
        if (currentEndDate < nextStartDate) {
          timeGaps.push({
            start: currentEnd,
            end: nextStart,
          })
        }
      }
    }
  }

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "Ongoing"
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(dateObj)
  }

  const getSectorColor = (sector: string, config: ProjectConfiguration) => {
    const sectorConfig = config.sectorColors.find((c: { sector: SectorType; color: string }) => c.sector === sector);
    return sectorConfig?.color || "#94a3b8";
  };

  const getWellColor = (wellId: string, config: ProjectConfiguration) => {
    const wellConfig = config.wellColors.find((c: { wellId: string; color: string }) => c.wellId === wellId);
    return wellConfig?.color || "#94a3b8";
  };

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
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  const selectedWellName = wells.find((w) => w.id === selectedWellId)?.name || "Select a well"

  const handleDownloadCSV = () => {
    if (!selectedWellId) return

    const csvContent = operationsToCSV(wellOperations)
    const wellName = selectedWellName.replace(/\s+/g, "-").toLowerCase()
    downloadCSV(csvContent, `${wellName}-timeline.csv`)
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

  const getOperationColor = (type: OperationType) => {
    switch (type) {
      case "NP":
        return "bg-blue-200";
      case "NPT/DT":
        return "bg-red-400";
      case "PUMP":
        return "bg-green-200";
      default:
        return "bg-gray-200";
    }
  };

  // Get the earliest and latest times from all operations
  const timeRange = operations.reduce((range, op) => {
    const start = new Date(op.startTime).getTime();
    const end = op.endTime ? new Date(op.endTime).getTime() : start;
    return {
      min: Math.min(range.min, start),
      max: Math.max(range.max, end),
    };
  }, { min: Infinity, max: -Infinity });

  // Calculate position and width for Gantt bars
  const calculateBarStyle = (operation: Operation) => {
    const start = new Date(operation.startTime).getTime();
    const end = operation.endTime ? new Date(operation.endTime).getTime() : start + 3600000; // default 1 hour if no end
    const totalDuration = timeRange.max - timeRange.min;
    
    const left = ((start - timeRange.min) / totalDuration) * 100;
    const width = ((end - start) / totalDuration) * 100;
    
    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  // Update the well selection handler
  const handleWellSelect = (wellId: string) => {
    setSelectedWellId(wellId);
    onWellSelect?.(wellId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
          Variant Timeline
        </h2>

        <Button
          className="flex items-center gap-1 border-red-600/20"
          onClick={handleDownloadCSV}
          disabled={!selectedWellId || wellOperations.length === 0}
        >
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </Button>
      </div>

      <Tabs 
        value={selectedWellId || ""} 
        onValueChange={(value) => {
          setSelectedWellId(value);
          onWellSelect?.(value);
        }}
      >
        <TabsList className="flex flex-wrap h-auto p-1 gap-1 mb-6 justify-start bg-transparent">
          {wells
            .filter((well) => wellsWithOperations.includes(well.id))
            .map((well) => {
              const wellColor = getWellColor(well.id, configuration);
              const getRgba = (hex: string, opacity: number) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${opacity})`;
              };
              
              return (
                <TabsTrigger
                  key={well.id}
                  value={well.id}
                  style={{
                    '--tab-color': 'transparent',
                    '--tab-color-active': getRgba(wellColor, 0.1),
                    '--tab-border-color': wellColor,
                  } as React.CSSProperties}
                  className="data-[state=active]:bg-[var(--tab-color-active)] data-[state=active]:border-[var(--tab-border-color)] bg-[var(--tab-color)] border rounded-md transition-colors"
                >
                  {well.name}
                </TabsTrigger>
              );
            })}
        </TabsList>

        <div className="mt-6">
          {wells
            .filter((well) => wellsWithOperations.includes(well.id))
            .map((well) => (
              <TabsContent key={well.id} value={well.id}>
                <div className="relative">
                  {/* Vertical timeline line with gradient */}
                  <div className="absolute left-[140px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600 via-rose-500 to-red-400" />

                  <div className="space-y-8">
                    {groupOperationsByTime(sortedOperations)
                      .map((group, groupIndex) => {
                        const firstOp = group.operations[0]
                        const opTypeColor = getOperationTypeColor(firstOp.type)

                        return (
                          <div
                            key={groupIndex}
                            className="relative pl-[170px] animate-fadeIn"
                            style={{ animationDelay: `${groupIndex * 0.1}s` }}
                          >
                            {/* Time on the left side */}
                            <div className="absolute left-0 top-6 w-[130px] text-right pr-4 text-sm font-medium">
                              {formatDateTime(group.startTime)}
                            </div>

                            {/* Horizontal connector line */}
                            <div className="absolute left-[140px] top-[28px] w-[30px] h-0.5 bg-gradient-to-r from-rose-500 to-red-600" />

                            <Card
                              className={`overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4 ${opTypeColor}`}
                            >
                              <CardContent className="pt-6">
                                <div className="space-y-3">
                                  {group.operations.map((operation) => {
                                    const opBadgeStyles = getOperationTypeBadgeStyles(operation.type)

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
                                              {wells.find(w => w.id === operation.wellId)?.name}
                                            </Badge>
                                            <Badge className={opBadgeStyles}>
                                              {operation.type}
                                            </Badge>
                                            {operation.stage && (
                                              <Badge variant="outline" className="bg-slate-100 border">
                                                Stage {operation.stage}
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

                            {/* Show gap after this operation if there is one */}
                            {timeGaps.some((gap) => gap.start === group.operations[group.operations.length - 1].endTime) && (
                              <div className="relative pl-0 mt-4 mb-4">
                                <div className="absolute left-[140px] top-[28px] w-[30px] h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-500" />
                                <Card className="border-l-4 border-yellow-400">
                                  <CardContent className="py-4">
                                    <div className="text-sm text-muted-foreground">
                                      <AlertTriangle className="inline-block h-4 w-4 mr-1 text-yellow-500" />
                                      Gap in timeline
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </div>
                        )
                      })}

                    {sortedOperations.length === 0 && (
                      <Card className="p-8 text-center">
                        <p className="text-muted-foreground">No operations for this well yet.</p>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}

          {!selectedWellId && (
            <Card className="p-8 text-center border-red-600/20">
              <p className="text-muted-foreground">Select a well to view its timeline.</p>
            </Card>
          )}
        </div>
      </Tabs>

      {editingOperation && (
        <EditOperationModal
          operation={editingOperation}
          isOpen={true}
          onClose={() => setEditingOperation(null)}
          onSave={onEditOperation}
          onDelete={handleDeleteOperation}
          wells={wells}
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

