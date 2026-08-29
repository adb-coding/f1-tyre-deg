interface BoxplotStats {
    whislo: number;
    q1: number;
    med: number;
    q3: number;
    whishi: number;
    fliers: number[];
}

interface BoxplotChartProps {
    data: Record<string, BoxplotStats>;
    colorMap: Record<string, string>;
    height?: number;
}

export function BoxplotChart({data, colorMap, height = 200 }: BoxplotChartProps) {
    const entries = Object.entries(data);
    const allValues = entries.flatMap(([, s]) => [s.whislo, s.whishi, s.q1, s.med, s.q3, ...s.fliers]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const pad = (max - min) * 0.1;
    const domainMin = min - pad;
    const domainMax = max + pad;

    const width = 120;
    const gap = 60;
    const chartWidth = entries.length * (width + gap);
    const marginTop = 20, marginBottom = 30, marginLeft = 5;
    const plotHeight = height - marginTop - marginBottom;

    const y = (value: number) => marginTop + plotHeight * (1 - (value - domainMin) / ( domainMax - domainMin));
    const tickCount = 5;
    const YTicks = Array.from({ length: tickCount }, (_, i) => domainMin + ((domainMax - domainMin) * i) /(tickCount - 1));
    return (
        <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
            <line x1={marginLeft} x2={marginLeft} y1={marginTop} y2={height - marginBottom} stroke="var(--line)"/>
            
            {YTicks.map((tick) => {
                const yPos = y(tick);
                return (
                    <g key={tick}>
                        <line x1={marginLeft - 5} x2={marginLeft} y1={yPos} y2={yPos} stroke="var(--line)" strokeWidth={1} />
                        <line x1={marginLeft} x2={marginLeft} y1={yPos} y2={yPos} strokeOpacity={0.35} stroke="var(--line)" strokeWidth={1} />
                        <text x={marginLeft - 8} y={yPos + 4} textAnchor="end" fill="var(--text-muted)" fontSize={11} fontFamily="var(--font-mono)" />
                    </g>
                );
            })}

            {entries.map(([compound, s], i) => {
                const cx = i * (width + gap) + gap / 2 + width / 2;
                const color = colorMap[compound] ?? '#999';
                return (
                    <g key={compound}>
                        <line x1={cx - 15} x2={cx+15} y1={y(s.whislo)} y2={y(s.whislo)} stroke={color} strokeWidth={1.5} />
                        <line x1={cx - 15} x2={cx+15} y1={y(s.whishi)} y2={y(s.whishi)} stroke={color} strokeWidth={1.5} />
                        <rect
                            x={cx - width / 2 } y={y(s.q3)}
                            width={width} height={y(s.q1)-y(s.q3)}
                            fill={color} fillOpacity={0.25} stroke={color} strokeWidth={1.5}
                        />
                        <line x1={cx - width / 2} x2={cx+ width / 2} y1={y(s.med)} y2={y(s.med)} stroke={color} strokeWidth={1.5} />
                        {s.fliers.map((v, fi) => (
                            <circle key={fi} cx={cx} cy={y(v)} r={2.5} fill="none" stroke={color} />
                        ))}
                        <text x={cx} y={height - 8} textAnchor="middle" fill="var(--text-muted)" fontSize={11} fontFamily="var(--font-mono)">
                            {compound}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}