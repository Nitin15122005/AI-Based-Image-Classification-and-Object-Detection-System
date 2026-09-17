import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

/**
 * Thin Recharts wrapper for the training-curve charts on Models & Metrics.
 * `lines` is an array of { dataKey, name, color, dashed? }.
 */
export default function TrainingChart({ data, lines, yDomain, yTickFormatter, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#dadad7" vertical={false} />
        <XAxis
          dataKey="epoch"
          tickFormatter={(v) => `Ep ${v}`}
          tick={{ fontSize: 11, fill: '#45474c' }}
          axisLine={{ stroke: '#c5c6cd' }}
          tickLine={false}
        />
        <YAxis
          domain={yDomain || ['auto', 'auto']}
          tickFormatter={yTickFormatter}
          tick={{ fontSize: 11, fill: '#45474c' }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e3e0',
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
          }}
          formatter={(value) => (yTickFormatter ? yTickFormatter(value) : value)}
          labelFormatter={(v) => `Epoch ${v}`}
        />
        <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }} />
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={2.25}
            strokeDasharray={line.dashed ? '4 3' : undefined}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
