// API utility functions for authentication and data fetching

import type { Project, Well, Operation } from './types'

// Interface for the OAuth 2.0 token response
interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

// Interface for the API project response (matches the actual API format)
export interface ApiProjectResponse {
  padName: string
  projectNumber: string
  basin: string
  numberOfWells: number
  wellIDs: {
    id: string
  }[]
  field: string
  county: string
  state: string
  country: string
  latitude: number
  longitude: number
  groundLevelEleation: number
  pumpingServicesNPTGracePeriod: number
  wirelineServicesNPTGracePeriod: number
  acceptableChemUsageVariation: number
  acceptableChemRateVariation: number
  acceptableSandSieveCapture: number
  unitSystem: string
  enabled: string
  crews: {
    label: string
  }[]
}

// Interface for our internal project data structure
export interface ProjectResponse {
  project_number: string
  project_name: string
  basin: string
  number_of_wells: number
  crew_name?: string
  wells: {
    well_id: string
    well_name: string
  }[]
  field?: string
  county?: string
  state?: string
}

// Interface for the API well information response
export interface ApiWellInformationResponse {
  wellName: string
  color: string
  apiNumber: string
  afeNumber: null | string
  surfaceLatitude: number
  surfaceLongitude: number
  bidPrice: number
  pumpingServiceCompanies: {
    label: string
  }[]
  wirelineCompanies: {
    label: string
  }[]
}

// Interface for our internal well information structure
export interface WellInformationResponse {
  well_id: string
  wellName: string
  apiNumber?: string
  color?: string
  plannedNumberOfStages?: number
}

// Interface for the API completion design response
export interface ApiCompletionDesignResponse {
  designMaximumRate: number
  designMaximumPressure: number
  plannedNumberOfStages: number
  plannedClusterSpacing: string
  plannedCompletedLateralLength: number
  stimulationFluids: {
    mainFluidType: string
  }[]
  surfaceIronVolume: string
  overflushVolume: string
  hydraulicHorsepower: string
  proppantsTypeMesh: {
    proppantSizeCatalogExternal?: string
    proppantSupplier?: string
    proppantCommercialName?: string
    unit?: string
    unitPrice?: number
    discount?: number
    quotedQuantity?: number
  }[]
}

/**
 * Gets an OAuth 2.0 access token using the client credentials grant type
 * This uses a server-side API route to avoid CORS issues
 */
export async function getAuthToken(): Promise<string> {
  try {
    const response = await fetch('/api/auth/token')
    if (!response.ok) {
      throw new Error("Failed to get auth token")
    }
    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("Error getting auth token:", error)
    throw error
  }
}

/**
 * Fetches project details using an OAuth 2.0 authenticated request
 * This uses a server-side API route to avoid CORS issues
 */
export async function fetchProjectDetails(projectNumber: string): Promise<any> {
  const response = await fetch(`/api/project/details?project_number=${encodeURIComponent(projectNumber)}`)

  if (!response.ok) {
    throw new Error("Failed to fetch project details")
  }

  const data = await response.json()
  return data
}

/**
 * Fetches detailed information for a well
 */
export async function fetchWellInformation(wellId: string): Promise<any> {
  const response = await fetch(`/api/well/information?well_id=${encodeURIComponent(wellId)}`)

  if (!response.ok) {
    throw new Error("Failed to fetch well information")
  }

  const data = await response.json()
  return Array.isArray(data) ? data[0] : data
}

/**
 * Fetches completion design data for a well
 */
export async function fetchCompletionDesign(wellId: string): Promise<any> {
  const response = await fetch(`/api/completion-design?well_id=${encodeURIComponent(wellId)}`)

  if (!response.ok) {
    throw new Error("Failed to fetch completion design")
  }

  const data = await response.json()
  return Array.isArray(data) ? data[0] : data
}

/**
 * Fetches stages for a well based on the completion design
 */
export async function fetchStagesForWell(wellId: string): Promise<{ id: string; number: number; wellId: string }[]> {
  try {
    // Fetch completion design to get planned number of stages
    const completionDesign = await fetchCompletionDesign(wellId)

    // Get the planned number of stages
    const plannedStages = completionDesign?.plannedNumberOfStages || 26 // Default to 26 if not available

    // Generate stages array from 0 to plannedStages
    return Array.from({ length: plannedStages + 1 }, (_, i) => ({
      id: `${wellId}-stage-${i}`,
      number: i,
      wellId: wellId
    }))

  } catch (error) {
    console.error(`Error fetching stages for well ${wellId}:`, error)
    // Return mock stages (0-26) for development
    return Array.from({ length: 27 }, (_, i) => ({
      id: `${wellId}-stage-${i}`,
      number: i,
      wellId: wellId
    }))
  }
}

// API Functions
export async function fetchProject(projectNumber: string): Promise<Project> {
  const response = await fetch(`/api/project?number=${encodeURIComponent(projectNumber)}`)
  if (!response.ok) {
    throw new Error('Failed to fetch project')
  }
  return response.json()
}

export async function createProject(data: {
  number: string
  name: string
  crew: string
}): Promise<Project> {
  const response = await fetch('/api/project', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create project')
  }
  return response.json()
}

export async function fetchWell(wellId: string): Promise<Well> {
  const response = await fetch(`/api/well?wellId=${encodeURIComponent(wellId)}`)
  if (!response.ok) {
    throw new Error('Failed to fetch well')
  }
  return response.json()
}

export async function createWell(data: {
  name: string
  wellId: string
  plannedNumberOfStages?: number
  projectId: number
}): Promise<Well> {
  const response = await fetch('/api/well', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create well')
  }
  return response.json()
}

export async function fetchOperations(wellId?: number): Promise<Operation[]> {
  const url = wellId
    ? `/api/operations?wellId=${encodeURIComponent(wellId)}`
    : '/api/operations'
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch operations')
  }
  return response.json()
}

export async function createOperation(data: {
  operationType: string
  party: string
  stage: number
  startTime: string
  endTime?: string
  wellId: number
}): Promise<Operation> {
  const response = await fetch('/api/operations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create operation')
  }
  return response.json()
}

// Mock data for development
export function getMockWellData(wellId: string): Well {
  return {
    id: wellId,
    name: `Well ${wellId}`,
    plannedNumberOfStages: 26
  }
}

export function getMockOperationData(wellId: string): Operation {
  return {
    id: Math.random().toString(36).substring(7),
    operationType: "PUMP",
    party: "LOS",
    stage: 1,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    wellId
  }
}

