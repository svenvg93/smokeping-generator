import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ExtraFieldsEditorProps {
  fields: Record<string, string>
  onChange: (fields: Record<string, string>) => void
}

export function ExtraFieldsEditor({ fields, onChange }: ExtraFieldsEditorProps) {
  const entries = Object.entries(fields ?? {})

  function updateKey(oldKey: string, newKey: string) {
    const updated: Record<string, string> = {}
    for (const [k, v] of Object.entries(fields ?? {})) {
      updated[k === oldKey ? newKey : k] = v
    }
    onChange(updated)
  }

  function updateValue(key: string, value: string) {
    onChange({ ...fields, [key]: value })
  }

  function removeField(key: string) {
    const updated = { ...fields }
    delete updated[key]
    onChange(updated)
  }

  function addField() {
    const key = `field${entries.length + 1}`
    onChange({ ...fields, [key]: '' })
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-2 items-center">
          <Input
            value={key}
            onChange={(e) => updateKey(key, e.target.value)}
            placeholder="key"
            className="w-32 font-mono text-xs"
          />
          <span className="text-muted-foreground text-sm">=</span>
          <Input
            value={value}
            onChange={(e) => updateValue(key, e.target.value)}
            placeholder="value"
            className="flex-1 font-mono text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => removeField(key)}
            aria-label="Remove field"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-fit" onClick={addField}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add field
      </Button>
    </div>
  )
}
