import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ProbeFormDialog } from '@/components/probe-form-dialog'
import type { Probe } from '@/lib/types'
import type { Action } from '@/hooks/use-smokeping-store'

interface ProbesTabProps {
  probes: Probe[]
  dispatch: (action: Action) => void
}

export function ProbesTab({ probes, dispatch }: ProbesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProbe, setEditingProbe] = useState<Probe | null>(null)

  function openAdd() {
    setEditingProbe(null)
    setDialogOpen(true)
  }

  function openEdit(probe: Probe) {
    setEditingProbe(probe)
    setDialogOpen(true)
  }

  function handleSave(probe: Probe) {
    if (editingProbe) {
      dispatch({ type: 'UPDATE_PROBE', id: probe.id, payload: probe })
    } else {
      dispatch({ type: 'ADD_PROBE', payload: probe })
    }
  }

  function handleDelete(id: string) {
    dispatch({ type: 'DELETE_PROBE', id })
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Define probe types used to monitor your targets.
          </p>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Probe
          </Button>
        </div>

        {probes.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No probes configured. Add a probe to get started.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {probes.map((probe) => (
              <div
                key={probe.id}
                className="flex items-center gap-3 rounded-md border bg-card px-4 py-3"
              >
                <div className="flex-1 flex items-center gap-3">
                  <span className="font-mono font-medium">{probe.name}</span>
                  <Badge variant="secondary">{probe.type}</Badge>
                  <span className="text-sm text-muted-foreground font-mono">
                    {probe.binary}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{probe.pings} pings</span>
                  <span className="mx-1">·</span>
                  <span>step {probe.step}s</span>
                </div>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(probe)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit probe</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(probe.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete probe</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}

        <ProbeFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          probe={editingProbe}
          onSave={handleSave}
        />
      </div>
    </TooltipProvider>
  )
}
