export interface Target {
  id: string
  key: string
  menu: string
  title: string
  host: string
  remark?: string
  probe?: string
  extraFields: Record<string, string>
  ipv6Host?: string
  sameHost?: boolean
  showCombined?: boolean
}

export interface TargetGroup {
  id: string
  key: string
  menu: string
  title: string
  host?: string
  remark?: string
  probe?: string
  extraFields: Record<string, string>
  ipv6Host?: string
  sameHost?: boolean
  showCombined?: boolean
  targets: Target[]
}

export interface TargetSection {
  id: string
  key: string
  menu: string
  title: string
  remark?: string
  groups: TargetGroup[]
}

export interface TargetGlobals {
  probe: string
  menu: string
  title: string
}

export type ProbeType =
  | 'FPing'
  | 'FPing6'
  | 'DNS'
  | 'HTTP'
  | 'Curl'
  | 'Ntp'
  | 'EchoPing'
  | 'TCPPing'

export interface Probe {
  id: string
  name: string
  type: ProbeType
  binary: string
  pings: number
  step: number
  extraFields: Record<string, string>
}

export interface SmokePingConfig {
  targetGlobals: TargetGlobals
  sections: TargetSection[]
  probes: Probe[]
}


export type SelectionKind = 'globals' | 'section' | 'group' | 'target'

export interface Selection {
  kind: SelectionKind
  sectionId?: string
  groupId?: string
  targetId?: string
}
