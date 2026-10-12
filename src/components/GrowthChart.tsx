import { PHASES } from '../game/content'
import { avgStat } from '../game/format'
import type { Snapshot } from '../game/types'

export function GrowthChart({ history }: { history: Snapshot[] }) {
  if (history.length < 2) return null
  const width = 320
  const height = 168
  const pad = 16
  const reps = history.map((item) => item.reputation)
  const moneys = history.map((item) => item.money)
  const skills = history.map((item) => avgStat(item.stats))
  const maxRep = Math.max(...reps, 1)
  const maxMoney = Math.max(...moneys, 1)
  const maxSkill = Math.max(...skills, 1)
  const x = (index: number) => pad + (index * (width - pad * 2)) / (history.length - 1)
  const y = (value: number, max: number) => height - pad - (value / max) * (height - pad * 2)
  const path = (values: number[], max: number) => values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(value, max)}`).join(' ')
  return (
    <div>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="성장 곡선">
        <path d={path(reps, maxRep)} fill="none" stroke="#1db954" strokeWidth="3" />
        <path d={path(moneys, maxMoney)} fill="none" stroke="#ffffff" strokeWidth="3" />
        <path d={path(skills, maxSkill)} fill="none" stroke="#b3b3b3" strokeWidth="3" />
        {history.map((item, index) => (
          <g key={`dot-${item.phase}`}>
            <circle cx={x(index)} cy={y(reps[index], maxRep)} r="3.5" fill="#1db954" />
            <circle cx={x(index)} cy={y(moneys[index], maxMoney)} r="3.5" fill="#ffffff" />
            <circle cx={x(index)} cy={y(skills[index], maxSkill)} r="3.5" fill="#b3b3b3" />
          </g>
        ))}
        {history.map((item, index) => (
          <text key={item.phase} x={x(index)} y={height - 2} fill="#777" fontSize="10" textAnchor="middle">
            {PHASES[item.phase].name}
          </text>
        ))}
      </svg>
      <div className="legend">
        <span><b style={{ color: '#1db954' }}>이름값</b></span>
        <span><b style={{ color: '#fff' }}>돈</b></span>
        <span><b style={{ color: '#b3b3b3' }}>능력치</b></span>
      </div>
    </div>
  )
}
