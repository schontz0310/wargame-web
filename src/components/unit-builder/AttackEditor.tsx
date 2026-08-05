'use client'

import { useColorMeanings } from '@/hooks/useColorMeanings'

export interface AttackRow {
  id: string
  attackType: 'primary' | 'secondary'
  damageType: 'ballistic' | 'energetic' | 'melee'
  targetCount: number
  minRange: number
  maxRange: number
  primaryEquipColorMeaningId?: string | null
  secondaryEquipColorMeaningId?: string | null
}

interface Props {
  rows: AttackRow[]
  onChange: (rows: AttackRow[]) => void
}

const DAMAGE_LABEL: Record<string, string> = {
  ballistic: '🔴 Balístico',
  energetic: '⚡ Energético',
  melee:     '⚔️  Melee',
}

const DAMAGE_COLOR: Record<string, string> = {
  ballistic: '#cc4400',
  energetic: '#00aacc',
  melee:     '#c9a84c',
}

const COLOR_HEX: Record<string, string> = {
  Black: '#111111', Red: '#cc2200', Blue: '#00aacc',
  Purple: '#9900aa', Gray: '#888888', Green: '#339900', Yellow: '#ccaa00',
}

export function AttackEditor({ rows, onChange }: Props) {
  const { colorMeanings } = useColorMeanings()
  const equipMeanings = colorMeanings.filter(c => c.usageType === 'equipment')

  function update(id: string, key: keyof AttackRow, value: unknown) {
    onChange(rows.map(r => r.id === id ? { ...r, [key]: value } : r))
  }

  function addAttack() {
    if (rows.length >= 4) return
    onChange([...rows, {
      id: crypto.randomUUID(),
      attackType: rows.length === 0 ? 'primary' : 'secondary',
      damageType: 'ballistic',
      targetCount: 1,
      minRange: 0,
      maxRange: 6,
      primaryEquipColorMeaningId: null,
      secondaryEquipColorMeaningId: null,
    }])
  }

  function removeAttack(id: string) {
    onChange(rows.filter(r => r.id !== id))
  }

  const inputCls = "bg-[#0d1208] border border-[#2a3a1a] rounded px-2 py-1 text-xs text-[#e8d5a0] font-mono focus:outline-none focus:border-[#c9a84c] transition-colors"

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-[#c9a84c] tracking-widest uppercase">Ataques — {rows.length} tipo(s)</span>
          <p className="font-mono text-[10px] text-[#4a5e3a] mt-0.5">
            Defina os tipos de ataque, dano, arco e alcance. Múltiplos ataques = mais tipos de dano por click.
          </p>
        </div>
        <button
          onClick={addAttack}
          disabled={rows.length >= 4}
          className="font-mono text-xs px-3 py-1.5 rounded border border-[#3a4a2a] text-[#7a9a5a] hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          + Adicionar Ataque
        </button>
      </div>

      {rows.length === 0 && (
        <div className="rounded border border-dashed border-[#2a3a1a] p-8 text-center">
          <p className="font-mono text-xs text-[#3a4a2a]">Nenhum ataque definido. Adicione pelo menos um.</p>
        </div>
      )}

      {rows.map((row) => (
        <div
          key={row.id}
          className="rounded border border-[#2a3a1a] overflow-hidden"
          style={{ background: 'rgba(8,12,5,0.9)' }}
        >
          {/* Attack header */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b border-[#2a3a1a]"
            style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${DAMAGE_COLOR[row.damageType]}` }}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold" style={{ color: DAMAGE_COLOR[row.damageType] }}>
                {DAMAGE_LABEL[row.damageType]}
              </span>
              <span className="font-mono text-[10px] text-[#4a5e3a]">
                {row.attackType === 'primary' ? '● Primário' : '○ Secundário'}
              </span>
              <span className="font-mono text-[10px] text-[#4a5e3a]">
                Alcance: {row.minRange}″–{row.maxRange}″ · {row.targetCount} alvo(s)
              </span>
            </div>
            <button
              onClick={() => removeAttack(row.id)}
              className="font-mono text-[10px] text-[#3a4a2a] hover:text-[#cc2200] transition-colors px-2"
            >
              ✕ Remover
            </button>
          </div>

          {/* Attack fields */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 p-4">
            {/* Attack type */}
            <Field label="Tipo de Ataque">
              <select
                className={inputCls + ' w-full cursor-pointer'}
                value={row.attackType}
                onChange={e => update(row.id, 'attackType', e.target.value)}
              >
                <option value="primary">Primário</option>
                <option value="secondary">Secundário</option>
              </select>
            </Field>

            {/* Damage type */}
            <Field label="Tipo de Dano">
              <select
                className={inputCls + ' w-full cursor-pointer'}
                value={row.damageType}
                onChange={e => update(row.id, 'damageType', e.target.value)}
                style={{ color: DAMAGE_COLOR[row.damageType] }}
              >
                <option value="ballistic" style={{ color: DAMAGE_COLOR.ballistic }}>🔴 Balístico</option>
                <option value="energetic" style={{ color: DAMAGE_COLOR.energetic }}>⚡ Energético</option>
                <option value="melee"     style={{ color: DAMAGE_COLOR.melee }}>⚔️ Melee</option>
              </select>
            </Field>

            {/* Target count */}
            <Field label="Nº de Alvos">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={row.targetCount}
                  onChange={e => update(row.id, 'targetCount', +e.target.value)}
                  className={inputCls + ' w-full text-center'}
                />
              </div>
              <p className="font-mono text-[9px] text-[#3a4a2a] mt-0.5">
                {row.targetCount === 1 ? 'Alvo único' : `Múltiplos (${row.targetCount})`}
              </p>
            </Field>

            {/* Min range */}
            <Field label={`Alcance Mín (″)`}>
              <input
                type="number"
                min={0}
                max={24}
                value={row.minRange}
                onChange={e => update(row.id, 'minRange', +e.target.value)}
                className={inputCls + ' w-full text-center'}
              />
              <p className="font-mono text-[9px] text-[#3a4a2a] mt-0.5">
                {row.minRange === 0 ? 'Corpo-a-corpo incluso' : `Mín ${row.minRange}″`}
              </p>
            </Field>

            {/* Max range */}
            <Field label={`Alcance Máx (″)`}>
              <input
                type="number"
                min={1}
                max={24}
                value={row.maxRange}
                onChange={e => update(row.id, 'maxRange', +e.target.value)}
                className={inputCls + ' w-full text-center'}
              />
            </Field>

            {/* Equipment (primary slot context) */}
            <Field label="Equipamento Especial">
              <select
                className={inputCls + ' w-full cursor-pointer'}
                value={row.primaryEquipColorMeaningId ?? ''}
                onChange={e => update(row.id, 'primaryEquipColorMeaningId', e.target.value || null)}
                style={{
                  color: (() => {
                    const sel = equipMeanings.find(o => o.id === row.primaryEquipColorMeaningId)
                    return sel ? (COLOR_HEX[sel.color.name] ?? '#e8d5a0') : '#4a5e3a'
                  })()
                }}
              >
                <option value="" style={{ color: '#4a5e3a', background: '#0d1208' }}>— Nenhum</option>
                {equipMeanings
                  .filter(m => ['ballistic', 'energetic', 'melee'].includes(m.context))
                  .map(o => (
                    <option
                      key={o.id}
                      value={o.id}
                      style={{ color: COLOR_HEX[o.color.name] ?? '#fff', background: '#0d1208' }}
                      title={o.description}
                    >
                      [{o.color.name[0]}] {o.meaning}
                    </option>
                  ))
                }
              </select>
              {row.primaryEquipColorMeaningId && (() => {
                const sel = equipMeanings.find(o => o.id === row.primaryEquipColorMeaningId)
                return sel ? (
                  <p className="font-mono text-[9px] mt-0.5 leading-tight" style={{ color: COLOR_HEX[sel.color.name] ?? '#fff' }}>
                    {sel.description.slice(0, 80)}…
                  </p>
                ) : null
              })()}
            </Field>
          </div>
        </div>
      ))}

      {/* Summary */}
      {rows.length > 0 && (
        <div className="rounded border border-[#2a3a1a] px-4 py-3 flex flex-wrap gap-6" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <span className="font-mono text-[10px] text-[#4a5e3a] uppercase tracking-widest">Resumo:</span>
          {rows.map(r => (
            <span key={r.id} className="flex items-center gap-1.5 font-mono text-[10px]">
              <span style={{ color: DAMAGE_COLOR[r.damageType] }}>●</span>
              <span className="text-[#7a9a5a]">{DAMAGE_LABEL[r.damageType].split(' ')[1]}</span>
              <span className="text-[#4a5e3a]">{r.minRange}–{r.maxRange}″</span>
              <span className="text-[#4a5e3a]">×{r.targetCount}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-[10px] text-[#7a9a5a] tracking-widest uppercase mb-1">{label}</label>
      {children}
    </div>
  )
}
