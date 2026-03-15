import { useState, useEffect, useRef } from 'react'
import { Activity, Github } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ModeToggle } from '@/components/mode-toggle'
import { Toaster } from '@/components/ui/sonner'
import { useSmokePingStore } from '@/hooks/use-smokeping-store'
import type { Selection } from '@/lib/types'
import { TargetsTab } from '@/components/targets-tab'
import { ProbesTab } from '@/components/probes-tab'
import { PreviewTab } from '@/components/preview-tab'
import { GITHUB_REPO_URL } from '@/lib/constants'

export default function App() {
  const { config, dispatch, preview } = useSmokePingStore()
  const [selection, setSelection] = useState<Selection>({ kind: 'globals' })
  const selectionRef = useRef(selection)
  selectionRef.current = selection

  useEffect(() => {
    const sel = selectionRef.current
    if (sel.kind === 'globals') return
    const section = config.sections.find((s) => s.id === sel.sectionId)
    if (!section) { setSelection({ kind: 'globals' }); return }
    if (sel.kind === 'section') return
    const group = section.groups.find((g) => g.id === sel.groupId)
    if (!group) { setSelection({ kind: 'globals' }); return }
    if (sel.kind === 'group') return
    const target = group.targets.find((t) => t.id === sel.targetId)
    if (!target) setSelection({ kind: 'globals' })
  }, [config])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg tracking-tight">SmokePing Generator</span>
          <div className="flex-1" />
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub repository"
          >
            <Github className="h-5 w-5" />
          </a>
          <ModeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        <Tabs defaultValue="targets" className="flex flex-col h-full">
          <TabsList className="w-fit mb-4">
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="probes" className="gap-2">
              Probes
              {config.probes.length > 0 && (
                <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
                  {config.probes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preview">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="targets" className="flex-1 mt-0">
            <TargetsTab
              config={config}
              selection={selection}
              onSelect={setSelection}
              dispatch={dispatch}
            />
          </TabsContent>

          <TabsContent value="probes" className="mt-0">
            <ProbesTab probes={config.probes} sections={config.sections} dispatch={dispatch} />
          </TabsContent>

          <TabsContent value="preview" className="mt-0 data-[state=inactive]:hidden" forceMount>
            <PreviewTab preview={preview} />
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  )
}
