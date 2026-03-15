import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { TargetTree } from '@/components/target-tree'
import { TargetForm } from '@/components/target-form'
import type { SmokePingConfig, Selection } from '@/lib/types'
import type { Action } from '@/hooks/use-smokeping-store'
import { importFromText } from '@/lib/import-export'

interface TargetsTabProps {
  config: SmokePingConfig
  selection: Selection
  onSelect: (s: Selection) => void
  dispatch: (action: Action) => void
}

function SelectionBreadcrumb({ selection, config }: { selection: Selection; config: SmokePingConfig }) {
  if (selection.kind === 'globals') {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbPage>Global Settings</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const section = config.sections.find((s) => s.id === selection.sectionId)
  const group = section?.groups.find((g) => g.id === selection.groupId)
  const target = group?.targets.find((t) => t.id === selection.targetId)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {section && (
          <>
            <BreadcrumbItem><BreadcrumbPage>{section.key || 'Section'}</BreadcrumbPage></BreadcrumbItem>
          </>
        )}
        {group && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{group.key || 'Group'}</BreadcrumbPage></BreadcrumbItem>
          </>
        )}
        {target && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{target.key || 'Target'}</BreadcrumbPage></BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export function TargetsTab({ config, selection, onSelect, dispatch }: TargetsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = importFromText(ev.target?.result as string)
        dispatch({ type: 'LOAD_CONFIG', payload: imported })
        const totalGroups = imported.sections.reduce((n, s) => n + s.groups.length, 0)
        const totalTargets = imported.sections.reduce((n, s) => s.groups.reduce((m, g) => m + g.targets.length, n), 0)
        toast.success(`Imported ${imported.sections.length} section${imported.sections.length !== 1 ? 's' : ''}, ${totalGroups} group${totalGroups !== 1 ? 's' : ''}, ${totalTargets} target${totalTargets !== 1 ? 's' : ''}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Import failed')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <TooltipProvider>
      <div className="border rounded-md overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* Tree pane */}
          <ResizablePanel defaultSize="22%" minSize="180px" maxSize="40%" className="flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex-1">
                Structure
              </span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Import config"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import JSON / YAML</TooltipContent>
              </Tooltip>

            </div>
            <ScrollArea className="flex-1 p-2 min-w-0">
              <TargetTree
                sections={config.sections}
                selection={selection}
                onSelect={onSelect}
                dispatch={dispatch}
              />
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Form pane */}
          <ResizablePanel defaultSize="78%" className="flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b flex items-center min-h-[37px]">
              <SelectionBreadcrumb selection={selection} config={config} />
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                {config.sections.length === 0 && selection.kind === 'globals' ? (
                  <div className="flex flex-col gap-6">
                    <TargetForm selection={selection} config={config} dispatch={dispatch} />
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Add a section in the tree to start building your target hierarchy.
                    </div>
                  </div>
                ) : (
                  <TargetForm selection={selection} config={config} dispatch={dispatch} />
                )}
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  )
}
