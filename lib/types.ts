export interface Project {
  number: string
  name: string
  crew: string
}

export interface Well {
  id: string
  name: string
  plannedNumberOfStages?: number
}

export interface Stage {
  id: string
  number: number
  wellId: string
}

export interface Personnel {
  engineer: string
  pumpOperator: string
  supervisor: string
  customerRep: string
}

export interface Operation {
  id: string
  wellId: string
  type: OperationType
  startTime: string
  endTime?: string
  stage?: number
  sector?: SectorType
  party?: string
  mainEvent?: MainEvent
  completed?: boolean
  personnel?: Personnel
  completionType?: CompletionType
  comments?: string
}

export const OPERATION_TYPES = ["PUMP", "NPT/DT", "NP", "Off Pad"] as const
export type OperationType = typeof OPERATION_TYPES[number]

export const PARTY_TYPES = [
  "3rd Party",
  "3rd Party Chem",
  "3rd Party Engineer",
  "3rd Party LOS",
  "BackSide",
  "BallDropper",
  "Coil",
  "Customer",
  "Flowback",
  "Fuel",
  "LandOwner",
  "LOS",
  "LOS - WL",
  "LPI",
  "Nitrogen",
  "Other",
  "Screen out",
  "Severe Weather",
  "Water Heaters",
  "WaterTransfer",
  "WellHead",
  "WireLine",
  "Zipper",
] as const

export const COMPLETION_TYPES = [
  "Dual",
  "Sync",
  "Zipper - 1 WL log",
  "Zipper - 2 WL log",
  "Sleeve",
  "Single",
  "ReFrac",
  "Injector"
] as const
export type CompletionType = typeof COMPLETION_TYPES[number]

export const SECTOR_TYPES = [
  "PAD",
  "A",
  "B",
  "C",
  "D",
  "BackSide",
  "FrontSide",
  "HP",
  "WellHead",
  "LPI",
  "WireLine",
] as const

export type SectorType = typeof SECTOR_TYPES[number]

export const getOperationTypeColor = (type: string): string => {
  switch (type) {
    case "PUMP":
      return "border-green-500 hover:border-green-600"
    case "NPT/DT":
      return "border-red-500 hover:border-red-600"
    case "NP":
      return "border-blue-500 hover:border-blue-600"
    case "Off Pad":
      return "border-gray-500 hover:border-gray-600"
    default:
      return "border-primary hover:border-primary/90"
  }
}

// Helper function to get badge styles for operation types
export const getOperationTypeBadgeStyles = (type: string): string => {
  switch (type) {
    case "PUMP":
      return "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
    case "NPT/DT":
      return "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
    case "NP":
      return "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
    case "Off Pad":
      return "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
    default:
      return "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
  }
}

export interface WellColorConfig {
  wellId: string
  color: string
  isUsed: boolean
}

export interface SectorColorConfig {
  sector: SectorType
  color: string
  isUsed: boolean
}

export interface ProjectConfiguration {
  wellColors: Array<{
    wellId: string
    color: string
    isUsed: boolean
  }>
  sectorColors: Array<{
    sector: SectorType
    color: string
    isUsed: boolean
  }>
  personnel: {
    engineers: string[]
    pumpOperators: string[]
    supervisors: string[]
    customerReps: string[]
  }
}

export const getWellColor = (wellId: string, config: ProjectConfiguration): string => {
  const wellConfig = config.wellColors.find(w => w.wellId === wellId)
  if (!wellConfig || !wellConfig.isUsed) return "#e5e7eb" // gray-200 for unused
  return wellConfig.color
}

export const getSectorColor = (sector: SectorType | undefined, config: ProjectConfiguration): string => {
  if (!sector) return "#e5e7eb"
  const sectorConfig = config.sectorColors.find(s => s.sector === sector)
  if (!sectorConfig || !sectorConfig.isUsed) return "#e5e7eb" // gray-200 for unused
  return sectorConfig.color
}

export function isWellUsed(wellId: string, configuration: ProjectConfiguration): boolean {
  return configuration.wellColors.find(w => w.wellId === wellId)?.isUsed || false
}

export function isSectorUsed(sector: SectorType, configuration: ProjectConfiguration): boolean {
  return configuration.sectorColors.find(s => s.sector === sector)?.isUsed || false
}

export type MainEvent = 
| "3rd Party Wait"
| "Accumulator"
| "Acid Issues"
| "Acid Soak"
| "Baby Beast"
| "Backside"
| "Ball Drop"
| "Ball Dropper"
| "Ball Fall"
| "Ball Issues"
| "Ball Pump Down"
| "Ball Search"
| "Ball Seat"
| "Blender"
| "Blender Swap"
| "Boost Pump"
| "Bucket Test"
| "Burst Disc"
| "Chemical Equipment"
| "Chemicals"
| "Christmas Party"
| "Coil Cleanout Sand"
| "Coil Mill Plug"
| "Coil Other"
| "Coil Shifting Sleeves"
| "Coil TCP"
| "Coil Wellbore Issue"
| "Coil WireLine Issue"
| "Combo Unit"
| "Computer Issues"
| "Crew Swap"
| "Customer Data"
| "Customer Delay"
| "Customer Equipment Issue"
| "Customer Off Location"
| "Customer Other"
| "Customer Personnel"
| "Data Van"
| "Designed Shutdown"
| "digiFrac"
| "digiPrime"
| "Dry Gel Unit"
| "eBlender"
| "eBlender Swap"
| "ECM"
| "Equalizing"
| "Equipment Inspection"
| "Equipment Swap"
| "Flowback"
| "Flowback Prep"
| "Fluid End Maintenance"
| "Fluid Testing"
| "Flush After Screen Out"
| "Forklift"
| "Frac"
| "Frac Prep"
| "FracCat"
| "FracMaxx"
| "Fuel"
| "Fuel - CNG"
| "Fuel - Diesel"
| "Fuel - Field Gas"
| "Generator"
| "Grease 3rd Party Valves"
| "Grease LOS Valves"
| "HCR Valve Related"
| "Heating Water"
| "Hesitation"
| "High Winds"
| "Hydration Issues"
| "Hydration Unit"
| "Injection Test"
| "Inspecting Well"
| "Iron"
| "Iron - Monoline"
| "Iron Restraints"
| "LABS"
| "Leak - High Pressure Hose"
| "Leak - High Pressure Iron"
| "Leak - Low Pressure Hose"
| "Leak - Low Pressure Joint"
| "Leak - Low Pressure Manifold"
| "LOS Misc"
| "Low Rate Well Swap"
| "LTM"
| "Mantis Belts"
| "MegaPOD"
| "MegaPOD Swap"
| "Missile"
| "Nitrogen"
| "Nitrogen Equipment"
| "No Job Scheduled"
| "Offset Well"
| "PCM"
| "PCM (Dry FR)"
| "PCM (Dry Guar)"
| "PCM (Dual Bin)"
| "PDS"
| "Pop Offs - Electric"
| "Pop Offs - Mechanical"
| "Pop Offs - Nitrogen"
| "Pressure Decline Analysis"
| "Pressure Test"
| "Prime UP"
| "Process Trailer"
| "Process Trailer Swap"
| "Proppant Equipment"
| "Proppant Quality"
| "Proppant Sand Chiefs"
| "Proppant Scorpion"
| "Proppant Silos"
| "Proppant Trucking"
| "Pump Down"
| "Pump Mechanical Maintenance"
| "Pump Other"
| "Pump Sanded Off"
| "Pump Swap"
| "Pump Wireless Communication"
| "QAQC"
| "Reboot Equipment"
| "Rig Down"
| "Rig Over"
| "Rig Up"
| "Rock Catcher"
| "Safety Meeting"
| "Safety Shutdown"
| "Screen out"
| "Sector Close"
| "Sector Not Utilized"
| "Set Backside"
| "Set Pop Offs"
| "Sound Wall"
| "SuperPOD"
| "SuperPOD Swap"
| "Sweep"
| "T-belt"
| "Toe Prep"
| "Transducer"
| "Trip to New Pad"
| "Waiting on Customer"
| "Waiting on Next Pad"
| "Water Heater"
| "Water Quantity"
| "Water Transfer Equipment"
| "Weather"
| "Well Open/Close"
| "Well Prep"
| "Well Swap (FracLock)"
| "Well Swap (Zippering)"
| "Wellbore Issues"
| "Wellhead"
| "Wellhead Leak"
| "Wellhead Replacement"
| "Winterizing Equipment"
| "Wireline"
| "WL Ball Issues"
| "WL Crane"
| "WL Drop Ball"
| "WL Dummy Run"
| "WL End of Well Activity"
| "WL Issues"
| "WL Log"
| "WL Miss-Run"
| "WL POOH"
| "WL Prep"
| "WL Pressure Test"
| "WL Regen Logger"
| "WL Re-Head"
| "WL Rigging Down"
| "WL Rigging Up"
| "WL RIH"
| "WL Run"
| "WL SetPlug"
| "WL Spool"
| "WL Stuck"
| "WL Turn Around"
| "Yard Maintenance"
| "Zipper Manifold"

export const MAIN_EVENTS: MainEvent[] = [
  "3rd Party Wait",
  "Accumulator",
  "Acid Issues",
  "Acid Soak",
  "Baby Beast",
  "Backside",
  "Ball Drop",
  "Ball Dropper",
  "Ball Fall",
  "Ball Issues",
  "Ball Pump Down",
  "Ball Search",
  "Ball Seat",
  "Blender",
  "Blender Swap",
  "Boost Pump",
  "Bucket Test",
  "Burst Disc",
  "Chemical Equipment",
  "Chemicals",
  "Christmas Party",
  "Coil Cleanout Sand",
  "Coil Mill Plug",
  "Coil Other",
  "Coil Shifting Sleeves",
  "Coil TCP",
  "Coil Wellbore Issue",
  "Coil WireLine Issue",
  "Combo Unit",
  "Computer Issues",
  "Crew Swap",
  "Customer Data",
  "Customer Delay",
  "Customer Equipment Issue",
  "Customer Off Location",
  "Customer Other",
  "Customer Personnel",
  "Data Van",
  "Designed Shutdown",
  "digiFrac",
  "digiPrime",
  "Dry Gel Unit",
  "eBlender",
  "eBlender Swap",
  "ECM",
  "Equalizing",
  "Equipment Inspection",
  "Equipment Swap",
  "Flowback",
  "Flowback Prep",
  "Fluid End Maintenance",
  "Fluid Testing",
  "Flush After Screen Out",
  "Forklift",
  "Frac",
  "Frac Prep",
  "FracCat",
  "FracMaxx",
  "Fuel",
  "Fuel - CNG",
  "Fuel - Diesel",
  "Fuel - Field Gas",
  "Generator",
  "Grease 3rd Party Valves",
  "Grease LOS Valves",
  "HCR Valve Related",
  "Heating Water",
  "Hesitation",
  "High Winds",
  "Hydration Issues",
  "Hydration Unit",
  "Injection Test",
  "Inspecting Well",
  "Iron",
  "Iron - Monoline",
  "Iron Restraints",
  "LABS",
  "Leak - High Pressure Hose",
  "Leak - High Pressure Iron",
  "Leak - Low Pressure Hose",
  "Leak - Low Pressure Joint",
  "Leak - Low Pressure Manifold",
  "LOS Misc",
  "Low Rate Well Swap",
  "LTM",
  "Mantis Belts",
  "MegaPOD",
  "MegaPOD Swap",
  "Missile",
  "Nitrogen",
  "Nitrogen Equipment",
  "No Job Scheduled",
  "Offset Well",
  "PCM",
  "PCM (Dry FR)",
  "PCM (Dry Guar)",
  "PCM (Dual Bin)",
  "PDS",
  "Pop Offs - Electric",
  "Pop Offs - Mechanical",
  "Pop Offs - Nitrogen",
  "Pressure Decline Analysis",
  "Pressure Test",
  "Prime UP",
  "Process Trailer",
  "Process Trailer Swap",
  "Proppant Equipment",
  "Proppant Quality",
  "Proppant Sand Chiefs",
  "Proppant Scorpion",
  "Proppant Silos",
  "Proppant Trucking",
  "Pump Down",
  "Pump Mechanical Maintenance",
  "Pump Other",
  "Pump Sanded Off",
  "Pump Swap",
  "Pump Wireless Communication",
  "QAQC",
  "Reboot Equipment",
  "Rig Down",
  "Rig Over",
  "Rig Up",
  "Rock Catcher",
  "Safety Meeting",
  "Safety Shutdown",
  "Screen out",
  "Sector Close",
  "Sector Not Utilized",
  "Set Backside",
  "Set Pop Offs",
  "Sound Wall",
  "SuperPOD",
  "SuperPOD Swap",
  "Sweep",
  "T-belt",
  "Toe Prep",
  "Transducer",
  "Trip to New Pad",
  "Waiting on Customer",
  "Waiting on Next Pad",
  "Water Heater",
  "Water Quantity",
  "Water Transfer Equipment",
  "Weather",
  "Well Open/Close",
  "Well Prep",
  "Well Swap (FracLock)",
  "Well Swap (Zippering)",
  "Wellbore Issues",
  "Wellhead",
  "Wellhead Leak",
  "Wellhead Replacement",
  "Winterizing Equipment",
  "Wireline",
  "WL Ball Issues",
  "WL Crane",
  "WL Drop Ball",
  "WL Dummy Run",
  "WL End of Well Activity",
  "WL Issues",
  "WL Log",
  "WL Miss-Run",
  "WL POOH",
  "WL Prep",
  "WL Pressure Test",
  "WL Regen Logger",
  "WL Re-Head",
  "WL Rigging Down",
  "WL Rigging Up",
  "WL RIH",
  "WL Run",
  "WL SetPlug",
  "WL Spool",
  "WL Stuck",
  "WL Turn Around",
  "Yard Maintenance",
  "Zipper Manifold"
]

