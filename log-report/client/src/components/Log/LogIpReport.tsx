import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ZAxis, type TooltipIndex } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';
import type { LogItem } from '@/api/log'

export function LogIpReport({ data }: { readonly data: LogItem[] | undefined }) {
    // const tableData = useMemo(() => data ?? [], [data])

    // collection showing only external ip
    const externalIpData = data?.filter(item => isExternalIp(item?.ip))
        .map(item => ({ ...item, ip: processIp(item.ip) })) ?? []

    // showing unique ip
    const frequentIps = externalIpData.reduce((acc, item) => {
        if (!item.ip) return acc;
        acc[item.ip] = (acc[item.ip] || 0) + 1;
        return acc
    }, {} as Record<string, number>);

    console.log(`value table is ${JSON.stringify(frequentIps)}`)
    return (
        <div>

            <ScatterChartWithLabels />
            <table>
                <thead>
                    <tr>
                        <th>External IP Address : {frequentIps?.length}</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(frequentIps).map(([ip, count], index) => (
                        <tr key={ip}>
                            <td>{index + 1}</td>
                            <td>{ip}</td>
                            <td>{count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const processIp = (ipValue: string | null) => {
    if (ipValue === null) {
        return
    }

    const ipAddress = ipValue.split('/')[0];
    return ipAddress
}

const isExternalIp = (ip: string | null): boolean => {
    if (ip === null) return false;
    if (ip === '127.0.0.1') return false;
    if (ip.startsWith('10.')) return false;
    if (ip.startsWith('192.168.')) return false;

    const parts = ip.split('.');
    if (parts.length === 4) {
        const second = Number(parts[1]);
        if (parts[0] === '172' && second >= 16 && second <= 31) {
            return false;
        }
    }

    return true;
};

// #region Sample data
const data = [
    { x: 100, y: 200, z: 100 },
    { x: 120, y: 100, z: 360 },
    { x: 170, y: 300, z: 8000 },
];

// #endregion
const ScatterChartWithLabels = ({ defaultIndex }: { defaultIndex?: TooltipIndex }) => {
    return (
        <ScatterChart
            style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
            responsive
            margin={{
                top: 20,
                right: 0,
                bottom: 0,
                left: 0,
            }}
        >
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="stature" unit="" />
            <YAxis type="number" dataKey="y" name="weight" unit="kg" width="auto" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} defaultIndex={defaultIndex} />
            <Scatter name="A school" data={data} fill="#8884d8" activeShape={{ fill: 'green' }}>
                <LabelList dataKey="x" fill="black" />
            </Scatter>
            <ZAxis range={[900, 4000]} dataKey="z" />
            <RechartsDevtools />
        </ScatterChart>
    );
};
