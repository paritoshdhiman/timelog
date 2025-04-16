import type { Operation } from "@/lib/types"

// Function to convert operations to CSV format
export function operationsToCSV(operations: Operation[]): string {
  // Sort operations by start time (newest first)
  const sortedOperations = [...operations].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  // Define CSV headers
  const headers = ["Well ID", "Operation Type", "Party", "Stage", "Start Time", "End Time", "Duration (hours)"]

  // Format date for CSV
  const formatDate = (date: string | null | undefined): string => {
    if (!date) return "Ongoing"
    return new Date(date).toLocaleString()
  }

  // Calculate duration in hours
  const calculateDuration = (start: string, end: string | null | undefined): string => {
    if (!end) return "Ongoing"

    const startDate = new Date(start)
    const endDate = new Date(end)
    const durationMs = endDate.getTime() - startDate.getTime()
    const hours = durationMs / (1000 * 60 * 60)

    return hours.toFixed(2)
  }

  // Create CSV content
  let csvContent = headers.join(",") + "\n"

  sortedOperations.forEach((op) => {
    const row = [
      `"${op.wellId}"`,
      `"${op.type}"`,
      `"${op.party || ''}"`,
      op.stage ? op.stage : '""',
      `"${formatDate(op.startTime)}"`,
      `"${formatDate(op.endTime)}"`,
      op.endTime ? calculateDuration(op.startTime, op.endTime) : `"Ongoing"`,
    ]

    csvContent += row.join(",") + "\n"
  })

  return csvContent
}

// Function to download CSV data
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

