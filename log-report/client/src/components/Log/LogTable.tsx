import React, { useMemo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
} from '@tanstack/react-table'
import type { ColumnFiltersState, Column } from '@tanstack/react-table'

import type { LogItem } from '@/api/log'

const LEVEL_BADGE: Record<string, string> = {
    ERROR: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900',
    FATAL: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900',
    WARN: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
    WARNING: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900',
    INFO: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900',
    DEBUG: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
}

function levelBadgeClass(level: string | null | undefined): string {
    if (!level) return LEVEL_BADGE.DEBUG
    return LEVEL_BADGE[level.toUpperCase()] ?? LEVEL_BADGE.DEBUG
}

function statusBadgeClass(status: number | null | undefined): string {
    if (status == null) return 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700'
    if (status >= 500) return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900'
    if (status >= 400) return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900'
    if (status >= 300) return 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900'
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900'
}

function Badge({ className, children }: Readonly<{ className: string; children: React.ReactNode }>) {
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
            {children}
        </span>
    )
}

function FacetedFilter({ column }: { readonly column: Column<LogItem, unknown> }) {
    const [open, setOpen] = useState(false)
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
    const buttonRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const facetedValues = column.getFacetedUniqueValues()
    const selectedValues = new Set((column.getFilterValue() as string[]) ?? [])
    const options = [...facetedValues.entries()].sort((a, b) => b[1] - a[1])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(e.target as Node)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggle = (value: string) => {
        const next = new Set(selectedValues)
        if (next.has(value)) next.delete(value)
        else next.add(value)
        column.setFilterValue(next.size ? [...next] : undefined)
    }

    const handleOpen = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 150) })
        }
        setOpen(o => !o)
    }

    return (
        <div>
            <button
                ref={buttonRef}
                className="flex w-full cursor-pointer items-center justify-between gap-1 rounded px-2 py-1 text-xs font-normal text-slate-100 bg-slate-800 border border-slate-600 hover:bg-slate-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700"
                onClick={handleOpen}
                type="button"
            >
                <span className="text-slate-400">
                    {selectedValues.size > 0 ? `${selectedValues.size} selected` : 'Filter…'}
                </span>
                {selectedValues.size > 0 && (
                    <span className="text-xs bg-sky-500/20 text-sky-300 rounded-full px-1.5 leading-4">
                        {selectedValues.size}
                    </span>
                )}
            </button>

            {open && createPortal(
                <div
                    ref={dropdownRef}
                    style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.width }}
                    className="z-[9999] bg-white border border-slate-200 rounded-lg shadow-lg py-1 dark:bg-slate-900 dark:border-slate-700"
                >
                    {options.map(([value, count]) => {
                        const strVal = String(value)
                        const checked = selectedValues.has(strVal)
                        return (
                            <label
                                key={strVal}
                                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(strVal)}
                                    className="rounded accent-sky-500"
                                />
                                <span className="flex-1 truncate">{strVal}</span>
                                <span className="text-slate-400">{count}</span>
                            </label>
                        )
                    })}
                    {selectedValues.size > 0 && (
                        <button
                            className="w-full cursor-pointer border-t border-slate-100 py-1.5 text-center text-xs text-slate-400 hover:text-slate-600 mt-0.5 dark:border-slate-800 dark:hover:text-slate-300"
                            onClick={() => column.setFilterValue(undefined)}
                            type="button"
                        >
                            Clear
                        </button>
                    )}
                </div>,
                document.body
            )}
        </div>
    )
}


const columnHelper = createColumnHelper<LogItem>()

const columns = [
    columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{info.getValue()}</span>,
        enableColumnFilter: false,
    }),
    columnHelper.accessor('log_time', {
        header: 'Log Time',
        cell: (info) => <span className="font-mono text-xs tabular-nums">{info.getValue()}</span>,
        enableColumnFilter: false,
    }),
    columnHelper.accessor('level', {
        header: 'Level',
        cell: (info) => <Badge className={levelBadgeClass(info.getValue())}>{info.getValue() ?? '—'}</Badge>,
        enableColumnFilter: true,
        filterFn: 'arrIncludesSome',
    }),
    columnHelper.accessor('ip', {
        header: 'IP',
        cell: (info) => <span className="font-mono text-xs tabular-nums">{info.getValue() ?? '—'}</span>,
        enableColumnFilter: false,
    }),
    columnHelper.accessor('method', {
        header: 'Method',
        cell: (info) => info.getValue()
            ? <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">{info.getValue()}</span>
            : '—',
        enableColumnFilter: true,
        filterFn: 'arrIncludesSome',
    }),
    columnHelper.accessor('path', {
        header: 'Path',
        cell: (info) => <span className="font-mono text-xs">{info.getValue() ?? '—'}</span>,
        enableColumnFilter: false,
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => info.getValue() != null
            ? <Badge className={statusBadgeClass(info.getValue())}>{info.getValue()}</Badge>
            : '—',
        enableColumnFilter: false,
    }),
    columnHelper.accessor('duration_ms', {
        header: 'Duration',
        cell: (info) => (
            <span className="font-mono text-xs tabular-nums">
                {info.getValue() != null ? `${info.getValue()} ms` : '—'}
            </span>
        ),
        enableColumnFilter: false,
    }),
    columnHelper.accessor('name_service', {
        header: 'Service',
        cell: (info) => info.getValue(),
        enableColumnFilter: true,
        filterFn: 'arrIncludesSome',
    })
]

function LogTable({
    data,
    serviceFilter,
}: {
    readonly data: LogItem[] | undefined;
    readonly serviceFilter?: string | null;
}) {
    const tableData = useMemo(() => data ?? [], [data])

    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

    useEffect(() => {
        setColumnFilters(prev => {
            const without = prev.filter(f => f.id !== 'name_service')
            return serviceFilter ? [...without, { id: 'name_service', value: [serviceFilter] }] : without
        })
    }, [serviceFilter])

    const table = useReactTable({
        data: tableData,
        columns,
        state: {
            columnFilters,
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: 10,
            }
        }
    })

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-800 text-white dark:bg-slate-950">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        className="whitespace-nowrap px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wider"
                                        key={header.id}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <div className="flex flex-col gap-1">
                                                <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                                {header.column.getCanFilter() ? (
                                                    <FacetedFilter column={header.column} />
                                                ) : (
                                                    <div className="h-6" />
                                                )}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {table.getRowModel().rows.length === 0 && (
                            <tr>
                                <td className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500" colSpan={columns.length}>
                                    No log entries match the current filters.
                                </td>
                            </tr>
                        )}
                        {table.getRowModel().rows.map((row, i) => (
                            <tr
                                key={row.id}
                                className={`transition-colors hover:bg-sky-50 dark:hover:bg-slate-800/60 ${i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900/60'}`}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td className="whitespace-nowrap px-4 py-2 text-slate-700 dark:text-slate-300" key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1 text-sm">
                <button
                    className="cursor-pointer rounded border border-slate-300 px-3 py-1 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                    type="button"
                >{'<<'}</button>
                <button
                    className="cursor-pointer rounded border border-slate-300 px-3 py-1 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    type="button"
                >{'<'}</button>
                <span className="px-3 py-1 text-slate-600 dark:text-slate-300">
                    Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
                </span>
                <button
                    className="cursor-pointer rounded border border-slate-300 px-3 py-1 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    type="button"
                >{'>'}</button>
                <button
                    className="cursor-pointer rounded border border-slate-300 px-3 py-1 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                    type="button"
                >{'>>'}</button>
                <select
                    className="ml-3 cursor-pointer rounded border border-slate-300 px-2 py-1 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    value={table.getState().pagination.pageSize}
                    onChange={e => table.setPageSize(Number(e.target.value))}
                >
                    {[10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>{pageSize} / page</option>
                    ))}
                </select>
            </div>
        </div>
    )
}


export default LogTable
