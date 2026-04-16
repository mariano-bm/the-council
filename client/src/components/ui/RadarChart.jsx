import { ResponsiveContainer, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#ec4899', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

const CATEGORIES = [
  { key: 'gameplay', label: 'Gameplay' },
  { key: 'story', label: 'Historia' },
  { key: 'graphics', label: 'Gráficos' },
  { key: 'replayability', label: 'Rejugabilidad' },
  { key: 'group_fun', label: 'Diversión Grupal' },
];

export default function RadarChart({ reviews, averages, height = 350 }) {
  const chartData = CATEGORIES.map(cat => {
    const point = { category: cat.label };
    if (averages) {
      point['Promedio'] = parseFloat(averages[cat.key]) || 0;
    }
    reviews?.forEach((review, i) => {
      point[review.discord_name] = parseFloat(review[cat.key]) || 0;
    });
    return point;
  });

  const players = reviews?.map(r => r.discord_name) || [];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadar data={chartData} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 10]}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
          tickCount={6}
        />
        {averages && (
          <Radar
            name="Promedio"
            dataKey="Promedio"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.15}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        )}
        {players.map((name, i) => (
          <Radar
            key={name}
            name={name}
            dataKey={name}
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.08}
            strokeWidth={1.5}
          />
        ))}
        <Legend
          wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(10, 10, 15, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: 12,
          }}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
