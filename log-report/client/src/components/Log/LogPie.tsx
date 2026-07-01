import { createContext, useContext, useState } from 'react'
import { Pie, PieChart, Sector, Tooltip } from 'recharts';
import type { PieSectorShapeProps, TooltipIndex, PieLabelRenderProps, PieSectorDataItem } from 'recharts';
import type { ServiceCount } from '@/api/log'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const RADIAN = Math.PI / 180;

const SelectedIndexContext = createContext<number | undefined>(undefined)

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

function PieGradientWithActive(props: PieSectorShapeProps) {
    const selectedIndex = useContext(SelectedIndexContext)
    return <PieGradient {...props} isActive={props.index === selectedIndex} />
}

function LogPie({
    isAnimationActive,
    defaultIndex,
    data,
    name,
    onSliceClick,
}: {
    readonly isAnimationActive?: boolean;
    readonly defaultIndex?: TooltipIndex;
    readonly data: ServiceCount[] | undefined;
    readonly name?: string | null;
    readonly onSliceClick?: (service: string | null) => void;
}) {
    const [selectedIndex, setSelectedIndex] = useState<number | undefined>(undefined)

    function handleClick(entry: PieSectorDataItem, index: number) {
        const next = selectedIndex === index ? undefined : index
        setSelectedIndex(next)
        onSliceClick?.(next === undefined ? null : (entry as PieSectorDataItem & ServiceCount).name_service)
    }

    return (
        <SelectedIndexContext.Provider value={selectedIndex}>
            <div className='flex flex-col items-center'>
                <PieChart style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 1 }} responsive>
                    <Pie
                        data={data}
                        dataKey="count"
                        nameKey="name_service"
                        isAnimationActive={isAnimationActive}
                        shape={PieGradientWithActive}
                        innerRadius="20%"
                        label={renderCustomizedLabel}
                        labelLine={false}
                        onClick={handleClick}
                        style={{ cursor: 'pointer' }}
                    />
                    <Tooltip defaultIndex={defaultIndex} />
                </PieChart>
                {name?.trim() && (<span className='font-bold'>{name}</span>)}
            </div>
        </SelectedIndexContext.Provider>
    );
}

export default LogPie

// LogReport holds selectedService state and passes onSliceClick={setSelectedService} to LogPie and serviceFilter={selectedService} to LogTable
// LogPie — clicking a slice calls onSliceClick(name_service); clicking the same slice again toggles it off (null). The selected slice gets the isActive stroke highlight via SelectedIndexContext → PieGradientWithActive
// LogTable — the useEffect on serviceFilter injects/removes the name_service column filter whenever the prop changes, keeping the manual text filter for that column in sync