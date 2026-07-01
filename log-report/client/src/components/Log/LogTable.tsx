import React, { useMemo, useEffect } from 'react'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    getFilteredRowModel,
} from '@tanstack/react-table'
import type { ColumnFiltersState } from '@tanstack/react-table'

import type { LogItem } from '@/api/log'


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
        enableColumnFilter: false,
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
            return serviceFilter ? [...without, { id: 'name_service', value: serviceFilter }] : without
        })
    }, [serviceFilter])

    const table = useReactTable({
        data: tableData,
        columns,
        state: {
            columnFilters: columnFilters,
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
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
                                                    <input
                                                        className="w-full rounded px-2 py-1 text-xs font-normal text-slate-800 bg-white border border-slate-300 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                                                        value={(header.column.getFilterValue() as string) ?? ""}
                                                        onChange={(e) => header.column.setFilterValue(e.target.value)}
                                                        placeholder={`Filter…`}
                                                    />
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
