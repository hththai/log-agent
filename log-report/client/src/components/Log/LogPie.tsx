import { Pie, PieChart, Sector, Tooltip } from 'recharts';
import type { PieSectorShapeProps, TooltipIndex, PieLabelRenderProps } from 'recharts';
import type { ServiceCount } from '@/api/log'


// const data = [
//     { 'name_service': 'doc_invoice', 'count': 50 },
//     { 'name_service': 'doc_service', 'count': 300 }]
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelRenderProps) => {
    if (cx == null || cy == null || innerRadius == null || outerRadius == null) {
        return null;
    }
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const ncx = Number(cx);
    const x = ncx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
    const ncy = Number(cy);
    const y = ncy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > ncx ? 'start' : 'end'} dominantBaseline="central">
            {`${((percent ?? 1) * 100).toFixed(0)}%`}
        </text>
    );
};

const PieGradient = (props: PieSectorShapeProps) => {
    return (
        <>
            <defs>
                <radialGradient
                    id={`fillGradient${props.index}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={props.outerRadius}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor={COLORS[props.index % COLORS.length]} stopOpacity={0} />
                    <stop offset="100%" stopColor={COLORS[props.index % COLORS.length]} stopOpacity={0.8} />
                </radialGradient>
                <radialGradient
                    id={`borderGradient${props.index}`}
                    cx={(typeof props.width === 'number' ? props.width : 0) / 2}
                    cy={(typeof props.height === 'number' ? props.height : 0) / 2}
                >
                    <stop offset="0%" stopColor={COLORS[props.index % COLORS.length]} stopOpacity={0} />
                    <stop offset="100%" stopColor={COLORS[props.index % COLORS.length]} stopOpacity={0.8} />

                </radialGradient>
                <clipPath id={`clipPath${props.index}`}>
                    <Sector {...props} />
                </clipPath>
            </defs>
            <Sector
                {...props}
                clipPath={`url(#clipPath${props.index})`}
                fill={`url(#fillGradient${props.index})`}
                stroke={`url(#borderGradient${props.index})`}
                strokeWidth={props.isActive ? '100%' : 0}
            />
        </>
    );
};


function LogPie({
    isAnimationActive,
    defaultIndex,
    data,
    name
}: {
    readonly isAnimationActive?: boolean;
    readonly defaultIndex?: TooltipIndex;
    readonly data: ServiceCount[] | undefined;
    readonly name?: string | null;
}) {

    return (
        <div className='flex flex-col items-center'>
            <PieChart style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 1 }} responsive>
                <Pie
                    data={data}
                    dataKey="count"
                    nameKey={data && data.length > 0 ? Object.keys(data[0])[0] : ''}
                    isAnimationActive={isAnimationActive}
                    shape={PieGradient} innerRadius="20%"
                    label={renderCustomizedLabel}
                    labelLine={false} />
                <Tooltip defaultIndex={defaultIndex} />
            </PieChart>
            {name && name.trim() !== "" && (<span className='font-bold'>{name}</span>)}
        </div>
    );
}

export default LogPie