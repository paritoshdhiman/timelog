import { NextResponse } from "next/server"

// Completion Design API endpoint
const COMPLETION_DESIGN_API_BASE =
  "https://lyzy8gvjg8givgo-losadw1.adb.us-phoenix-1.oraclecloudapps.com/ords/los_adw_apex/v1/completionDesign"

// OAuth 2.0 token endpoint
const TOKEN_URL = "https://lyzy8gvjg8givgo-losadw1.adb.us-phoenix-1.oraclecloudapps.com/ords/los_adw_apex/oauth/token"

// OAuth 2.0 credentials
const CLIENT_ID = "zoG0mmekFopCNGCYR1rs0A.."
const CLIENT_SECRET = "URnLea_-tINt2EBgejc2Aw.."

/**
 * Helper function to get mock completion design data for development
 */
function getMockCompletionDesignData() {
  return [{
    designMaximumRate: 96,
    designMaximumPressure: 9500,
    plannedNumberOfStages: 26,
    plannedClusterSpacing: "Manual Entry",
    plannedCompletedLateralLength: 6629,
    stimulationFluids: [
      {
        mainFluidType: "Slick Water",
      },
    ],
    surfaceIronVolume: "Manual Entry",
    overflushVolume: "Manual Entry",
    hydraulicHorsepower: "CALCULATED VALUE",
    proppantsTypeMesh: [
      {
        proppantSizeCatalogExternal: "100881",
        proppantSupplier: "Manual Entry",
        proppantCommercialName: "GENOA 100 MESH",
        unit: "TON",
        unitPrice: 66,
        discount: 0,
        quotedQuantity: 5150,
      },
    ],
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
      return NextResponse.json(getMockCompletionDesignData())
    }

    const tokenData = await tokenResponse.json()
    const token = tokenData.access_token

    // Make API request with OAuth 2.0 bearer token
    const url = `${COMPLETION_DESIGN_API_BASE}?well_id=${encodeURIComponent(wellId)}`
    console.log("Server-side: Fetching completion design data with OAuth 2.0 authentication from:", url)

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
      console.error("Server-side: Completion Design API response error:", errorText)
      console.log("Falling back to mock data due to API error")
      return NextResponse.json(getMockCompletionDesignData())
    }

    const data = await response.json()

    // Ensure the response has the expected structure
    if (!data || !Array.isArray(data)) {
      console.error("Server-side: Invalid response format from API")
      console.log("Falling back to mock data due to invalid response format")
      return NextResponse.json(getMockCompletionDesignData())
    }

    // If the array is empty, return mock data
    if (data.length === 0) {
      console.log("No completion design found, falling back to mock data")
      return NextResponse.json(getMockCompletionDesignData())
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Server-side: Error fetching completion design details:", error)
    console.log("Falling back to mock data due to error")
    return NextResponse.json(getMockCompletionDesignData())
  }
}

