import { useState } from 'react'
import { ChevronRight, ChevronDown, Plus, Trash2, Settings, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { TargetSection, Selection } from '@/lib/types'
import type { Action } from '@/hooks/use-smokeping-store'

interface TargetTreeProps {
  sections: TargetSection[]
  selection: Selection
  onSelect: (s: Selection) => void
  dispatch: (action: Action) => void
}

type DragItem =
  | { kind: 'section'; id: string }
  | { kind: 'group'; sectionId: string; id: string }
  | { kind: 'target'; sectionId: string; groupId: string; id: string }

type DropTarget = { id: string; position: 'before' | 'after' }

export function TargetTree({ sections, selection, onSelect, dispatch }: TargetTreeProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [dragging, setDragging] = useState<DragItem | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function isSelected(s: Selection) {
    return (
      s.kind === selection.kind &&
      s.sectionId === selection.sectionId &&
      s.groupId === selection.groupId &&
      s.targetId === selection.targetId
    )
  }

  function getDropPosition(e: React.DragEvent<HTMLElement>): 'before' | 'after' {
    const rect = e.currentTarget.getBoundingClientRect()
    return e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
  }

  function handleDrop(item: DragItem, toId: string, position: 'before' | 'after') {
    if (item.kind === 'section') {
      dispatch({ type: 'REORDER_SECTIONS', fromId: item.id, toId, position })
    } else if (item.kind === 'group') {
      dispatch({ type: 'REORDER_GROUPS', sectionId: item.sectionId, fromId: item.id, toId, position })
    } else if (item.kind === 'target') {
      dispatch({ type: 'REORDER_TARGETS', sectionId: item.sectionId, groupId: item.groupId, fromId: item.id, toId, position })
    }
    setDragging(null)
    setDropTarget(null)
  }

  function dropIndicator(id: string) {
    if (!dropTarget || dropTarget.id !== id) return null
    return (
      <div
        className={cn(
          'absolute left-0 right-0 h-0.5 bg-primary pointer-events-none z-10',
          dropTarget.position === 'before' ? 'top-0' : 'bottom-0'
        )}
      />
    )
  }

  const grip = (
    <span className="p-1 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-60 hover:!opacity-100 shrink-0 touch-none">
      <GripVertical className="h-3.5 w-3.5" />
    </span>
  )

  return (
    <div
      className="flex flex-col gap-0"
      onDragEnd={() => { setDragging(null); setDropTarget(null) }}
    >
      {/* Globals */}
      <button
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-left w-full hover:bg-accent transition-colors',
          isSelected({ kind: 'globals' }) && 'bg-accent font-medium'
        )}
        onClick={() => onSelect({ kind: 'globals' })}
      >
        <Settings className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span>Global Settings</span>
      </button>

      {/* Add section button */}
      <div className="pt-1 pb-0.5 px-1">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={() => dispatch({ type: 'ADD_SECTION' })}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Section
        </Button>
      </div>

      {sections.map((section) => (
        <div key={section.id}>
          {/* Section row */}
          <div
            className={cn(
              'relative group flex items-center gap-1 rounded-md px-1 py-px hover:bg-accent transition-colors',
              isSelected({ kind: 'section', sectionId: section.id }) && 'bg-accent',
              dragging?.kind === 'section' && dragging.id === section.id && 'opacity-40'
            )}
            onDragOver={(e) => {
              if (dragging?.kind !== 'section' || dragging.id === section.id) return
              e.preventDefault()
              setDropTarget({ id: section.id, position: getDropPosition(e) })
            }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => {
              e.preventDefault()
              if (dragging?.kind === 'section' && dragging.id !== section.id && dropTarget) {
                handleDrop(dragging, section.id, dropTarget.position)
              }
            }}
          >
            {dropIndicator(section.id)}

            <span
              draggable
              onDragStart={() => setDragging({ kind: 'section', id: section.id })}
            >
              {grip}
            </span>

            <button
              className="p-1 text-muted-foreground hover:text-foreground"
              onClick={() => toggleSection(section.id)}
              aria-label={openSections.has(section.id) ? 'Collapse section' : 'Expand section'}
            >
              {openSections.has(section.id) ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              className="flex-1 text-left text-sm py-1 truncate"
              onClick={() => onSelect({ kind: 'section', sectionId: section.id })}
            >
              <span className="text-muted-foreground mr-1">+</span>
              {section.key}
            </button>
            <div className="flex gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      dispatch({ type: 'ADD_GROUP', sectionId: section.id })
                      if (!openSections.has(section.id)) toggleSection(section.id)
                    }}
                    aria-label="Add group"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Add group</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      dispatch({ type: 'DELETE_SECTION', id: section.id })
                    }}
                    aria-label="Delete section"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Delete section</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Groups */}
          {openSections.has(section.id) &&
            section.groups.map((group) => (
              <div key={group.id} className="ml-2">
                <div
                  className={cn(
                    'relative group flex items-center gap-1 rounded-md px-1 py-px hover:bg-accent transition-colors',
                    isSelected({ kind: 'group', sectionId: section.id, groupId: group.id }) && 'bg-accent',
                    dragging?.kind === 'group' && dragging.id === group.id && 'opacity-40'
                  )}
                  onDragOver={(e) => {
                    if (dragging?.kind !== 'group' || dragging.id === group.id || dragging.sectionId !== section.id) return
                    e.preventDefault()
                    setDropTarget({ id: group.id, position: getDropPosition(e) })
                  }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dragging?.kind === 'group' && dragging.id !== group.id && dragging.sectionId === section.id && dropTarget) {
                      handleDrop(dragging, group.id, dropTarget.position)
                    }
                  }}
                >
                  {dropIndicator(group.id)}

                  <span
                    draggable
                    onDragStart={() => setDragging({ kind: 'group', sectionId: section.id, id: group.id })}
                  >
                    {grip}
                  </span>

                  <button
                    className="p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => toggleGroup(group.id)}
                    aria-label={openGroups.has(group.id) ? 'Collapse group' : 'Expand group'}
                  >
                    {openGroups.has(group.id) ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    className="flex-1 text-left text-sm py-1 truncate"
                    onClick={() => onSelect({ kind: 'group', sectionId: section.id, groupId: group.id })}
                  >
                    <span className="text-muted-foreground mr-1">++</span>
                    {group.key}
                  </button>
                  <div className="flex gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            dispatch({ type: 'ADD_TARGET', sectionId: section.id, groupId: group.id })
                            if (!openGroups.has(group.id)) toggleGroup(group.id)
                          }}
                          aria-label="Add target"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Add target</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            dispatch({ type: 'DELETE_GROUP', sectionId: section.id, id: group.id })
                          }}
                          aria-label="Delete group"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Delete group</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Targets */}
                {openGroups.has(group.id) &&
                  group.targets.map((target) => (
                    <div key={target.id} className="ml-2">
                      <div
                        className={cn(
                          'relative group flex items-center gap-1 rounded-md px-1 py-px hover:bg-accent transition-colors',
                          isSelected({
                            kind: 'target',
                            sectionId: section.id,
                            groupId: group.id,
                            targetId: target.id,
                          }) && 'bg-accent',
                          dragging?.kind === 'target' && dragging.id === target.id && 'opacity-40'
                        )}
                        onDragOver={(e) => {
                          if (
                            dragging?.kind !== 'target' ||
                            dragging.id === target.id ||
                            dragging.sectionId !== section.id ||
                            dragging.groupId !== group.id
                          ) return
                          e.preventDefault()
                          setDropTarget({ id: target.id, position: getDropPosition(e) })
                        }}
                        onDragLeave={() => setDropTarget(null)}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (
                            dragging?.kind === 'target' &&
                            dragging.id !== target.id &&
                            dragging.sectionId === section.id &&
                            dragging.groupId === group.id &&
                            dropTarget
                          ) {
                            handleDrop(dragging, target.id, dropTarget.position)
                          }
                        }}
                      >
                        {dropIndicator(target.id)}

                        <span
                          draggable
                          onDragStart={() =>
                            setDragging({ kind: 'target', sectionId: section.id, groupId: group.id, id: target.id })
                          }
                        >
                          {grip}
                        </span>

                        <button
                          className="flex-1 text-left text-sm py-1 truncate"
                          onClick={() =>
                            onSelect({
                              kind: 'target',
                              sectionId: section.id,
                              groupId: group.id,
                              targetId: target.id,
                            })
                          }
                        >
                          <span className="text-muted-foreground mr-1">+++</span>
                          {target.key}
                        </button>
                        <div className="flex gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  dispatch({
                                    type: 'DELETE_TARGET',
                                    sectionId: section.id,
                                    groupId: group.id,
                                    id: target.id,
                                  })
                                }}
                                aria-label="Delete target"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Delete target</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}
