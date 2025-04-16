import { NextResponse } from "next/server"
import { createWell, getWell } from "@/lib/db"

// Well API endpoint
const WELL_API_BASE =
  "https://lyzy8gvjg8givgo-losadw1.adb.us-phoenix-1.oraclecloudapps.com/ords/los_adw_apex/v1/generalWellInformation"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, wellId, plannedNumberOfStages, projectId } = body

    if (!name || !wellId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const well = await createWell({
      name,
      wellId,
      plannedNumberOfStages,
      projectId
    })
    return NextResponse.json(well)
  } catch (error) {
    console.error('Error creating well:', error)
    return NextResponse.json(
      { error: 'Failed to create well' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wellId = searchParams.get('wellId')

    if (!wellId) {
      return NextResponse.json(
        { error: 'Well ID is required' },
        { status: 400 }
      )
    }

    const well = await getWell(wellId)
    if (!well) {
      return NextResponse.json(
        { error: 'Well not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(well)
  } catch (error) {
    console.error('Error fetching well:', error)
    return NextResponse.json(
      { error: 'Failed to fetch well' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get mock well data for development
 */
function getMockWellData(wellId: string) {
  return {
    wellName: `Well ${wellId}`,
    color: "Manual Entry",
    apiNumber: `API-${wellId}`,
    afeNumber: null,
    surfaceLatitude: 40.123456,
    surfaceLongitude: -104.123456,
    bidPrice: 0,
    pumpingServiceCompanies: [{ label: "Mock Service Company" }],
    wirelineCompanies: [],
  }
}

