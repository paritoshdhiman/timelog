"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Download } from "lucide-react"
import { type Operation, type Well, type ProjectConfiguration, getSectorColor, getWellColor } from "@/lib/types"

interface OldTimelineTableProps {
  operations: Operation[]
  wells: Well[]
  configuration: ProjectConfiguration
  onEditOperation: (operation: Operation) => void
}

export function OldTimelineTable({
  operations,
  wells,
  configuration,
  onEditOperation
}: OldTimelineTableProps) {
  // Deduplicate operations by ID
  const uniqueOperations = operations.reduce((acc, operation) => {
    if (!acc.find(op => op.id === operation.id)) {
      acc.push(operation)
    }
    return acc
  }, [] as Operation[])

  // Sort operations by start time (newest first)
  const sortedOperations = [...uniqueOperations].sort((a, b) => {
    const aTime = new Date(a.startTime).getTime()
    const bTime = new Date(b.startTime).getTime()
    return bTime - aTime
  })

  const formatDateTime = (date: string) => {
    const dateObj = new Date(date)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(dateObj)
  }

  // Calculate minutes between two dates, ignoring seconds
  const calculateMinutes = (startStr: string, endStr: string): number => {
    const start = new Date(startStr)
    const end = new Date(endStr)
    // Set seconds and milliseconds to 0 for accurate minute calculation
    start.setSeconds(0, 0)
    end.setSeconds(0, 0)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  }

  const getWellName = (wellId: string) => {
    return wells.find(w => w.id === wellId)?.name || "Unknown Well"
  }

  const handleDownloadCSV = () => {
    // Headers without Time column
    const headers = [
      "Engineer",
      "Pump Operator",
      "Supervisor",
      "Customer Rep",
      "Type",
      "Sector",
      "Well",
      "Stage",
      "Party",
      "Main Event",
      "Complete",
      "Date/Time",
      "Minutes",
      "EndDate/Time",
      "Notes"
    ]

    // Create CSV rows with updated format
    const rows = sortedOperations.map(operation => [
      operation.personnel?.engineer || "",
      operation.personnel?.pumpOperator || "",
      operation.personnel?.supervisor || "",
      operation.personnel?.customerRep || "",
      operation.type,
      operation.sector || "",
      getWellName(operation.wellId),
      operation.stage || "",
      operation.party || "",
      operation.mainEvent || "",
      operation.completed ? "Yes" : "No",
      formatDateTime(operation.startTime),
      operation.endTime ? calculateMinutes(operation.startTime, operation.endTime) : "",
      operation.endTime ? formatDateTime(operation.endTime) : "",
      operation.comments || ""
    ].map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(","))

    // Combine header and rows
    const csvContent = [headers.join(","), ...rows].join("\n")
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "old-timeline.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
          Old Timeline
        </h2>
        <Button
          className="flex items-center gap-1 border-red-600/20"
          onClick={handleDownloadCSV}
          disabled={operations.length === 0}
        >
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </Button>
      </div>
      <div className="min-w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="w-[120px]">Engineer</TableHead>
              <TableHead className="w-[120px]">Pump Operator</TableHead>
              <TableHead className="w-[120px]">Supervisor</TableHead>
              <TableHead className="w-[120px]">Customer Rep</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Well</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Main Event</TableHead>
              <TableHead>Complete</TableHead>
              <TableHead>Date/Time</TableHead>
              <TableHead>Minutes</TableHead>
              <TableHead>EndDate/Time</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOperations.map((operation) => {
              const sectorColor = operation.sector ? getSectorColor(operation.sector, configuration) : ""
              const wellColor = getWellColor(operation.wellId, configuration)
              // Convert hex colors to RGB and add opacity
              const sectorBgColor = sectorColor ? `${sectorColor}20` : ""
              const wellBgColor = wellColor ? `${wellColor}20` : ""
              
              return (
                <TableRow key={operation.id} className="whitespace-nowrap">
                  <TableCell className="max-w-[120px] truncate">{operation.personnel?.engineer || "-"}</TableCell>
                  <TableCell className="max-w-[120px] truncate">{operation.personnel?.pumpOperator || "-"}</TableCell>
                  <TableCell className="max-w-[120px] truncate">{operation.personnel?.supervisor || "-"}</TableCell>
                  <TableCell className="max-w-[120px] truncate">{operation.personnel?.customerRep || "-"}</TableCell>
                  <TableCell className={operation.type === "NPT/DT" ? "bg-red-100" : ""}>
                    {operation.type}
                  </TableCell>
                  <TableCell>
                    {operation.completionType || "-"}
                  </TableCell>
                  <TableCell style={{ backgroundColor: sectorBgColor }}>
                    {operation.sector || "-"}
                  </TableCell>
                  <TableCell style={{ backgroundColor: wellBgColor }}>
                    {getWellName(operation.wellId)}
                  </TableCell>
                  <TableCell>{operation.stage || "-"}</TableCell>
                  <TableCell>{operation.party || "-"}</TableCell>
                  <TableCell>{operation.mainEvent || "-"}</TableCell>
                  <TableCell className={operation.completed ? "bg-green-100" : ""}>
                    {operation.completed ? "Yes" : "No"}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(operation.startTime)}
                  </TableCell>
                  <TableCell>
                    {operation.endTime ? 
                      calculateMinutes(operation.startTime, operation.endTime)
                      : "-"
                    }
                  </TableCell>
                  <TableCell style={{ backgroundColor: sectorBgColor }}>
                    {operation.endTime ? formatDateTime(operation.endTime) : "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{operation.comments || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditOperation(operation)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 