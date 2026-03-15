import type { ProbeType } from './types'

export const GITHUB_REPO_URL = 'https://github.com/svenvg93/smokeping-generator'

export const PROBE_TYPES: ProbeType[] = [
  'FPing',
  'FPing6',
  'DNS',
  'HTTP',
  'Curl',
  'Ntp',
  'EchoPing',
  'TCPPing',
]

export const PROBE_DEFAULTS: Record<ProbeType, { binary: string; extraFields: Record<string, string> }> = {
  FPing: {
    binary: '/usr/bin/fping',
    extraFields: {},
  },
  FPing6: {
    binary: '/usr/bin/fping6',
    extraFields: {},
  },
  DNS: {
    binary: '/usr/bin/dig',
    extraFields: { lookup: 'cloudflare.com' },
  },
  HTTP: {
    binary: '/usr/bin/curl',
    extraFields: { urlformat: 'http://%host%/' },
  },
  Curl: {
    binary: '/usr/bin/curl',
    extraFields: { urlformat: 'https://%host%/' },
  },
  Ntp: {
    binary: '/usr/sbin/ntpdate',
    extraFields: {},
  },
  EchoPing: {
    binary: '/usr/bin/echoping',
    extraFields: {},
  },
  TCPPing: {
    binary: '/usr/bin/tcpping',
    extraFields: { port: '80' },
  },
}
