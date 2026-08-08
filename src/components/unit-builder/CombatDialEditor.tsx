'use client'

import { useColorMeanings } from '@/hooks/useColorMeanings'

export interface CombatDialRow {
  step: number
  marker: 'none' | 'black' | 'green'
  primaryValue: number
  secondaryValue: number
  movementValue: number
  defenseValue: number
  attackValue: number
  primaryEquipColorMeaningId: string | null
  primaryEquipUsageType: 'standard' | 'single-use'
  secondaryEquipColorMeaningId: string | null
  secondaryEquipUsageType: 'standard' | 'single-use'
  movementEquipColorMeaningId: string | null
  movementEquipUsageType: 'standard' | 'single-use'
  attackEquipColorMeaningId: string | null
  attackEquipUsageType: 'standard' | 'single-use'
  defenseEquipColorMeaningId: string | null
  defenseEquipUsageType: 'standard' | 'single-use'
}

interface Props {
  rows: CombatDialRow[]
  onChange: (rows: CombatDialRow[]) => void
}

const SLOT_LABELS: { key: keyof CombatDialRow; label: string; type: 'num' | 'equip' | 'usage' | 'marker' }[] = [
  { key: 'marker',                       label: 'Marcador',    type: 'marker' },
  { key: 'primaryValue',                 label: 'Primário',    type: 'num' },
  { key: 'primaryEquipColorMeaningId',   label: 'Equip P',     type: 'equip' },
  { key: 'primaryEquipUsageType',        label: 'Uso P',       type: 'usage' },
  { key: 'secondaryValue',               label: 'Secundário',  type: 'num' },
  { key: 'secondaryEquipColorMeaningId', label: 'Equip S',     type: 'equip' },
  { key: 'secondaryEquipUsageType',      label: 'Uso S',       type: 'usage' },
  { key: 'movementValue',                label: 'Movimento',   type: 'num' },
  { key: 'movementEquipColorMeaningId',  label: 'Equip Mov',   type: 'equip' },
  { key: 'movementEquipUsageType',       label: 'Uso Mov',     type: 'usage' },
  { key: 'defenseValue',                 label: 'Defesa',      type: 'num' },
  { key: 'defenseEquipColorMeaningId',   label: 'Equip Def',   type: 'equip' },
  { key: 'defenseEquipUsageType',        label: 'Uso Def',     type: 'usage' },
  { key: 'attackValue',                  label: 'Ataque',      type: 'num' },
  { key: 'attackEquipColorMeaningId',    label: 'Equip Atk',   type: 'equip' },
  { key: 'attackEquipUsageType',         label: 'Uso Atk',     type: 'usage' },
]

const CTX_ABBREV: Record<string, string> = {
  movement:  'M',
  ballistic: 'B',
  melee:     'ME',
  energetic: 'E',
  attack:    'ATK',
  defense:   'DEF',
}

function optionLabel(colorName: string, context: string): string {
  const c = colorName[0]
  const ctx = CTX_ABBREV[context]
  return ctx ? `[${ctx}, ${c}]` : `[${c}]`
}

// Color display name → hex
const COLOR_HEX: Record<string, string> = {
  Black:  '#aaaaaa',
  Red:    '#cc2200',
  Blue:   '#00aacc',
  Purple: '#9900aa',
  Gray:   '#888888',
  Green:  '#339900',
  Yellow: '#ccaa00',
}

export function CombatDialEditor({ rows, onChange }: Props) {
  const { colorMeanings } = useColorMeanings()

  const equipMeanings = colorMeanings.filter(c => c.usageType === 'equipment')

  function update(step: number, key: keyof CombatDialRow, value: unknown) {
    onChange(rows.map(r => r.step === step ? { ...r, [key]: value } : r))
  }

  function copyDown(fromStep: number) {
    const src = rows.find(r => r.step === fromStep)
    if (!src) return
    onChange(rows.map(r => r.step > fromStep ? { ...src, step: r.step } : r))
  }

  const thCls = 'px-2 py-1.5 text-center font-mono text-[10px] text-[#7a9a5a] tracking-wider uppercase whitespace-nowrap border-r border-[#2a3a1a] last:border-r-0'
  const tdCls = 'px-1 py-0.5 border-r border-[#1a2a12] last:border-r-0 text-center'

  return (
    <div className="rounded border border-[#2a3a1a] overflow-hidden" style={{ background: 'rgba(8,12,5,0.9)' }}>
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#2a3a1a]" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <span className="font-mono text-xs text-[#c9a84c] tracking-widest uppercase">Combat Dial — {rows.length} clicks</span>
        <span className="font-mono text-[10px] text-[#4a5e3a]">Edite cada click individualmente. Marcador preto = ★</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#2a3a1a]" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <th className={thCls + ' w-10'}>Click</th>
              {SLOT_LABELS.map(s => <th key={String(s.key)} className={thCls}>{s.label}</th>)}
              <th className={thCls}>⬇ Copiar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.step}
                className="border-b border-[#1a2a12] hover:bg-[#0d1208] transition-colors"
                style={{ background: idx % 2 === 0 ? 'rgba(13,18,8,0.5)' : 'rgba(8,12,5,0.5)' }}
              >
                {/* Step number */}
                <td className={tdCls}>
                  <span className="font-mono text-[#c9a84c] font-bold">{row.step}</span>
                </td>

                {/* Marker */}
                <td className={tdCls}>
                  <select
                    value={row.marker}
                    onChange={e => update(row.step, 'marker', e.target.value)}
                    className="bg-transparent font-mono text-[10px] text-[#e8d5a0] cursor-pointer outline-none"
                    title="Marcador preto = habilidade especial no click"
                  >
                    <option value="none">—</option>
                    <option value="black">★ Preto</option>
                    <option value="green">◆ Verde</option>
                  </select>
                </td>

                {/* Primary value */}
                <td className={tdCls}>
                  <NumInput value={row.primaryValue} onChange={v => update(row.step, 'primaryValue', v)} />
                </td>

                {/* Primary equip */}
                <td className={tdCls}>
                  <EquipSelect
                    value={row.primaryEquipColorMeaningId}
                    onChange={v => update(row.step, 'primaryEquipColorMeaningId', v)}
                    options={equipMeanings}
                  />
                </td>
                <td className={tdCls}>
                  <UsageTypeSelect value={row.primaryEquipUsageType} onChange={v => update(row.step, 'primaryEquipUsageType', v)} />
                </td>

                {/* Secondary value */}
                <td className={tdCls}>
                  <NumInput value={row.secondaryValue} onChange={v => update(row.step, 'secondaryValue', v)} />
                </td>

                {/* Secondary equip */}
                <td className={tdCls}>
                  <EquipSelect
                    value={row.secondaryEquipColorMeaningId}
                    onChange={v => update(row.step, 'secondaryEquipColorMeaningId', v)}
                    options={equipMeanings}
                  />
                </td>
                <td className={tdCls}>
                  <UsageTypeSelect value={row.secondaryEquipUsageType} onChange={v => update(row.step, 'secondaryEquipUsageType', v)} />
                </td>

                {/* Movement */}
                <td className={tdCls}>
                  <NumInput value={row.movementValue} onChange={v => update(row.step, 'movementValue', v)} />
                </td>

                {/* Movement equip */}
                <td className={tdCls}>
                  <EquipSelect
                    value={row.movementEquipColorMeaningId}
                    onChange={v => update(row.step, 'movementEquipColorMeaningId', v)}
                    options={equipMeanings.filter(m => m.context === 'movement')}
                  />
                </td>
                <td className={tdCls}>
                  <UsageTypeSelect value={row.movementEquipUsageType} onChange={v => update(row.step, 'movementEquipUsageType', v)} />
                </td>

                {/* Defense */}
                <td className={tdCls}>
                  <NumInput value={row.defenseValue} onChange={v => update(row.step, 'defenseValue', v)} />
                </td>

                {/* Defense equip */}
                <td className={tdCls}>
                  <EquipSelect
                    value={row.defenseEquipColorMeaningId}
                    onChange={v => update(row.step, 'defenseEquipColorMeaningId', v)}
                    options={equipMeanings.filter(m => m.context === 'defense')}
                  />
                </td>
                <td className={tdCls}>
                  <UsageTypeSelect value={row.defenseEquipUsageType} onChange={v => update(row.step, 'defenseEquipUsageType', v)} />
                </td>

                {/* Attack */}
                <td className={tdCls}>
                  <NumInput value={row.attackValue} onChange={v => update(row.step, 'attackValue', v)} />
                </td>

                {/* Attack equip */}
                <td className={tdCls}>
                  <EquipSelect
                    value={row.attackEquipColorMeaningId}
                    onChange={v => update(row.step, 'attackEquipColorMeaningId', v)}
                    options={equipMeanings.filter(m => m.context === 'attack')}
                  />
                </td>
                <td className={tdCls}>
                  <UsageTypeSelect value={row.attackEquipUsageType} onChange={v => update(row.step, 'attackEquipUsageType', v)} />
                </td>

                {/* Copy down */}
                <td className={tdCls}>
                  {row.step < rows.length && (
                    <button
                      onClick={() => copyDown(row.step)}
                      title="Copiar este click para todos abaixo"
                      className="font-mono text-[10px] text-[#5a7a4a] hover:text-[#c9a84c] transition-colors px-1"
                    >
                      ⬇
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-[#2a3a1a] flex flex-wrap gap-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <span className="font-mono text-[10px] text-[#4a5e3a] uppercase tracking-widest">Equipamentos:</span>
        {Object.entries(COLOR_HEX).map(([name, hex]) => (
          <span key={name} className="flex items-center gap-1 font-mono text-[10px]">
            <span className="w-3 h-3 rounded-full border border-[#3a4a2a]" style={{ background: hex }} />
            <span style={{ color: '#7a9a5a' }}>{name}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(+e.target.value)}
      className="w-12 bg-transparent border border-[#2a3a1a] rounded text-center font-mono text-xs text-[#e8d5a0] focus:outline-none focus:border-[#c9a84c] py-0.5"
    />
  )
}


function UsageTypeSelect({ value, onChange }: { value: 'standard' | 'single-use'; onChange: (v: 'standard' | 'single-use') => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as 'standard' | 'single-use')}
      className="bg-transparent font-mono text-[10px] outline-none cursor-pointer"
      style={{ color: value === 'single-use' ? '#cc2200' : '#7a9a5a' }}
    >
      <option value="standard"   style={{ background: '#0d1208', color: '#7a9a5a' }}>Std</option>
      <option value="single-use" style={{ background: '#0d1208', color: '#cc2200' }}>1×</option>
    </select>
  )
}

function EquipSelect({
  value,
  onChange,
  options,
}: {
  value: string | null
  onChange: (v: string | null) => void
  options: ReturnType<typeof useColorMeanings>['colorMeanings']
}) {
  const selected = options.find(o => o.id === value)
  const hex = selected ? COLOR_HEX[selected.color.name] ?? '#ffffff' : undefined

  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
      className="max-w-[110px] bg-transparent font-mono text-[10px] outline-none cursor-pointer"
      style={{ color: hex ?? '#3a4a2a' }}
      title={selected?.meaning ?? 'Sem equipamento'}
    >
      <option value="" style={{ color: '#3a4a2a', background: '#0d1208' }}>—</option>
      {options.map(o => (
        <option
          key={o.id}
          value={o.id}
          style={{ color: COLOR_HEX[o.color.name] ?? '#fff', background: '#0d1208' }}
          title={o.description}
        >
          {optionLabel(o.color.name, o.context)} {o.meaning.split(' ')[0]}
        </option>
      ))}
    </select>
  )
}
