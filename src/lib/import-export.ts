import yaml from 'js-yaml'
import type {
  SmokePingConfig,
  Probe,
  ProbeType,
  TargetGlobals,
  TargetSection,
  TargetGroup,
} from './types'
import { generateConfig } from './generate'

// ── Helpers ────────────────────────────────────────────────────────────────

function parseKV(line: string): [string, string] | null {
  const idx = line.indexOf('=')
  if (idx < 0) return null
  return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
}

function extraFields(fields: Record<string, string>, known: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (!known.includes(k)) out[k] = v
  }
  return out
}

const PROBE_TYPE_LIST: ProbeType[] = [
  'FPing', 'FPing6', 'DNS', 'HTTP', 'Curl', 'Ntp', 'EchoPing', 'TCPPing',
]

function inferProbeType(name: string): ProbeType {
  if (PROBE_TYPE_LIST.includes(name as ProbeType)) return name as ProbeType
  for (const t of PROBE_TYPE_LIST) {
    if (name.startsWith(t)) return t
  }
  return 'FPing'
}

// ── Section parsers ────────────────────────────────────────────────────────

function parseProbesSection(lines: string[]): Probe[] {
  const probes: Probe[] = []
  let name = ''
  let binary = ''
  let pings = 20
  let step = 300
  let extra: Record<string, string> = {}
  let active = false

  const flush = () => {
    if (!active) return
    probes.push({ id: crypto.randomUUID(), name, type: inferProbeType(name), binary, pings, step, extraFields: extra })
  }

  for (const line of lines) {
    if (/^\+[^+]/.test(line)) {
      flush()
      name = line.slice(1).trim()
      binary = ''; pings = 20; step = 300; extra = {}; active = true
    } else if (active) {
      const kv = parseKV(line)
      if (!kv) continue
      const [k, v] = kv
      if (k === 'binary') binary = v
      else if (k === 'pings') pings = parseInt(v) || 20
      else if (k === 'step') step = parseInt(v) || 300
      else extra[k] = v
    }
  }
  flush()
  return probes
}

type ParsedNode = { level: 1 | 2 | 3; key: string; fields: Record<string, string> }

function parseTargetsSection(lines: string[]): { targetGlobals: TargetGlobals; sections: TargetSection[] } {
  const targetGlobals: TargetGlobals = { probe: 'FPing', menu: 'Top', title: 'Network Latency Grapher' }
  const nodes: ParsedNode[] = []
  let current: ParsedNode | null = null
  let inGlobals = true

  for (const line of lines) {
    const m = line.match(/^(\+{1,3})\s+(.+)$/)
    if (m) {
      if (current) nodes.push(current)
      inGlobals = false
      current = { level: m[1].length as 1 | 2 | 3, key: m[2].trim(), fields: {} }
    } else {
      const kv = parseKV(line)
      if (!kv) continue
      const [k, v] = kv
      if (inGlobals) {
        if (k === 'probe') targetGlobals.probe = v
        else if (k === 'menu') targetGlobals.menu = v
        else if (k === 'title') targetGlobals.title = v
      } else if (current) {
        current.fields[k] = v
      }
    }
  }
  if (current) nodes.push(current)

  const KNOWN_GROUP = ['menu', 'title', 'host', 'remark', 'probe']
  const KNOWN_TARGET = ['menu', 'title', 'host', 'remark', 'probe']

  const sections: TargetSection[] = []
  let currentSection: TargetSection | null = null
  let currentGroup: TargetGroup | null = null

  for (const node of nodes) {
    if (node.level === 1) {
      currentGroup = null
      currentSection = {
        id: crypto.randomUUID(),
        key: node.key,
        menu: node.fields.menu ?? node.key,
        title: node.fields.title ?? node.key,
        remark: node.fields.remark,
        groups: [],
      }
      sections.push(currentSection)

    } else if (node.level === 2) {
      if (!currentSection) continue

      // Synthetic _v6 entry → back-fill parent group
      if (node.key.endsWith('_v6')) {
        const parentKey = node.key.slice(0, -3)
        const parent = currentSection.groups.find(g => g.key === parentKey)
        if (parent) {
          const h = node.fields.host ?? ''
          parent.ipv6Host = h
          if (h && h === parent.host) parent.sameHost = true
        }
        continue
      }

      // Synthetic _combined entry → set flag on parent group
      if (node.key.endsWith('_combined')) {
        const parentKey = node.key.slice(0, -9)
        const parent = currentSection.groups.find(g => g.key === parentKey)
        if (parent) parent.showCombined = true
        continue
      }

      currentGroup = {
        id: crypto.randomUUID(),
        key: node.key,
        menu: node.fields.menu ?? node.key,
        title: node.fields.title ?? node.key,
        host: node.fields.host,
        remark: node.fields.remark,
        probe: node.fields.probe,
        extraFields: extraFields(node.fields, KNOWN_GROUP),
        targets: [],
      }
      currentSection.groups.push(currentGroup)

    } else if (node.level === 3) {
      if (!currentGroup) continue

      // Synthetic _v6 entry → back-fill parent target
      if (node.key.endsWith('_v6')) {
        const parentKey = node.key.slice(0, -3)
        const parent = currentGroup.targets.find(t => t.key === parentKey)
        if (parent) {
          const h = node.fields.host ?? ''
          parent.ipv6Host = h
          if (h && h === parent.host) parent.sameHost = true
        }
        continue
      }

      // Synthetic _combined entry → set flag on parent target
      if (node.key.endsWith('_combined')) {
        const parentKey = node.key.slice(0, -9)
        const parent = currentGroup.targets.find(t => t.key === parentKey)
        if (parent) parent.showCombined = true
        continue
      }

      currentGroup.targets.push({
        id: crypto.randomUUID(),
        key: node.key,
        menu: node.fields.menu ?? node.key,
        title: node.fields.title ?? node.key,
        host: node.fields.host ?? '',
        remark: node.fields.remark,
        probe: node.fields.probe,
        extraFields: extraFields(node.fields, KNOWN_TARGET),
      })
    }
  }

  return { targetGlobals, sections }
}

function joinContinuationLines(text: string): string[] {
  const result: string[] = []
  let pending = ''
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    if (pending) {
      pending += ' ' + line.trim().replace(/\\\s*$/, '')
      if (!line.trimEnd().endsWith('\\')) {
        result.push(pending.trim())
        pending = ''
      }
    } else if (line.trimEnd().endsWith('\\')) {
      pending = line.trim().replace(/\\\s*$/, '')
    } else {
      const trimmed = line.trim()
      if (trimmed) result.push(trimmed)
    }
  }
  if (pending) result.push(pending.trim())
  return result
}

function importFromSmokePingConf(text: string): SmokePingConfig {
  const lines = joinContinuationLines(text).filter(l => !l.startsWith('#'))

  const sectionMap: Record<string, string[]> = {}
  let cur: string | null = null
  for (const line of lines) {
    const m = line.match(/^\*\*\* (\w+) \*\*\*$/)
    if (m) { cur = m[1].toLowerCase(); sectionMap[cur] = [] }
    else if (cur) sectionMap[cur].push(line)
  }

  const probes = sectionMap.probes ? parseProbesSection(sectionMap.probes) : []
  const { targetGlobals, sections } = sectionMap.targets
    ? parseTargetsSection(sectionMap.targets)
    : { targetGlobals: { probe: 'FPing', menu: 'Top', title: 'Network Latency Grapher' }, sections: [] }

  return { probes, targetGlobals, sections }
}

// ── Public API ─────────────────────────────────────────────────────────────

export function exportToJson(config: SmokePingConfig): string {
  return JSON.stringify(config, null, 2)
}

export function exportToYaml(config: SmokePingConfig): string {
  return yaml.dump(config, { indent: 2 })
}

export function exportToConf(config: SmokePingConfig): string {
  return generateConfig(config)
}

export function importFromText(text: string): SmokePingConfig {
  const trimmed = text.trim()

  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as SmokePingConfig
    if (!Array.isArray(parsed.sections)) throw new Error('Invalid config: missing sections')
    if (!Array.isArray(parsed.probes)) throw new Error('Invalid config: missing probes')
    return parsed
  }

  if (trimmed.includes('*** Targets ***') || trimmed.includes('*** Probes ***')) {
    return importFromSmokePingConf(trimmed)
  }

  // YAML
  const parsed = yaml.load(trimmed) as SmokePingConfig
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid config: expected an object')
  if (!Array.isArray(parsed.sections)) throw new Error('Invalid config: missing sections')
  if (!Array.isArray(parsed.probes)) throw new Error('Invalid config: missing probes')
  return parsed
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
