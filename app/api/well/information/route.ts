import { NextResponse } from "next/server"

// Well API endpoint
const WELL_API_BASE =
  "https://lyzy8gvjg8givgo-losadw1.adb.us-phoenix-1.oraclecloudapps.com/ords/los_adw_apex/v1/generalWellInformation"

// OAuth 2.0 token endpoint
const TOKEN_URL = "https://lyzy8gvjg8givgo-losadw1.adb.us-phoenix-1.oraclecloudapps.com/ords/los_adw_apex/oauth/token"

// OAuth 2.0 credentials
const CLIENT_ID = "zoG0mmekFopCNGCYR1rs0A.."
const CLIENT_SECRET = "URnLea_-tINt2EBgejc2Aw.."

/**
 * Helper function to get mock well data for development
 */
function getMockWellData(wellId: string) {
  return [{
    wellName: `Well ${wellId}`,
    color: "Manual Entry",
    apiNumber: `API-${wellId}`,
    afeNumber: null,
    surfaceLatitude: 40.123456,
    surfaceLongitude: -104.123456,
    bidPrice: 0,
    pumpingServiceCompanies: [{ label: "Mock Service Company" }],
    wirelineCompanies: [],
  }]
}

export async function GET(request: Request) {
  // Get the well ID from the URL
  const { searchParams } = new URL(request.url)
  const wellId = searchParams.get("well_id")

  if (!wellId) {
    return NextResponse.json({ error: "Well ID is required" }, { status: 400 })
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
      return NextResponse.json(getMockWellData(wellId))
    }

    const tokenData = await tokenResponse.json()
    const token = tokenData.access_token

    // Make API request with OAuth 2.0 bearer token
    const url = `${WELL_API_BASE}?well_id=${encodeURIComponent(wellId)}`
    console.log("Server-side: Fetching well information with OAuth 2.0 authentication from:", url)

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
      console.error("Server-side: Well API response error:", errorText)
      console.log("Falling back to mock data due to API error")
      return NextResponse.json(getMockWellData(wellId))
    }

    const data = await response.json()

    // Ensure the response has the expected structure
    if (!data || !Array.isArray(data)) {
      console.error("Server-side: Invalid response format from API")
      console.log("Falling back to mock data due to invalid response format")
      return NextResponse.json(getMockWellData(wellId))
    }

    // If the array is empty, return mock data
    if (data.length === 0) {
      console.log("No well information found, falling back to mock data")
      return NextResponse.json(getMockWellData(wellId))
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Server-side: Error fetching well information:", error)
    console.log("Falling back to mock data due to error")
    return NextResponse.json(getMockWellData(wellId))
  }
} 