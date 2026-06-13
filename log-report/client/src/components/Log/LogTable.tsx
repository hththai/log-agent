import { useMemo } from 'react'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from '@tanstack/react-table'

import type { LogItem } from '@/api/log'

const columnHelper = createColumnHelper<LogItem>()

const columns = [
    columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('log_time', {
        header: 'Log Time',
        cell: (info) => info.getValue()
    }),
    columnHelper.accessor('level', {
        header: 'Level',
        cell: (info) => info.getValue()
    }),
    columnHelper.accessor('ip', {
        header: 'IP',
        cell: (info) => info.getValue()
    }),
    columnHelper.accessor('method', {
        header: 'Method',
        cell: (info) => info.getValue()
    }),
    columnHelper.accessor('path', {
        header: 'Path',
        cell: (info) => info.getValue()
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => info.getValue()
    }),
    columnHelper.accessor('duration_ms', {
        header: 'Duration',
        cell: (info) => info.getValue()
    }),
    columnHelper.accessor('name_service', {
        header: 'Service',
        cell: (info) => info.getValue(),

    })
]

function LogTable({ data }: { readonly data: LogItem[] | undefined }) {
    const tableData = useMemo(() => data ?? [], [data])

    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: 10,
            }
        }
    })

    return (
        <div className='flex flex-col justify-center'>
            <table className="table-auto">
                <thead >
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th className="bg-sky-500 py-1" key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td className="px-4 py-1" key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className='flex justify-center'>
                <button className='border px-3'
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    {'<<'}
                </button>
                <button className='border px-3'
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    {'<'}
                </button>
                <button className='border px-3'
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    {'>'}
                </button>
                <button className='border px-3'
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                >
                    {'>>'}
                </button>
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => {
                        table.setPageSize(Number(e.target.value))
                    }}
                >
                    {[10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            {pageSize}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}

export default LogTable