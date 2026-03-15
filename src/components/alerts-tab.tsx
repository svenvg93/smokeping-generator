import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertFormDialog } from '@/components/alert-form-dialog'
import type { Alert, AlertGlobals } from '@/lib/types'
import type { Action } from '@/hooks/use-smokeping-store'

interface AlertsTabProps {
  alertGlobals: AlertGlobals
  alerts: Alert[]
  probeNames: string[]
  dispatch: (action: Action) => void
}

export function AlertsTab({ alertGlobals, alerts, dispatch }: AlertsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)

  function openAdd() {
    setEditingAlert(null)
    setDialogOpen(true)
  }

  function openEdit(alert: Alert) {
    setEditingAlert(alert)
    setDialogOpen(true)
  }

  function handleSave(alert: Alert) {
    if (editingAlert) {
      dispatch({ type: 'UPDATE_ALERT', id: alert.id, payload: alert })
    } else {
      dispatch({ type: 'ADD_ALERT', payload: alert })
    }
  }

  function handleDelete(id: string) {
    dispatch({ type: 'DELETE_ALERT', id })
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 max-w-2xl">
        {/* Global alert settings */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Global Settings</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>To (alert recipient)</Label>
              <Input
                value={alertGlobals.to}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_ALERT_GLOBALS', payload: { to: e.target.value } })
                }
                placeholder="alerts@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>From (sender address)</Label>
              <Input
                value={alertGlobals.from}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_ALERT_GLOBALS', payload: { from: e.target.value } })
                }
                placeholder="smokeping@example.com"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Alert list */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Define alert rules for latency or packet loss thresholds.
            </p>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Alert
            </Button>
          </div>

          {alerts.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No alerts configured. Add an alert to get started.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 rounded-md border bg-card px-4 py-3"
                >
                  <div className="flex-1 flex items-center gap-3">
                    <span className="font-mono font-medium">{alert.name}</span>
                    <Badge variant="secondary">{alert.type}</Badge>
                    <span className="text-sm text-muted-foreground font-mono truncate max-w-xs">
                      {alert.type === 'matcher' ? alert.matcher : alert.pattern}
                    </span>
                  </div>
                  {alert.comment && (
                    <span className="text-sm text-muted-foreground italic truncate max-w-[200px]">
                      {alert.comment}
                    </span>
                  )}
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(alert)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit alert</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(alert.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete alert</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AlertFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          alert={editingAlert}
          onSave={handleSave}
        />
      </div>
    </TooltipProvider>
  )
}
