import { NextResponse } from "next/server"
import { createProject, getProject } from "@/lib/db"

// Project API endpoint
const PROJECT_API_BASE =
  "https://lyzy8gvjg8givgo-losadw1.adb.us-phoenix-1.oraclecloudapps.com/ords/los_adw_apex/v1/project/"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { number, name, crew } = body

    console.log('Creating project with data:', { number, name, crew })

    if (!number || !name || !crew) {
      console.error('Missing required fields:', { number, name, crew })
      return NextResponse.json(
        { error: 'Missing required fields', details: { number, name, crew } },
        { status: 400 }
      )
    }

    const project = await createProject({ number, name, crew })
    console.log('Project created successfully:', project)
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  // Get the project number from the URL
  const { searchParams } = new URL(request.url)
  const projectNumber = searchParams.get("project_number")
  const token = searchParams.get("token")

  if (!projectNumber) {
    return NextResponse.json({ error: "Project number is required" }, { status: 400 })
  }

  if (!token) {
    return NextResponse.json({ error: "Authentication token is required" }, { status: 401 })
  }

  try {
    // Make API request with OAuth 2.0 bearer token
    const url = `${PROJECT_API_BASE}?project_number=${encodeURIComponent(projectNumber)}`
    console.log("Server-side: Fetching project data with OAuth 2.0 authentication from:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Server-side: Project API response error:", errorText)

      // Return mock data for development
      return NextResponse.json([getMockProjectData(projectNumber)])
    }

    try {
      const data = await response.json()

      // Ensure the response has the expected structure
      if (!data || !Array.isArray(data)) {
        console.error("Server-side: Invalid response format from API")
        return NextResponse.json([getMockProjectData(projectNumber)])
      }

      // If the array is empty, return mock data
      if (data.length === 0) {
        return NextResponse.json([getMockProjectData(projectNumber)])
      }

      return NextResponse.json(data)
    } catch (parseError) {
      console.error("Server-side: Error parsing API response:", parseError)
      return NextResponse.json([getMockProjectData(projectNumber)])
    }
  } catch (error) {
    console.error("Server-side: Error fetching project details:", error)
    return NextResponse.json([getMockProjectData(projectNumber)])
  }
}

/**
 * Helper function to get mock project data for development
 */
function getMockProjectData(projectNumber: string) {
  return {
    padName: `Project ${projectNumber}`,
    projectNumber: projectNumber,
    basin: "Development Basin",
    numberOfWells: 5,
    wellIDs: [{ id: "well-1" }, { id: "well-2" }, { id: "well-3" }, { id: "well-4" }, { id: "well-5" }],
    field: "Mock Field",
    county: "Mock County",
    state: "Mock State",
    country: "United States",
    latitude: 40.123456,
    longitude: -104.123456,
    groundLevelEleation: 0,
    pumpingServicesNPTGracePeriod: 0,
    wirelineServicesNPTGracePeriod: 0,
    acceptableChemUsageVariation: 0.05,
    acceptableChemRateVariation: 0.05,
    acceptableSandSieveCapture: 0.95,
    unitSystem: "Imperial",
    enabled: "true",
    crews: [{ label: "Mock Crew" }],
  }
}

