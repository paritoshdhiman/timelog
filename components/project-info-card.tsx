import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProjectInfoCardProps {
  projectNumber: string
  projectName: string | null
  basin: string
  crew: string
}

export function ProjectInfoCard({ projectNumber, projectName, basin, crew }: ProjectInfoCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
          Project Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Project: {projectNumber}</h3>
            {projectName && (
              <p className="text-muted-foreground">{projectName}</p>
            )}
          </div>
          <div className="flex gap-4">
            <Badge variant="outline" className="text-sm py-1 px-3">
              Basin: {basin}
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              Crew: {crew}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 