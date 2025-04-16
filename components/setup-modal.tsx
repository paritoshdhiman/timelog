"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { fetchProjectDetails, fetchWellInformation, fetchCompletionDesign } from "@/lib/api"
import type { Well } from "@/lib/types"

interface SetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSetupComplete: (projectNumber: string, projectName: string, basin: string, wells: Well[], crewName?: string) => void
}

interface WellData {
  id: string
}

interface ProjectData {
  padName: string
  projectNumber: string
  basin: string
  wellIDs: WellData[]
  crews?: Array<{ label: string }>
}

export function SetupModal({ isOpen, onClose, onSetupComplete }: SetupModalProps) {
  const [projectNumber, setProjectNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingStatus, setLoadingStatus] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectNumber.trim()) return

    setIsLoading(true)
    setError(null)
    setLoadingStatus("Fetching project details...")

    try {
      // Fetch project details from the API (this will get the auth token internally)
      const projectResponse = await fetchProjectDetails(projectNumber)

      // Ensure the response has the expected structure
      if (!Array.isArray(projectResponse) || projectResponse.length === 0) {
        throw new Error("No project found")
      }

      const projectData: ProjectData = projectResponse[0]

      // Ensure wells property exists and is an array
      const wellsData = projectData.wellIDs || []

      // Only use mock data if no wells were returned
      if (wellsData.length === 0) {
        console.log("No wells found in API response, using mock data")
        const mockWells: Well[] = [
          { id: "well-1", name: "Well Alpha-1", plannedNumberOfStages: 26 },
          { id: "well-2", name: "Well Alpha-2", plannedNumberOfStages: 26 },
          { id: "well-3", name: "Well Beta-1", plannedNumberOfStages: 26 },
        ]
        onSetupComplete(
          projectNumber,
          `Project ${projectNumber}`,
          "Development Basin",
          mockWells,
          "Mock Crew"
        )
        return
      }

      // Fetch detailed information and completion design for each well
      setLoadingStatus(`Fetching details for ${wellsData.length} wells...`)

      const wellPromises = wellsData.map(async (well: WellData) => {
        try {
          const [wellInfo, completionDesign] = await Promise.all([
            fetchWellInformation(well.id),
            fetchCompletionDesign(well.id)
          ])

          return {
            id: well.id,
            name: wellInfo.wellName || `Well ${well.id}`,
            plannedNumberOfStages: completionDesign?.plannedNumberOfStages || 26
          }
        } catch (error) {
          console.error(`Error fetching info for well ${well.id}:`, error)
          return {
            id: well.id,
            name: `Well ${well.id}`,
            plannedNumberOfStages: 26 // Default value
          }
        }
      })

      const wells = await Promise.all(wellPromises)

      // Extract project name, basin, and crew name with fallbacks
      const projectName = projectData.padName || `Project ${projectNumber}`
      const basin = projectData.basin || "Development Basin"
      const crewName = projectData.crews?.[0]?.label

      console.log("Setup complete with:", {
        projectNumber,
        projectName,
        basin,
        crewName,
        wells,
      })

      // Pass the project details to the parent component
      onSetupComplete(projectNumber, projectName, basin, wells, crewName)
    } catch (error) {
      console.error("Error setting up project:", error)
      setError("Failed to fetch project details. Using mock data for development purposes.")

      // For development, use mock data only when API fails
      const mockWells: Well[] = [
        { id: "well-1", name: "Well Alpha-1", plannedNumberOfStages: 26 },
        { id: "well-2", name: "Well Alpha-2", plannedNumberOfStages: 26 },
        { id: "well-3", name: "Well Beta-1", plannedNumberOfStages: 26 },
      ]

      onSetupComplete(projectNumber, `Project ${projectNumber}`, "Development Basin", mockWells, "Mock Crew")
    } finally {
      setIsLoading(false)
      setLoadingStatus("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
            Project Setup
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="projectNumber">Project Number</Label>
              <Input
                id="projectNumber"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                placeholder="Enter project number"
                required
                className="border-red-600/20"
              />
            </div>

            {isLoading && loadingStatus && (
              <div className="text-sm text-muted-foreground flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingStatus}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!projectNumber || isLoading}
              className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Setup Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

