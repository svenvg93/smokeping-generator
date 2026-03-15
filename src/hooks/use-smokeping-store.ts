import { useReducer, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import type {
  SmokePingConfig,
  TargetSection,
  TargetGroup,
  Target,
  Probe,
  TargetGlobals,
} from '@/lib/types'
import { generateConfig } from '@/lib/generate'

const STORAGE_KEY = 'smokeping-config'

function uniqueName(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base
  let i = 2
  while (existing.includes(`${base} ${i}`)) i++
  return `${base} ${i}`
}

const initialConfig: SmokePingConfig = {
  targetGlobals: {
    probe: 'FPing',
    menu: 'Top',
    title: 'Network Latency Grapher',
  },
  sections: [],
  probes: [
    {
      id: crypto.randomUUID(),
      name: 'FPing',
      type: 'FPing',
      binary: '/usr/bin/fping',
      pings: 20,
      step: 300,
      extraFields: {},
    },
  ],
}

function loadConfig(): SmokePingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SmokePingConfig
  } catch {
    // ignore
  }
  return initialConfig
}

export type Action =
  | { type: 'UPDATE_TARGET_GLOBALS'; payload: Partial<TargetGlobals> }
  | { type: 'ADD_SECTION' }
  | { type: 'UPDATE_SECTION'; id: string; payload: Partial<Omit<TargetSection, 'groups'>> }
  | { type: 'DELETE_SECTION'; id: string }
  | { type: 'ADD_GROUP'; sectionId: string }
  | { type: 'UPDATE_GROUP'; sectionId: string; id: string; payload: Partial<Omit<TargetGroup, 'targets'>> }
  | { type: 'DELETE_GROUP'; sectionId: string; id: string }
  | { type: 'ADD_TARGET'; sectionId: string; groupId: string }
  | { type: 'UPDATE_TARGET'; sectionId: string; groupId: string; id: string; payload: Partial<Target> }
  | { type: 'DELETE_TARGET'; sectionId: string; groupId: string; id: string }
  | { type: 'ADD_PROBE'; payload: Probe }
  | { type: 'UPDATE_PROBE'; id: string; payload: Partial<Probe> }
  | { type: 'DELETE_PROBE'; id: string }
  | { type: 'REORDER_SECTIONS'; fromId: string; toId: string; position: 'before' | 'after' }
  | { type: 'REORDER_GROUPS'; sectionId: string; fromId: string; toId: string; position: 'before' | 'after' }
  | { type: 'REORDER_TARGETS'; sectionId: string; groupId: string; fromId: string; toId: string; position: 'before' | 'after' }
  | { type: 'LOAD_CONFIG'; payload: SmokePingConfig }

function reorder<T extends { id: string }>(items: T[], fromId: string, toId: string, position: 'before' | 'after'): T[] {
  const arr = [...items]
  const fromIdx = arr.findIndex((x) => x.id === fromId)
  if (fromIdx < 0) return items
  const [moved] = arr.splice(fromIdx, 1)
  const toIdx = arr.findIndex((x) => x.id === toId)
  if (toIdx < 0) return items
  arr.splice(position === 'before' ? toIdx : toIdx + 1, 0, moved)
  return arr
}

function reducer(state: SmokePingConfig, action: Action): SmokePingConfig {
  switch (action.type) {
    case 'UPDATE_TARGET_GLOBALS':
      return { ...state, targetGlobals: { ...state.targetGlobals, ...action.payload } }

    case 'ADD_SECTION': {
      const key = uniqueName('NewSection', state.sections.map((s) => s.key))
      return {
        ...state,
        sections: [
          ...state.sections,
          { id: crypto.randomUUID(), key, menu: key, title: key, groups: [] },
        ],
      }
    }

    case 'UPDATE_SECTION':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.id ? { ...s, ...action.payload } : s
        ),
      }

    case 'DELETE_SECTION':
      return { ...state, sections: state.sections.filter((s) => s.id !== action.id) }

    case 'ADD_GROUP': {
      return {
        ...state,
        sections: state.sections.map((s) => {
          if (s.id !== action.sectionId) return s
          const key = uniqueName('NewGroup', s.groups.map((g) => g.key))
          return {
            ...s,
            groups: [...s.groups, { id: crypto.randomUUID(), key, menu: key, title: key, extraFields: {}, targets: [] }],
          }
        }),
      }
    }

    case 'UPDATE_GROUP':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? {
                ...s,
                groups: s.groups.map((g) =>
                  g.id === action.id ? { ...g, ...action.payload } : g
                ),
              }
            : s
        ),
      }

    case 'DELETE_GROUP':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? { ...s, groups: s.groups.filter((g) => g.id !== action.id) }
            : s
        ),
      }

    case 'ADD_TARGET': {
      return {
        ...state,
        sections: state.sections.map((s) => {
          if (s.id !== action.sectionId) return s
          return {
            ...s,
            groups: s.groups.map((g) => {
              if (g.id !== action.groupId) return g
              const key = uniqueName('NewTarget', g.targets.map((t) => t.key))
              return {
                ...g,
                targets: [...g.targets, { id: crypto.randomUUID(), key, menu: key, title: key, host: '', extraFields: {} }],
              }
            }),
          }
        }),
      }
    }

    case 'UPDATE_TARGET':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? {
                ...s,
                groups: s.groups.map((g) =>
                  g.id === action.groupId
                    ? {
                        ...g,
                        targets: g.targets.map((t) =>
                          t.id === action.id ? { ...t, ...action.payload } : t
                        ),
                      }
                    : g
                ),
              }
            : s
        ),
      }

    case 'DELETE_TARGET':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? {
                ...s,
                groups: s.groups.map((g) =>
                  g.id === action.groupId
                    ? { ...g, targets: g.targets.filter((t) => t.id !== action.id) }
                    : g
                ),
              }
            : s
        ),
      }

    case 'ADD_PROBE':
      return { ...state, probes: [...state.probes, action.payload] }

    case 'UPDATE_PROBE':
      return {
        ...state,
        probes: state.probes.map((p) =>
          p.id === action.id ? { ...p, ...action.payload } : p
        ),
      }

    case 'DELETE_PROBE':
      return { ...state, probes: state.probes.filter((p) => p.id !== action.id) }

    case 'REORDER_SECTIONS':
      return { ...state, sections: reorder(state.sections, action.fromId, action.toId, action.position) }

    case 'REORDER_GROUPS':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId ? { ...s, groups: reorder(s.groups, action.fromId, action.toId, action.position) } : s
        ),
      }

    case 'REORDER_TARGETS':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? {
                ...s,
                groups: s.groups.map((g) =>
                  g.id === action.groupId ? { ...g, targets: reorder(g.targets, action.fromId, action.toId, action.position) } : g
                ),
              }
            : s
        ),
      }

    case 'LOAD_CONFIG':
      return action.payload

    default:
      return state
  }
}

export function useSmokePingStore() {
  const [config, dispatch] = useReducer(reducer, undefined, loadConfig)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch {
      toast.warning('Could not save configuration — local storage may be full or unavailable')
    }
  }, [config])

  const preview = useMemo(() => generateConfig(config), [config])

  return { config, dispatch, preview }
}
