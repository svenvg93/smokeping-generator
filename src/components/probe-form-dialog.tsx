import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ExtraFieldsEditor } from '@/components/extra-fields-editor'
import type { Probe, ProbeType } from '@/lib/types'
import { PROBE_TYPES, PROBE_DEFAULTS } from '@/lib/constants'

interface ProbeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  probe: Probe | null
  onSave: (probe: Probe) => void
}

const defaultProbe = (): Probe => ({
  id: crypto.randomUUID(),
  name: 'FPing',
  type: 'FPing',
  binary: PROBE_DEFAULTS.FPing.binary,
  pings: 20,
  step: 300,
  extraFields: {},
})

export function ProbeFormDialog({ open, onOpenChange, probe, onSave }: ProbeFormDialogProps) {
  const [form, setForm] = useState<Probe>(defaultProbe)

  useEffect(() => {
    setForm(probe ?? defaultProbe())
  }, [probe, open])

  function handleTypeChange(type: ProbeType) {
    const defaults = PROBE_DEFAULTS[type]
    setForm((f) => ({
      ...f,
      type,
      binary: defaults.binary,
      extraFields: { ...defaults.extraFields },
    }))
  }

  function handleSave() {
    onSave(form)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{probe ? 'Edit Probe' : 'Add Probe'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="FPing"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => handleTypeChange(v as ProbeType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROBE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Binary path</Label>
            <Input
              value={form.binary}
              onChange={(e) => setForm({ ...form, binary: e.target.value })}
              placeholder="/usr/bin/fping"
              className="font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Pings</Label>
              <Input
                type="number"
                value={form.pings}
                onChange={(e) => setForm({ ...form, pings: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Step (seconds)</Label>
              <Input
                type="number"
                value={form.step}
                onChange={(e) => setForm({ ...form, step: Number(e.target.value) })}
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label>Extra fields</Label>
            <ExtraFieldsEditor
              fields={form.extraFields}
              onChange={(extraFields) => setForm({ ...form, extraFields })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
