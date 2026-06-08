import { useEffect, useState } from 'react'

export function Card({ children, style = {} }) {
  return (
    <div style={{ background:'var(--surf)', border:'1px solid var(--bdr)', borderRadius:'var(--rl)', ...style }}>
      {children}
    </div>
  )
}

export function CardLabel({ children }) {
  return (
    <p style={{ fontFamily:'var(--fd)', fontSize:10.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:12 }}>
      {children}
    </p>
  )
}

export function ScoreBar({ value = 0, color = 'var(--grn)', height = 5 }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(value), 100); return () => clearTimeout(t) }, [value])
  return (
    <div style={{ height, background:'var(--act)', borderRadius:height, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${w}%`, background:color, borderRadius:height, transition:'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  )
}

const GRADE_C = {
  A:{ color:'#3fb950', bg:'rgba(63,185,80,0.1)',  border:'rgba(63,185,80,0.3)'  },
  B:{ color:'#58a6ff', bg:'rgba(88,166,255,0.1)', border:'rgba(88,166,255,0.3)' },
  C:{ color:'#d29922', bg:'rgba(210,153,34,0.1)', border:'rgba(210,153,34,0.3)' },
  D:{ color:'#e3702a', bg:'rgba(227,112,42,0.1)', border:'rgba(227,112,42,0.3)' },
  F:{ color:'#f85149', bg:'rgba(248,81,73,0.1)',  border:'rgba(248,81,73,0.3)'  },
}

export function GradeBadge({ grade = 'C', size = 'md' }) {
  const c   = GRADE_C[grade] || GRADE_C.C
  const dim = size === 'lg' ? 76 : size === 'sm' ? 36 : 54
  const fs  = size === 'lg' ? 30 : size === 'sm' ? 14 : 21
  return (
    <div style={{ width:dim, height:dim, borderRadius:12, border:`2px solid ${c.border}`, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', color:c.color, fontFamily:'var(--fd)', fontWeight:800, fontSize:fs, flexShrink:0 }}>
      {grade}
    </div>
  )
}

export function GradeColor(grade) {
  return (GRADE_C[grade] || GRADE_C.C).color
}

export function LoadingOverlay({ step = 0, steps = [] }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 24px', gap:8 }}>
      <div style={{ width:42, height:42, border:'3px solid var(--bdr2)', borderTopColor:'var(--grn)', borderRadius:'50%', animation:'spin .75s linear infinite', marginBottom:14 }} />
      <p style={{ fontFamily:'var(--fd)', fontWeight:700, fontSize:17 }}>Analyzing Reviews</p>
      <p style={{ fontSize:12, color:'var(--tx2)', marginBottom:14 }}>AI is processing your input…</p>
      <div style={{ display:'flex', flexDirection:'column', gap:7, alignItems:'flex-start' }}>
        {steps.map((s, i) => {
          const done   = i < step
          const active = i === step
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:9, fontSize:12, color: done ? 'var(--grn)' : active ? 'var(--tx)' : 'var(--tx3)', transition:'color .3s' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: done ? 'var(--grn)' : active ? 'var(--blu)' : 'var(--tx3)', animation: active ? 'pulseDot 1s infinite' : 'none' }} />
              {s}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ErrorBox({ msg }) {
  if (!msg) return null
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--red-d)', border:'1px solid rgba(248,81,73,0.3)', borderRadius:'var(--r)', padding:'10px 13px', fontSize:13, color:'var(--red)', marginTop:12 }}>
      ⚠ {msg}
    </div>
  )
}
