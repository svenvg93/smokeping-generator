import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ProbeFormDialog } from '@/components/probe-form-dialog'
import type { Probe, TargetSection } from '@/lib/types'
import type { Action } from '@/hooks/use-smokeping-store'

interface ProbesTabProps {
  probes: Probe[]
  sections: TargetSection[]
  dispatch: (action: Action) => void
}

export function ProbesTab({ probes, sections, dispatch }: ProbesTabProps) {
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Binary</TableHead>
                  <TableHead>Pings</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {probes.map((probe) => (
                  <TableRow key={probe.id}>
                    <TableCell className="font-mono font-medium">{probe.name}</TableCell>
                    <TableCell><Badge variant="secondary">{probe.type}</Badge></TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{probe.binary}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{probe.pings}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{probe.step}s</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
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
                        <AlertDialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Delete probe</TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete probe "{probe.name}"?</AlertDialogTitle>
                              <AlertDialogDescription asChild>
                                <div className="flex flex-col gap-1.5">
                                  <span>This will permanently remove this probe definition.</span>
                                  {(() => {
                                    const affected = sections.flatMap((s) =>
                                      s.groups.flatMap((g) => [
                                        ...g.targets.filter((t) => t.probe === probe.name).map((t) => `${s.key} / ${g.key} / ${t.key}`),
                                        ...(g.probe === probe.name ? [`${s.key} / ${g.key} (group)`] : []),
                                      ])
                                    )
                                    if (affected.length === 0) return null
                                    return (
                                      <span className="text-foreground">
                                        {affected.length} target{affected.length !== 1 ? 's' : ''} reference this probe and will lose their override:{' '}
                                        <span className="font-mono text-xs">{affected.join(', ')}</span>
                                      </span>
                                    )
                                  })()}
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(probe.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <ProbeFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          probe={editingProbe}
          existingNames={probes.filter((p) => p.id !== editingProbe?.id).map((p) => p.name)}
          onSave={handleSave}
        />
      </div>
    </TooltipProvider>
  )
}
