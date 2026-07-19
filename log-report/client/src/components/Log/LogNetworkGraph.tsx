import { useEffect, useRef, useState, useMemo } from 'react'
import cytoscape from 'cytoscape'
import type { Core, NodeSingular } from 'cytoscape'
import type { LogItem } from '@/api/log'
import { useTheme } from '@/components/Theme/ThemeProvider'

// ── helpers ────────────────────────────────────────────────────────────────

const processIp = (ip: string | null): string | null => {
    if (!ip) return null
    return ip.split('/')[0]
}

const isExternalIp = (ip: string | null): boolean => {
    if (!ip) return false
    if (ip === '127.0.0.1') return false
    if (ip.startsWith('10.')) return false
    if (ip.startsWith('192.168.')) return false
    const parts = ip.split('.')
    if (parts.length === 4) {
        const second = Number(parts[1])
        if (parts[0] === '172' && second >= 16 && second <= 31) return false
    }
    return true
}

// ── types ──────────────────────────────────────────────────────────────────

interface EdgeWeight {
    ip: string
    service: string
    count: number
}

// ── cytoscape style ────────────────────────────────────────────────────────

function getCyStyle(isDark: boolean): cytoscape.StylesheetJson {
    return [
        {
            selector: 'node[type="service"]',
            style: {
                'background-color': '#6366f1',
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '11px',
                'font-weight': 'bold',
                'width': 80,
                'height': 80,
                'shape': 'round-rectangle',
                'text-wrap': 'wrap',
                'text-max-width': '70px',
            },
        },
        {
            selector: 'node[type="ip"]',
            style: {
                'background-color': '#10b981',
                'label': 'data(label)',
                'color': isDark ? '#e2e8f0' : '#1e293b',
                'text-valign': 'bottom',
                'text-halign': 'center',
                'text-margin-y': 4,
                'font-size': '10px',
                'text-wrap': 'none',
                'min-zoomed-font-size': 6,
                'width': 'mapData(degree, 1, 20, 32, 64)',
                'height': 'mapData(degree, 1, 20, 32, 64)',
                'shape': 'ellipse',
            },
        },
        {
            selector: 'node[type="ip"][external = "false"]',
            style: {
                'background-color': isDark ? '#475569' : '#94a3b8',
            },
        },
        {
            selector: 'edge',
            style: {
                'width': 'mapData(weight, 1, 500, 1, 6)',
                'line-color': isDark ? '#334155' : '#cbd5e1',
                'target-arrow-color': isDark ? '#334155' : '#cbd5e1',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '8px',
                'color': isDark ? '#94a3b8' : '#64748b',
                'text-rotation': 'autorotate',
            },
        },
        {
            selector: 'node:selected',
            style: {
                'border-width': 3,
                'border-color': '#f59e0b',
            },
        },
        {
            selector: 'node.faded, edge.faded',
            style: { 'opacity': 0.15 },
        },
        {
            selector: 'node.highlighted, edge.highlighted',
            style: { 'opacity': 1 },
        },
    ]
}

// ── component ──────────────────────────────────────────────────────────────

export function LogNetworkGraph({ data }: { readonly data: LogItem[] | undefined }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const cyRef = useRef<Core | null>(null)

    const [selectedIps, setSelectedIps] = useState<Set<string>>(new Set())
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
    const [showOnlyExternal, setShowOnlyExternal] = useState(false)
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    // ── derived data ───────────────────────────────────────────────────────

    const { allIps, allServices, edges } = useMemo(() => {
        if (!data?.length) return { allIps: [], allServices: [], edges: [] }

        const edgeMap = new Map<string, EdgeWeight>()
        const ipSet = new Set<string>()
        const serviceSet = new Set<string>()

        for (const item of data) {
            const ip = processIp(item.ip)
            if (!ip) continue
            if (showOnlyExternal && !isExternalIp(ip)) continue

            const svc = item.name_service
            ipSet.add(ip)
            serviceSet.add(svc)

            const key = `${ip}||${svc}`
            const existing = edgeMap.get(key)
            edgeMap.set(key, existing
                ? { ...existing, count: existing.count + 1 }
                : { ip, service: svc, count: 1 }
            )
        }

        return {
            allIps: [...ipSet].sort(),
            allServices: [...serviceSet].sort(),
            edges: [...edgeMap.values()],
        }
    }, [data, showOnlyExternal])

    // active filter sets (empty = show all)
    const filteredEdges = useMemo(() => edges.filter(e =>
        (selectedIps.size === 0 || selectedIps.has(e.ip)) &&
        (selectedServices.size === 0 || selectedServices.has(e.service))
    ), [edges, selectedIps, selectedServices])

    // ── build/update cytoscape ─────────────────────────────────────────────

    useEffect(() => {
        if (!containerRef.current) return

        const ipNodes = [...new Set(filteredEdges.map(e => e.ip))].map(ip => ({
            data: {
                id: `ip::${ip}`,
                label: ip,
                type: 'ip',
                external: String(isExternalIp(ip)),
                degree: filteredEdges.filter(e => e.ip === ip).length,
            },
        }))

        const serviceNodes = [...new Set(filteredEdges.map(e => e.service))].map(svc => ({
            data: { id: `svc::${svc}`, label: svc.replace(/_/g, '\n'), type: 'service' },
        }))

        const edgeElements = filteredEdges.map(e => ({
            data: {
                id: `${e.ip}--${e.service}`,
                source: `ip::${e.ip}`,
                target: `svc::${e.service}`,
                weight: e.count,
                label: String(e.count),
            },
        }))

        if (cyRef.current) {
            cyRef.current.destroy()
        }

        const cy = cytoscape({
            container: containerRef.current,
            elements: [...ipNodes, ...serviceNodes, ...edgeElements],
            style: getCyStyle(isDark),
            layout: {
                name: 'cose',
                animate: true,
                animationDuration: 400,
                nodeRepulsion: () => 8000,
                idealEdgeLength: () => 120,
                edgeElasticity: () => 100,
                gravity: 0.4,
                numIter: 1000,
                fit: true,
                padding: 30,
            } as cytoscape.LayoutOptions,
            minZoom: 0.2,
            maxZoom: 4,
            wheelSensitivity: 0.3,
        })

        // hover highlight
        cy.on('mouseover', 'node', (evt) => {
            const node = evt.target as NodeSingular
            cy.elements().addClass('faded')
            node.removeClass('faded').addClass('highlighted')
            node.connectedEdges().removeClass('faded').addClass('highlighted')
            node.connectedEdges().connectedNodes().removeClass('faded').addClass('highlighted')

            const { x, y } = evt.renderedPosition
            const label = node.data('label') as string
            const type = node.data('type') as string
            const degree = node.connectedEdges().length
            setTooltip({
                text: type === 'ip'
                    ? `${label} → ${degree} service(s)`
                    : `${label.replace('\n', '_')} ← ${degree} IP(s)`,
                x, y,
            })
        })

        cy.on('mouseout', 'node', () => {
            cy.elements().removeClass('faded highlighted')
            setTooltip(null)
        })

        cy.on('tap', 'node', (evt) => {
            const node = evt.target as NodeSingular
            const type = node.data('type') as string
            const id = (node.data('id') as string).split('::')[1]
            if (type === 'ip') {
                setSelectedIps(prev => {
                    const next = new Set(prev)
                    next.has(id) ? next.delete(id) : next.add(id)
                    return next
                })
            } else {
                setSelectedServices(prev => {
                    const next = new Set(prev)
                    next.has(id) ? next.delete(id) : next.add(id)
                    return next
                })
            }
        })

        cyRef.current = cy

        return () => { cy.destroy(); cyRef.current = null }
    }, [filteredEdges, isDark])

    // ── filter helpers ─────────────────────────────────────────────────────

    const toggleIp = (ip: string) =>
        setSelectedIps(prev => { const s = new Set(prev); s.has(ip) ? s.delete(ip) : s.add(ip); return s })

    const toggleService = (svc: string) =>
        setSelectedServices(prev => { const s = new Set(prev); s.has(svc) ? s.delete(svc) : s.add(svc); return s })

    const clearFilters = () => { setSelectedIps(new Set()); setSelectedServices(new Set()) }

    // ── render ─────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">IP ↔ Service Network</h2>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <label className="flex cursor-pointer items-center gap-1 select-none">
                        <input
                            type="checkbox"
                            checked={showOnlyExternal}
                            onChange={e => { clearFilters(); setShowOnlyExternal(e.target.checked) }}
                            className="accent-indigo-500"
                        />
                        External IPs only
                    </label>
                    {(selectedIps.size > 0 || selectedServices.size > 0) && (
                        <button
                            onClick={clearFilters}
                            className="cursor-pointer rounded bg-slate-200 px-2 py-0.5 text-xs font-medium hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                            type="button"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* legend */}
            <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" /> External IP
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-600" /> Internal IP
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-indigo-500" /> Service
                </span>
                <span className="text-slate-400 dark:text-slate-500">Node size ∝ connections · Edge width ∝ request count</span>
            </div>

            <div className="flex gap-3">
                {/* filter panel */}
                <div className="flex flex-col gap-3 w-48 shrink-0">
                    {/* service filter */}
                    <FilterGroup
                        title="Services"
                        items={allServices}
                        selected={selectedServices}
                        onToggle={toggleService}
                        colorClass="bg-indigo-500"
                    />
                    {/* ip filter */}
                    <FilterGroup
                        title={`IPs (${allIps.length})`}
                        items={allIps}
                        selected={selectedIps}
                        onToggle={toggleIp}
                        colorClass="bg-emerald-500"
                        maxVisible={12}
                    />
                </div>

                {/* graph canvas */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950" style={{ height: 520 }}>
                    <div ref={containerRef} className="w-full h-full" />

                    {/* tooltip */}
                    {tooltip && (
                        <div
                            className="pointer-events-none absolute whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white shadow-lg dark:bg-slate-700"
                            style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
                        >
                            {tooltip.text}
                        </div>
                    )}

                    {/* empty state */}
                    {filteredEdges.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 dark:text-slate-600">
                            No connections match the current filters.
                        </div>
                    )}

                    {/* zoom hint */}
                    <p className="pointer-events-none absolute bottom-2 right-3 text-xs text-slate-400 dark:text-slate-600">
                        Scroll to zoom · Click node to filter · Drag to pan
                    </p>
                </div>
            </div>

            {/* stats bar */}
            <div className="flex gap-6 px-1 text-sm text-slate-500 dark:text-slate-400">
                <span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{[...new Set(filteredEdges.map(e => e.ip))].length}</span> IPs
                </span>
                <span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{[...new Set(filteredEdges.map(e => e.service))].length}</span> Services
                </span>
                <span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredEdges.reduce((s, e) => s + e.count, 0).toLocaleString()}</span> Requests
                </span>
            </div>
        </div>
    )
}

// ── FilterGroup sub-component ──────────────────────────────────────────────

function FilterGroup({
    title,
    items,
    selected,
    onToggle,
    colorClass,
    maxVisible = 50,
}: Readonly<{
    title: string
    items: string[]
    selected: Set<string>
    onToggle: (v: string) => void
    colorClass: string
    maxVisible?: number
}>) {
    const [expanded, setExpanded] = useState(false)
    const visible = expanded ? items : items.slice(0, maxVisible)

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-800 dark:bg-slate-900">
            <p className="mb-1.5 font-semibold text-slate-700 dark:text-slate-200">{title}</p>
            <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
                {visible.map(item => (
                    <label key={item} className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${colorClass} ${selected.has(item) ? 'ring-2 ring-offset-1 ring-indigo-400 dark:ring-offset-slate-900' : 'opacity-50'}`} />
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={selected.has(item)}
                            onChange={() => onToggle(item)}
                        />
                        <span className={`truncate ${selected.has(item) ? 'text-slate-800 font-medium dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {item}
                        </span>
                    </label>
                ))}
            </div>
            {items.length > maxVisible && (
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="mt-1 cursor-pointer text-xs text-indigo-500 hover:underline dark:text-indigo-400"
                    type="button"
                >
                    {expanded ? 'Show less' : `+${items.length - maxVisible} more`}
                </button>
            )}
        </div>
    )
}
