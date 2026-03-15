import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TargetTree } from '@/components/target-tree'
import { TargetForm } from '@/components/target-form'
import type { SmokePingConfig, Selection } from '@/lib/types'
import type { Action } from '@/hooks/use-smokeping-store'
import { exportToJson, exportToYaml, exportToConf, importFromText, downloadFile } from '@/lib/import-export'

interface TargetsTabProps {
  config: SmokePingConfig
  selection: Selection
  onSelect: (s: Selection) => void
  dispatch: (action: Action) => void
}

export function TargetsTab({ config, selection, onSelect, dispatch }: TargetsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  function handleExportJson() {
    downloadFile(exportToJson(config), 'smokeping-config.json', 'application/json')
  }

  function handleExportYaml() {
    downloadFile(exportToYaml(config), 'smokeping-config.yaml', 'text/yaml')
  }

  function handleExportConf() {
    downloadFile(exportToConf(config), 'smokeping.conf', 'text/plain')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = importFromText(ev.target?.result as string)
        dispatch({ type: 'LOAD_CONFIG', payload: imported })
        setImportError(null)
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Import failed')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <TooltipProvider>
      <div className="flex border rounded-md overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Tree pane */}
        <div className="w-52 shrink-0 flex flex-col overflow-hidden">
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

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Export config">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Export config</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportJson}>Export as JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportYaml}>Export as YAML</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportConf}>Export as SmokePing config</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {importError && (
            <div className="px-3 py-1.5 bg-destructive/10 border-b">
              <p className="text-xs text-destructive">{importError}</p>
            </div>
          )}
          <ScrollArea className="flex-1 p-2 min-w-0">
            <TargetTree
              sections={config.sections}
              selection={selection}
              onSelect={onSelect}
              dispatch={dispatch}
            />
          </ScrollArea>
        </div>

        <Separator orientation="vertical" />

        {/* Form pane */}
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
            Properties
          </div>
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
        </div>
      </div>
    </TooltipProvider>
  )
}
