"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { type Personnel, type ProjectConfiguration } from "@/lib/types"

interface PersonnelSelectorProps {
  value: Personnel
  onChange: (personnel: Personnel) => void
  configuration: ProjectConfiguration
}

export function PersonnelSelector({ value, onChange, configuration }: PersonnelSelectorProps) {
  const handleChange = (field: keyof Personnel, inputValue: string) => {
    const newValue = { ...value, [field]: inputValue }
    onChange(newValue)
  }

  // Ensure configuration.personnel exists and has the required arrays
  const personnel = configuration?.personnel || {
    engineers: [],
    pumpOperators: [],
    supervisors: [],
    customerReps: []
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="grid gap-2">
        <Label>Engineer</Label>
        <Input
          type="text"
          value={value?.engineer || ""}
          onChange={(e) => handleChange('engineer', e.target.value)}
          list="engineer-options"
          className="border-red-600/20"
        />
        <datalist id="engineer-options">
          {personnel.engineers.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-2">
        <Label>Pump Operator</Label>
        <Input
          type="text"
          value={value?.pumpOperator || ""}
          onChange={(e) => handleChange('pumpOperator', e.target.value)}
          list="pump-operator-options"
          className="border-red-600/20"
        />
        <datalist id="pump-operator-options">
          {personnel.pumpOperators.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-2">
        <Label>Supervisor</Label>
        <Input
          type="text"
          value={value?.supervisor || ""}
          onChange={(e) => handleChange('supervisor', e.target.value)}
          list="supervisor-options"
          className="border-red-600/20"
        />
        <datalist id="supervisor-options">
          {personnel.supervisors.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-2">
        <Label>Customer Rep</Label>
        <Input
          type="text"
          value={value?.customerRep || ""}
          onChange={(e) => handleChange('customerRep', e.target.value)}
          list="customer-rep-options"
          className="border-red-600/20"
        />
        <datalist id="customer-rep-options">
          {personnel.customerReps.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>
    </div>
  )
} 