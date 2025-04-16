"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import type { Personnel, ProjectConfiguration } from "@/lib/types"

interface ProjectPersonnelProps {
  value: Personnel
  configuration: ProjectConfiguration
}

export function ProjectPersonnel({ value, configuration }: ProjectPersonnelProps) {
  return (
    <Card className="p-4 mb-6 border-red-600/20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Engineer</Label>
          <div className="p-2 border rounded-md bg-slate-50">
            {value.engineer || "Not selected"}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Pump Operator</Label>
          <div className="p-2 border rounded-md bg-slate-50">
            {value.pumpOperator || "Not selected"}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Supervisor</Label>
          <div className="p-2 border rounded-md bg-slate-50">
            {value.supervisor || "Not selected"}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Customer Rep</Label>
          <div className="p-2 border rounded-md bg-slate-50">
            {value.customerRep || "Not selected"}
          </div>
        </div>
      </div>
    </Card>
  )
} 