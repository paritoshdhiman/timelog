import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function createProject(data: {
  number: string
  name: string
  crew: string
}) {
  try {
    return await prisma.project.create({
      data
    })
  } catch (error) {
    console.error('Database error creating project:', error)
    throw new Error('Failed to create project in database')
  }
}

export async function getProject(number: string) {
  try {
    return await prisma.project.findUnique({
      where: { number },
      include: {
        wells: {
          include: {
            operations: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Database error fetching project:', error)
    throw new Error('Failed to fetch project from database')
  }
}

export async function createWell(data: {
  name: string
  wellId: string
  plannedNumberOfStages?: number
  projectId: number
}) {
  try {
    return await prisma.well.create({
      data
    })
  } catch (error) {
    console.error('Database error creating well:', error)
    throw new Error('Failed to create well in database')
  }
}

export async function getWell(wellId: string) {
  try {
    return await prisma.well.findUnique({
      where: { wellId },
      include: {
        operations: true
      }
    })
  } catch (error) {
    console.error('Database error fetching well:', error)
    throw new Error('Failed to fetch well from database')
  }
}

export async function createOperation(data: {
  operationType: string
  party: string
  stage: number
  startTime: Date
  endTime?: Date
  wellId: number
}) {
  try {
    return await prisma.operation.create({
      data
    })
  } catch (error) {
    console.error('Database error creating operation:', error)
    throw new Error('Failed to create operation in database')
  }
}

export async function getOperations(wellId: number) {
  try {
    return await prisma.operation.findMany({
      where: { wellId },
      orderBy: { startTime: 'asc' }
    })
  } catch (error) {
    console.error('Database error fetching operations:', error)
    throw new Error('Failed to fetch operations from database')
  }
}

export async function getAllOperations() {
  try {
    return await prisma.operation.findMany({
      include: {
        well: true
      },
      orderBy: { startTime: 'asc' }
    })
  } catch (error) {
    console.error('Database error fetching all operations:', error)
    throw new Error('Failed to fetch all operations from database')
  }
}

// Add this at the end of the file to handle cleanup
export async function disconnect() {
  await prisma.$disconnect()
} 