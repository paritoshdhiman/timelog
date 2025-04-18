"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Download, CheckCircle2 } from "lucide-react"
import { type Operation, type Well, type ProjectConfiguration, type Personnel, getOperationTypeColor, getOperationTypeBadgeStyles, getWellColor, getSectorColor } from "@/lib/types"
import { EditOperationModal } from "@/components/edit-operation-modal"
import { operationsToCSV, downloadCSV } from "@/lib/csv-utils"
import { Toggle } from "@/components/ui/toggle"

interface TimelineProps {
  operations: Operation[]
  wells: Well[]
  onEditOperation: (operation: Operation) => void
  onDeleteOperation: (operation: Operation) => void
  configuration: ProjectConfiguration
  projectPersonnel: Personnel
}

// Helper function to group operations by time period
const groupOperationsByTime = (operations: Operation[]) => {
  const timeGroups: { [key: string]: Operation[] } = {}
  
  // Deduplicate operations by ID
  const uniqueOperations = operations.reduce((acc, operation) => {
    if (!acc.find(op => op.id === operation.id)) {
      acc.push(operation)
    }
    return acc
  }, [] as Operation[])

  // Sort operations by start time
  const sortedOperations = [...uniqueOperations].sort((a, b) => 
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

export function Timeline({ operations, wells, onEditOperation, onDeleteOperation, configuration, projectPersonnel }: TimelineProps) {
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)

  const handleToggleComplete = (operation: Operation) => {
    onEditOperation({
      ...operation,
      completed: !operation.completed
    })
  }

  const handleDeleteOperation = (operation: Operation) => {
    onDeleteOperation(operation)
  }

  // Group operations by start time
  const groupedOperations = groupOperationsByTime(operations)

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

  const formatDuration = (startStr: string, endStr: string | null) => {
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
    const csvContent = operationsToCSV(operations)
    downloadCSV(csvContent, "sacred-timeline.csv")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
          Sacred Timeline
        </h2>
        <Button
          className="flex items-center gap-1 border-red-600/20"
          onClick={handleDownloadCSV}
        >
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </Button>
      </div>

      <div className="relative">
        {/* Vertical timeline line with gradient */}
        <div className="absolute left-[140px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600 via-rose-500 to-red-400" />

        <div className="space-y-8">
          {groupedOperations.map((group, groupIndex) => {
            const firstOp = group.operations[0]
            const opTypeColor = getOperationTypeColor(firstOp.type)

            return (
              <div key={groupIndex} className="relative pl-[170px] animate-fadeIn">
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
        </div>
      </div>

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