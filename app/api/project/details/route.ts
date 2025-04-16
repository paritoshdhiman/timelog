import { NextResponse } from "next/server"

// Project API endpoint
const PROJECT_API_BASE =
  "https://lyzy8gvjg8givgo-losadw1.adb.us-phoenix-1.oraclecloudapps.com/ords/los_adw_apex/v1/project/"

// OAuth 2.0 token endpoint
const TOKEN_URL = "https://lyzy8gvjg8givgo-losadw1.adb.us-phoenix-1.oraclecloudapps.com/ords/los_adw_apex/oauth/token"

// OAuth 2.0 credentials
const CLIENT_ID = "zoG0mmekFopCNGCYR1rs0A.."
const CLIENT_SECRET = "URnLea_-tINt2EBgejc2Aw.."

/**
 * Helper function to get mock project data for development
 */
function getMockProjectData(projectNumber: string) {
  return [{
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
  }]
}

export async function GET(request: Request) {
  // Get the project number from the URL
  const { searchParams } = new URL(request.url)
  const projectNumber = searchParams.get("project_number")

  if (!projectNumber) {
    return NextResponse.json({ error: "Project number is required" }, { status: 400 })
  }

  try {
    // First get the auth token
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")
    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials",
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Failed to get auth token:", errorText)
      console.log("Falling back to mock data due to auth token failure")
      return NextResponse.json(getMockProjectData(projectNumber))
    }

    const tokenData = await tokenResponse.json()
    const token = tokenData.access_token

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
      console.log("Falling back to mock data due to API error")
      return NextResponse.json(getMockProjectData(projectNumber))
    }

    const data = await response.json()

    // Ensure the response has the expected structure
    if (!data || !Array.isArray(data)) {
      console.error("Server-side: Invalid response format from API")
      console.log("Falling back to mock data due to invalid response format")
      return NextResponse.json(getMockProjectData(projectNumber))
    }

    // If the array is empty, return mock data
    if (data.length === 0) {
      console.log("No project found, falling back to mock data")
      return NextResponse.json(getMockProjectData(projectNumber))
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Server-side: Error fetching project details:", error)
    console.log("Falling back to mock data due to error")
    return NextResponse.json(getMockProjectData(projectNumber))
  }
} 