import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExtraFieldsEditor } from '@/components/extra-fields-editor'
import type { SmokePingConfig, Selection, TargetGroup, Target } from '@/lib/types'
import type { Action } from '@/hooks/use-smokeping-store'

type GroupPayload = Partial<Omit<TargetGroup, 'id' | 'targets'>>
type TargetPayload = Partial<Omit<Target, 'id'>>

interface TargetFormProps {
  selection: Selection
  config: SmokePingConfig
  dispatch: (action: Action) => void
}

// ── Dual Stack host field ─────────────────────────────────────────────────────

interface DualStackHostFieldProps {
  host: string
  onHostChange: (v: string) => void
  ipv6Host: string | undefined
  onIpv6HostChange: (v: string | undefined) => void
  sameHost: boolean | undefined
  onSameHostChange: (v: boolean | undefined) => void
  showCombined: boolean | undefined
  onShowCombinedChange: (v: boolean | undefined) => void
  keyName: string
  optional?: boolean
}

function DualStackHostField({
  host, onHostChange,
  ipv6Host, onIpv6HostChange,
  sameHost, onSameHostChange,
  showCombined, onShowCombinedChange,
  keyName, optional = false,
}: DualStackHostFieldProps) {
  const isDualStack = ipv6Host !== undefined

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>
          {isDualStack ? 'Hosts' : 'Host'}
          {optional && <span className="text-muted-foreground text-xs ml-1">(optional)</span>}
        </Label>
        <button
          type="button"
          onClick={() => {
            if (isDualStack) {
              onIpv6HostChange(undefined)
              onShowCombinedChange(undefined)
            } else {
              onIpv6HostChange('')
            }
          }}
          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors ${
            isDualStack
              ? 'bg-primary text-primary-foreground border-primary'
              : 'text-muted-foreground border-border hover:border-foreground hover:text-foreground'
          }`}
        >
          {isDualStack
            ? <><span>Dual Stack</span><X className="h-3 w-3" /></>
            : <><Plus className="h-3 w-3" /><span>Dual Stack</span></>
          }
        </button>
      </div>

      {isDualStack ? (
        <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3">
          <div className={sameHost ? 'flex flex-col gap-1.5' : 'grid grid-cols-2 gap-3'}>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  IPv4
                </span>
                <span className="text-xs text-muted-foreground">FPing</span>
                {!sameHost && (
                  <>
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 ml-2">
                      IPv6
                    </span>
                    <span className="text-xs text-muted-foreground">FPing6</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {sameHost ? (
            <Input
              value={host}
              onChange={(e) => onHostChange(e.target.value)}
              placeholder="google.com"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={host}
                onChange={(e) => onHostChange(e.target.value)}
                placeholder="8.8.8.8"
              />
              <Input
                value={ipv6Host}
                onChange={(e) => onIpv6HostChange(e.target.value)}
                placeholder="2001:4860:4860::8888"
              />
            </div>
          )}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id={`${keyName}-same-host`}
                checked={!!sameHost}
                onCheckedChange={(v) => onSameHostChange(v || undefined)}
              />
              <Label htmlFor={`${keyName}-same-host`} className="text-xs font-normal text-muted-foreground cursor-pointer">
                Same host for IPv4 and IPv6
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`${keyName}-combined`}
                checked={!!showCombined}
                onCheckedChange={(v) => onShowCombinedChange(v || undefined)}
              />
              <Label htmlFor={`${keyName}-combined`} className="text-xs font-normal text-muted-foreground cursor-pointer">
                Combined chart — also generates{' '}
                <span className="font-mono text-foreground">{keyName}_combined</span>
              </Label>
            </div>
          </div>
        </div>
      ) : (
        <Input
          value={host}
          onChange={(e) => onHostChange(e.target.value)}
          placeholder={optional ? '192.168.1.1' : '8.8.8.8'}
        />
      )}
    </div>
  )
}

// ── Probe override select ─────────────────────────────────────────────────────

interface ProbeSelectProps {
  value: string | undefined
  probeNames: string[]
  onChange: (v: string | undefined) => void
}

function ProbeSelect({ value, probeNames, onChange }: ProbeSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Probe override <span className="text-muted-foreground text-xs">(optional)</span></Label>
      {probeNames.length > 0 ? (
        <Select
          value={value ?? '__none__'}
          onValueChange={(v) => onChange(v === '__none__' ? undefined : v)}
        >
          <SelectTrigger><SelectValue placeholder="Use global default" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Use global default</SelectItem>
            {probeNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="Use global default"
        />
      )}
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function TargetForm({ selection, config, dispatch }: TargetFormProps) {
  const probeNames = config.probes.map((p) => p.name)

  if (selection.kind === 'globals') {
    const globals = config.targetGlobals
    return (
      <div className="flex flex-col gap-4">
        <h3 className="font-medium">Global Target Settings</h3>
        <div className="flex flex-col gap-1.5">
          <Label>Default probe</Label>
          {probeNames.length > 0 ? (
            <Select
              value={globals.probe}
              onValueChange={(v) => dispatch({ type: 'UPDATE_TARGET_GLOBALS', payload: { probe: v } })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {probeNames.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={globals.probe}
              onChange={(e) => dispatch({ type: 'UPDATE_TARGET_GLOBALS', payload: { probe: e.target.value } })}
              placeholder="FPing"
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Menu label</Label>
          <Input
            value={globals.menu}
            onChange={(e) => dispatch({ type: 'UPDATE_TARGET_GLOBALS', payload: { menu: e.target.value } })}
            placeholder="Top"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Title</Label>
          <Input
            value={globals.title}
            onChange={(e) => dispatch({ type: 'UPDATE_TARGET_GLOBALS', payload: { title: e.target.value } })}
            placeholder="Network Latency Grapher"
          />
        </div>
      </div>
    )
  }

  if (selection.kind === 'section') {
    const section = config.sections.find((s) => s.id === selection.sectionId)
    if (!section) return <EmptyState message="Section not found." />
    return (
      <div className="flex flex-col gap-4">
        <h3 className="font-medium">Section <span className="text-muted-foreground font-mono">+{section.key}</span></h3>
        <div className="flex flex-col gap-1.5">
          <Label>Key (config identifier)</Label>
          <Input
            value={section.key}
            onChange={(e) => dispatch({ type: 'UPDATE_SECTION', id: section.id, payload: { key: e.target.value } })}
            className="font-mono"
            placeholder="Internet"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Menu label</Label>
          <Input
            value={section.menu}
            onChange={(e) => dispatch({ type: 'UPDATE_SECTION', id: section.id, payload: { menu: e.target.value } })}
            placeholder="Internet"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Title</Label>
          <Input
            value={section.title}
            onChange={(e) => dispatch({ type: 'UPDATE_SECTION', id: section.id, payload: { title: e.target.value } })}
            placeholder="Internet Hosts"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Remark <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            value={section.remark ?? ''}
            onChange={(e) => dispatch({ type: 'UPDATE_SECTION', id: section.id, payload: { remark: e.target.value || undefined } })}
            placeholder="Optional description shown in the web interface"
          />
        </div>
      </div>
    )
  }

  if (selection.kind === 'group') {
    const section = config.sections.find((s) => s.id === selection.sectionId)
    const group = section?.groups.find((g) => g.id === selection.groupId)
    if (!group) return <EmptyState message="Group not found." />

    const sid = selection.sectionId!
    const upd = (payload: GroupPayload) =>
      dispatch({ type: 'UPDATE_GROUP', sectionId: sid, id: group.id, payload })

    return (
      <div className="flex flex-col gap-4">
        <h3 className="font-medium">Group <span className="text-muted-foreground font-mono">++{group.key}</span></h3>

        <div className="flex flex-col gap-1.5">
          <Label>Key (config identifier)</Label>
          <Input
            value={group.key}
            onChange={(e) => upd({ key: e.target.value })}
            className="font-mono"
            placeholder="ISP_A"
          />
        </div>

        <DualStackHostField
          host={group.host ?? ''}
          onHostChange={(v) => upd({ host: v || undefined })}
          ipv6Host={group.ipv6Host}
          onIpv6HostChange={(v) => upd({ ipv6Host: v })}
          sameHost={group.sameHost}
          onSameHostChange={(v) => upd({ sameHost: v })}
          showCombined={group.showCombined}
          onShowCombinedChange={(v) => upd({ showCombined: v })}
          keyName={group.key}
          optional
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Menu label</Label>
            <Input value={group.menu} onChange={(e) => upd({ menu: e.target.value })} placeholder="ISP A" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={group.title} onChange={(e) => upd({ title: e.target.value })} placeholder="ISP A Links" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Remark <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            value={group.remark ?? ''}
            onChange={(e) => upd({ remark: e.target.value || undefined })}
            placeholder="Optional description shown in the web interface"
          />
        </div>

        <ProbeSelect value={group.probe} probeNames={probeNames} onChange={(v) => upd({ probe: v })} />

        <Separator />

        <div className="flex flex-col gap-2">
          <Label>Extra fields</Label>
          <ExtraFieldsEditor
            fields={group.extraFields}
            onChange={(extraFields) => upd({ extraFields })}
          />
        </div>
      </div>
    )
  }

  if (selection.kind === 'target') {
    const section = config.sections.find((s) => s.id === selection.sectionId)
    const group = section?.groups.find((g) => g.id === selection.groupId)
    const target = group?.targets.find((t) => t.id === selection.targetId)
    if (!target) return <EmptyState message="Target not found." />

    const sid = selection.sectionId!
    const gid = selection.groupId!
    const upd = (payload: TargetPayload) =>
      dispatch({ type: 'UPDATE_TARGET', sectionId: sid, groupId: gid, id: target.id, payload })

    return (
      <div className="flex flex-col gap-4">
        <h3 className="font-medium">Target <span className="text-muted-foreground font-mono">+++{target.key}</span></h3>

        <div className="flex flex-col gap-1.5">
          <Label>Key (config identifier)</Label>
          <Input
            value={target.key}
            onChange={(e) => upd({ key: e.target.value })}
            className="font-mono"
            placeholder="Gateway"
          />
        </div>

        <DualStackHostField
          host={target.host}
          onHostChange={(v) => upd({ host: v })}
          ipv6Host={target.ipv6Host}
          onIpv6HostChange={(v) => upd({ ipv6Host: v })}
          sameHost={target.sameHost}
          onSameHostChange={(v) => upd({ sameHost: v })}
          showCombined={target.showCombined}
          onShowCombinedChange={(v) => upd({ showCombined: v })}
          keyName={target.key}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Menu label</Label>
            <Input value={target.menu} onChange={(e) => upd({ menu: e.target.value })} placeholder="Gateway" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={target.title} onChange={(e) => upd({ title: e.target.value })} placeholder="Default Gateway" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Remark <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            value={target.remark ?? ''}
            onChange={(e) => upd({ remark: e.target.value || undefined })}
            placeholder="Optional description shown in the web interface"
          />
        </div>

        <ProbeSelect value={target.probe} probeNames={probeNames} onChange={(v) => upd({ probe: v })} />

        <Separator />

        <div className="flex flex-col gap-2">
          <Label>Extra fields</Label>
          <ExtraFieldsEditor
            fields={target.extraFields}
            onChange={(extraFields) => upd({ extraFields })}
          />
        </div>
      </div>
    )
  }

  return null
}

function EmptyState({ message }: { message: string }) {
  return <div className="text-sm text-muted-foreground p-4">{message}</div>
}
