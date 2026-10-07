import { useEffect, useRef, type ReactNode } from 'react'
import type { Sortable, SortableEventNames } from '@shopify/draggable'
import { cn } from '@/lib/format'

type StripEvents = SortableEventNames | 'drag:stopped'

interface SortableStripProps<T> {
  items: T[]
  getKey: (item: T) => string | number
  renderItem: (item: T, position: number) => ReactNode
  onReorder: (from: number, to: number) => void
  label: string
  className?: string
}

export function SortableStrip<T>({ items, getKey, renderItem, onReorder, label, className }: SortableStripProps<T>) {
  const containerRef = useRef<HTMLUListElement>(null)
  const onReorderRef = useRef(onReorder)

  useEffect(() => {
    onReorderRef.current = onReorder
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let sortable: Sortable<StripEvents> | null = null
    let cancelled = false

    void import('@shopify/draggable').then(({ Sortable, Plugins }) => {
      if (cancelled) return
      let move: { from: number; to: number } | null = null
      sortable = new Sortable<StripEvents>(container, {
        draggable: '.sortable-item',
        distance: 4,
        delay: { mouse: 0, drag: 0, touch: 160 },
        mirror: { constrainDimensions: true, appendTo: 'body' },
        plugins: [Plugins.SortAnimation],
        sortAnimation: { duration: 220, easingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' },
      })
      sortable.on('sortable:stop', (event) => {
        move = { from: event.oldIndex, to: event.newIndex }
      })
      sortable.on('drag:stop', (event) => {
        event.cancel()
      })
      sortable.on('drag:stopped', () => {
        if (move && move.from !== move.to) onReorderRef.current(move.from, move.to)
        move = null
      })
    })

    return () => {
      cancelled = true
      sortable?.destroy()
    }
  }, [])

  return (
    <ul ref={containerRef} aria-label={label} className={cn('flex', className)}>
      {items.map((item, position) => (
        <li key={getKey(item)} className='sortable-item shrink-0 touch-manipulation'>
          <div className='sortable-face rounded-[12px]'>{renderItem(item, position)}</div>
        </li>
      ))}
    </ul>
  )
}
