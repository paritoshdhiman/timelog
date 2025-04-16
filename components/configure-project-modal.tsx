"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import { CheckCircle2, XCircle, Plus } from "lucide-react"
import { type Well, type SectorType, type ProjectConfiguration, SECTOR_TYPES } from "@/lib/types"

interface ConfigureProjectModalProps {
  isOpen: boolean
  onClose: () => void
  wells: Well[]
  configuration: ProjectConfiguration
  onSave: (configuration: ProjectConfiguration) => void
}

export function ConfigureProjectModal({
  isOpen,
  onClose,
  wells,
  configuration,
  onSave,
}: ConfigureProjectModalProps) {
  const [activeTab, setActiveTab] = useState("wells")
  const [wellColors, setWellColors] = useState(configuration.wellColors)
  const [sectorColors, setSectorColors] = useState(configuration.sectorColors)
  const [personnel, setPersonnel] = useState(configuration.personnel)
  const [newPersonnel, setNewPersonnel] = useState({
    engineers: "",
    pumpOperators: "",
    supervisors: "",
    customerReps: ""
  })

  useEffect(() => {
    setWellColors(configuration.wellColors)
    setSectorColors(configuration.sectorColors)
    setPersonnel(configuration.personnel)
  }, [configuration])

  const handleWellColorChange = (wellId: string, color: string) => {
    setWellColors(prev => {
      const existing = prev.find(w => w.wellId === wellId)
      if (existing) {
        return prev.map(w => w.wellId === wellId ? { ...w, color } : w)
      }
      return [...prev, { wellId, color, isUsed: true }]
    })
  }

  const handleWellToggle = (wellId: string) => {
    setWellColors(prev => {
      const existing = prev.find(w => w.wellId === wellId)
      if (existing) {
        return prev.map(w => w.wellId === wellId ? { ...w, isUsed: !w.isUsed } : w)
      }
      return [...prev, { wellId, color: "#000000", isUsed: true }]
    })
  }

  const handleSectorColorChange = (sector: SectorType, color: string) => {
    setSectorColors(prev => {
      const existing = prev.find(s => s.sector === sector)
      if (existing) {
        return prev.map(s => s.sector === sector ? { ...s, color } : s)
      }
      return [...prev, { sector, color, isUsed: true }]
    })
  }

  const handleSectorToggle = (sector: SectorType) => {
    setSectorColors(prev => {
      const existing = prev.find(s => s.sector === sector)
      if (existing) {
        return prev.map(s => s.sector === sector ? { ...s, isUsed: !s.isUsed } : s)
      }
      return [...prev, { sector, color: "#000000", isUsed: true }]
    })
  }

  const handleAddPersonnel = (category: keyof typeof personnel) => {
    if (!newPersonnel[category]) return

    setPersonnel(prev => ({
      ...prev,
      [category]: [...prev[category], newPersonnel[category]]
    }))
    setNewPersonnel(prev => ({
      ...prev,
      [category]: ""
    }))
  }

  const handleRemovePersonnel = (category: keyof typeof personnel, name: string) => {
    setPersonnel(prev => ({
      ...prev,
      [category]: prev[category].filter(p => p !== name)
    }))
  }

  const handleSave = () => {
    onSave({
      ...configuration,
      wellColors,
      sectorColors,
      personnel
    })
    onClose()
  }

  const isWellUsed = (wellId: string) => {
    return wellColors.find(w => w.wellId === wellId)?.isUsed || false
  }

  const isSectorUsed = (sector: SectorType) => {
    return sectorColors.find(s => s.sector === sector)?.isUsed || false
  }

  const getWellColor = (wellId: string) => {
    return wellColors.find(w => w.wellId === wellId)?.color || "#000000"
  }

  const getSectorColor = (sector: SectorType) => {
    return sectorColors.find(s => s.sector === sector)?.color || "#000000"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">
            Configure Project
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wells">Wells</TabsTrigger>
            <TabsTrigger value="sectors">Sectors</TabsTrigger>
            <TabsTrigger value="personnel">Personnel</TabsTrigger>
          </TabsList>

          <TabsContent value="wells" className="space-y-4">
            <div className="grid gap-4">
              {wells.map((well) => (
                <div key={well.id} className="flex items-center justify-between gap-4">
                  <Toggle
                    pressed={isWellUsed(well.id)}
                    onPressedChange={() => handleWellToggle(well.id)}
                    className="min-w-[180px] justify-between gap-2 data-[state=on]:bg-green-50 data-[state=on]:text-green-700 data-[state=on]:border-green-200"
                  >
                    <span className="truncate">{well.name}</span>
                    {isWellUsed(well.id) ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                  </Toggle>
                  <Input
                    type="color"
                    value={getWellColor(well.id)}
                    onChange={(e) => handleWellColorChange(well.id, e.target.value)}
                    className="w-16 h-8 p-1"
                    disabled={!isWellUsed(well.id)}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sectors" className="space-y-4">
            <div className="grid gap-4">
              {SECTOR_TYPES.map((sector) => (
                <div key={sector} className="flex items-center justify-between gap-4">
                  <Toggle
                    pressed={isSectorUsed(sector)}
                    onPressedChange={() => handleSectorToggle(sector)}
                    className="min-w-[180px] justify-between gap-2 data-[state=on]:bg-green-50 data-[state=on]:text-green-700 data-[state=on]:border-green-200"
                  >
                    <span className="truncate">{sector}</span>
                    {isSectorUsed(sector) ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                  </Toggle>
                  <Input
                    type="color"
                    value={getSectorColor(sector)}
                    onChange={(e) => handleSectorColorChange(sector, e.target.value)}
                    className="w-16 h-8 p-1"
                    disabled={!isSectorUsed(sector)}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="personnel" className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-4">
                <Label>Engineers</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPersonnel.engineers}
                    onChange={(e) => setNewPersonnel(prev => ({ ...prev, engineers: e.target.value }))}
                    placeholder="Add engineer name"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddPersonnel("engineers")}
                    disabled={!newPersonnel.engineers}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {personnel.engineers.map((name) => (
                    <Button
                      key={name}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRemovePersonnel("engineers", name)}
                      className="gap-2"
                    >
                      {name}
                      <XCircle className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Pump Operators</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPersonnel.pumpOperators}
                    onChange={(e) => setNewPersonnel(prev => ({ ...prev, pumpOperators: e.target.value }))}
                    placeholder="Add pump operator name"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddPersonnel("pumpOperators")}
                    disabled={!newPersonnel.pumpOperators}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {personnel.pumpOperators.map((name) => (
                    <Button
                      key={name}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRemovePersonnel("pumpOperators", name)}
                      className="gap-2"
                    >
                      {name}
                      <XCircle className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Supervisors</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPersonnel.supervisors}
                    onChange={(e) => setNewPersonnel(prev => ({ ...prev, supervisors: e.target.value }))}
                    placeholder="Add supervisor name"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddPersonnel("supervisors")}
                    disabled={!newPersonnel.supervisors}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {personnel.supervisors.map((name) => (
                    <Button
                      key={name}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRemovePersonnel("supervisors", name)}
                      className="gap-2"
                    >
                      {name}
                      <XCircle className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Customer Representatives</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPersonnel.customerReps}
                    onChange={(e) => setNewPersonnel(prev => ({ ...prev, customerReps: e.target.value }))}
                    placeholder="Add customer representative name"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddPersonnel("customerReps")}
                    disabled={!newPersonnel.customerReps}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {personnel.customerReps.map((name) => (
                    <Button
                      key={name}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRemovePersonnel("customerReps", name)}
                      className="gap-2"
                    >
                      {name}
                      <XCircle className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => handleSave()}>Save Configuration</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 