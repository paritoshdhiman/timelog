import { NextResponse } from 'next/server'
import { createOperation, getOperations, getAllOperations } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { operationType, party, stage, startTime, endTime, wellId } = body

    if (!operationType || !party || stage === undefined || !startTime || !wellId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const operation = await createOperation({
      operationType,
      party,
      stage,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      wellId
    })
    return NextResponse.json(operation)
  } catch (error) {
    console.error('Error creating operation:', error)
    return NextResponse.json(
      { error: 'Failed to create operation' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wellId = searchParams.get('wellId')

    let operations
    if (wellId) {
      operations = await getOperations(parseInt(wellId))
    } else {
      operations = await getAllOperations()
    }

    return NextResponse.json(operations)
  } catch (error) {
    console.error('Error fetching operations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch operations' },
      { status: 500 }
    )
  }
} 