import type { SmokePingConfig, Probe, TargetGlobals, TargetSection } from './types'

function generateProbesSection(probes: Probe[]): string {
  if (probes.length === 0) return ''

  let out = '*** Probes ***\n\n'
  for (const probe of probes) {
    out += `+${probe.name}\n`
    out += `binary = ${probe.binary}\n`
    out += `pings = ${probe.pings}\n`
    out += `step = ${probe.step}\n`
    for (const [k, v] of Object.entries(probe.extraFields ?? {})) {
      if (k && v) out += `${k} = ${v}\n`
    }
    out += '\n'
  }
  return out
}

function generateTargetsSection(globals: TargetGlobals, sections: TargetSection[]): string {
  let out = '*** Targets ***\n\n'
  out += `menu = ${globals.menu}\n`
  out += `title = ${globals.title}\n`
  out += `probe = ${globals.probe}\n\n`

  for (const section of sections) {
    const validGroups = section.groups.filter((g) => g.targets.length > 0 || !!g.host)
    if (validGroups.length === 0) continue

    out += `+ ${section.key}\n`
    out += `menu = ${section.menu}\n`
    out += `title = ${section.title}\n`
    if (section.remark) out += `remark = ${section.remark}\n`
    out += '\n'

    for (const group of validGroups) {
      const groupKey = group.ipv6Host !== undefined ? `${group.key}_v4` : group.key
      out += `++ ${groupKey}\n`
      out += `menu = ${group.menu}${group.ipv6Host !== undefined ? ' (IPv4)' : ''}\n`
      out += `title = ${group.title}${group.ipv6Host !== undefined ? ' (IPv4)' : ''}\n`
      if (group.host) out += `host = ${group.host}\n`
      if (group.remark) out += `remark = ${group.remark}\n`
      if (group.probe) out += `probe = ${group.probe}\n`
      for (const [k, v] of Object.entries(group.extraFields ?? {})) {
        if (k && v) out += `${k} = ${v}\n`
      }
      out += '\n'

      if (group.ipv6Host !== undefined) {
        const groupV6Host = group.sameHost ? group.host : group.ipv6Host
        out += `++ ${group.key}_v6\n`
        out += `menu = ${group.menu} (IPv6)\n`
        out += `title = ${group.title} (IPv6)\n`
        out += `probe = FPing6\n`
        if (groupV6Host) out += `host = ${groupV6Host}\n`
        if (group.remark) out += `remark = ${group.remark}\n`
        out += '\n'

        if (group.showCombined) {
          out += `++ ${group.key}_combined\n`
          out += `menu = ${group.menu} (combined)\n`
          out += `title = ${group.title} (IPv4 + IPv6)\n`
          out += `host = /${section.key}/${group.key}_v4 /${section.key}/${group.key}_v6\n`
          if (group.remark) out += `remark = ${group.remark}\n`
          out += '\n'
        }
      }

      for (const target of group.targets) {
        const targetKey = target.ipv6Host !== undefined ? `${target.key}_v4` : target.key
        out += `+++ ${targetKey}\n`
        out += `menu = ${target.menu}${target.ipv6Host !== undefined ? ' (IPv4)' : ''}\n`
        out += `title = ${target.title}${target.ipv6Host !== undefined ? ' (IPv4)' : ''}\n`
        out += `host = ${target.host}\n`
        if (target.remark) out += `remark = ${target.remark}\n`
        if (target.probe) out += `probe = ${target.probe}\n`
        for (const [k, v] of Object.entries(target.extraFields ?? {})) {
          if (k && v) out += `${k} = ${v}\n`
        }
        out += '\n'

        if (target.ipv6Host !== undefined) {
          const targetV6Host = target.sameHost ? target.host : target.ipv6Host
          out += `+++ ${target.key}_v6\n`
          out += `menu = ${target.menu} (IPv6)\n`
          out += `title = ${target.title} (IPv6)\n`
          out += `probe = FPing6\n`
          if (targetV6Host) out += `host = ${targetV6Host}\n`
          if (target.remark) out += `remark = ${target.remark}\n`
          out += '\n'

          if (target.showCombined) {
            const path = `/${section.key}/${group.key}`
            out += `+++ ${target.key}_combined\n`
            out += `menu = ${target.menu} (combined)\n`
            out += `title = ${target.title} (IPv4 + IPv6)\n`
            out += `host = ${path}/${target.key}_v4 ${path}/${target.key}_v6\n`
            if (target.remark) out += `remark = ${target.remark}\n`
            out += '\n'
          }
        }
      }
    }
  }
  return out
}

export function generateConfig(config: SmokePingConfig): string {
  const parts: string[] = []

  const probes = generateProbesSection(config.probes)
  if (probes) parts.push(probes)

  parts.push(generateTargetsSection(config.targetGlobals, config.sections))

  return parts.join('\n')
}
