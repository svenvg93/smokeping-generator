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
import type { Alert, AlertType } from '@/lib/types'

interface AlertFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  alert: Alert | null
  onSave: (alert: Alert) => void
}

const defaultAlert = (): Alert => ({
  id: crypto.randomUUID(),
  name: 'someloss',
  type: 'loss',
  pattern: '==0%,==0%,==0%,==0%,>0%,>0%,>0%',
  comment: 'loss detected',
  extraFields: {},
})

export function AlertFormDialog({ open, onOpenChange, alert, onSave }: AlertFormDialogProps) {
  const [form, setForm] = useState<Alert>(defaultAlert)

  useEffect(() => {
    setForm(alert ?? defaultAlert())
  }, [alert, open])

  function handleSave() {
    onSave(form)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{alert ? 'Edit Alert' : 'Add Alert'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="someloss"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as AlertType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loss">loss</SelectItem>
                  <SelectItem value="rtt">rtt</SelectItem>
                  <SelectItem value="matcher">matcher</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.type === 'matcher' ? (
            <div className="flex flex-col gap-1.5">
              <Label>Matcher expression</Label>
              <Input
                value={form.matcher ?? ''}
                onChange={(e) => setForm({ ...form, matcher: e.target.value })}
                placeholder="Avail=>80%"
                className="font-mono text-sm"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label>Pattern</Label>
              <Input
                value={form.pattern}
                onChange={(e) => setForm({ ...form, pattern: e.target.value })}
                placeholder="==0%,==0%,==0%,==0%,>0%,>0%,>0%"
                className="font-mono text-sm"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Comment</Label>
            <Input
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="loss detected"
            />
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
