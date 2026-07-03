import React, { useMemo, useEffect, useRef, useState } from 'react'
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


function FacetedFilter({ column }: { readonly column: Column<LogItem, unknown> }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    const facetedValues = column.getFacetedUniqueValues()
    const selectedValues = new Set((column.getFilterValue() as string[]) ?? [])
    const options = [...facetedValues.entries()].sort((a, b) => b[1] - a[1])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
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

    return (
        <div className="relative" ref={ref}>
            <button
                className="w-full flex items-center justify-between gap-1 rounded px-2 py-1 text-xs font-normal text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-400"
                onClick={() => setOpen(o => !o)}
            >
                <span className="text-slate-400">
                    {selectedValues.size > 0 ? `${selectedValues.size} selected` : 'Filter…'}
                </span>
                {selectedValues.size > 0 && (
                    <span className="text-xs bg-sky-100 text-sky-700 rounded-full px-1.5 leading-4">
                        {selectedValues.size}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute top-full left-0 z-50 mt-1 min-w-[150px] bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                    {options.map(([value, count]) => {
                        const strVal = String(value)
                        const checked = selectedValues.has(strVal)
                        return (
                            <label
                                key={strVal}
                                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-50 text-xs text-slate-700"
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
                            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 py-1.5 border-t border-slate-100 mt-0.5"
                            onClick={() => column.setFilterValue(undefined)}
                        >
                            Clear
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}


const columnHelper = createColumnHelper<LogItem>()

const columns = [
    columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => info.getValue(),
        enableColumnFilter: false,
    }),
    columnHelper.accessor('log_time', {
        header: 'Log Time',
        cell: (info) => info.getValue(),
        enableColumnFilter: false,
    }),
    columnHelper.accessor('level', {
        header: 'Level',
        cell: (info) => info.getValue(),
        enableColumnFilter: true,
        filterFn: 'arrIncludesSome',
    }),
    columnHelper.accessor('ip', {
        header: 'IP',
        cell: (info) => info.getValue(),
        enableColumnFilter: false,
    }),
    columnHelper.accessor('method', {
        header: 'Method',
        cell: (info) => info.getValue(),
        enableColumnFilter: true,
        filterFn: 'arrIncludesSome',
    }),
    columnHelper.accessor('path', {
        header: 'Path',
        cell: (info) => info.getValue(),
        enableColumnFilter: false,
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => info.getValue(),
        enableColumnFilter: false,
    }),
    columnHelper.accessor('duration_ms', {
        header: 'Duration',
        cell: (info) => info.getValue(),
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
        <div className='flex flex-col gap-3'>
            <div className='overflow-x-auto rounded-lg border border-slate-200'>
                <table className="w-full text-sm text-left border-collapse">
                    <thead className='bg-slate-700 text-white'>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        className="px-4 pt-3 pb-2 font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
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
                    <tbody className='divide-y divide-slate-100'>
                        {table.getRowModel().rows.map((row, i) => (
                            <tr
                                key={row.id}
                                className={`hover:bg-sky-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td className="px-4 py-2 whitespace-nowrap text-slate-700" key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className='flex items-center justify-center gap-1 text-sm'>
                <button
                    className='px-3 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 transition-colors'
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                >{'<<'}</button>
                <button
                    className='px-3 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 transition-colors'
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >{'<'}</button>
                <span className='px-3 py-1 text-slate-600'>
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <button
                    className='px-3 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 transition-colors'
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >{'>'}</button>
                <button
                    className='px-3 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 transition-colors'
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                >{'>>'}</button>
                <select
                    className='ml-3 px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors'
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
