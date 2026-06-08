import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'

const TITLES = {
  '/dashboard':  'Dashboard',
  '/analyze':    'Analyze Product',
  '/rating':     'True Rating',
  '/suspicious': 'Suspicious Reviews',
  '/history':    'History',
}

function ShieldLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="50" fill="#161b22"/>
      <path d="M50 12L18 26v20c0 20 14 38 32 44 18-6 32-24 32-44V26L50 12z" fill="rgba(63,185,80,0.2)" stroke="#3fb950" strokeWidth="3.5" strokeLinejoin="round"/>
      <circle cx="47" cy="50" r="14" fill="none" stroke="#3fb950" strokeWidth="3.5"/>
      <path d="M41 50l4 4 8-9" stroke="#3fb950" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="57" y1="60" x2="66" y2="70" stroke="#3fb950" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  )
}

export default function Header() {
  const { pathname } = useLocation()
  return (
    <header style={S.hdr}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <ShieldLogo size={26} />
        <span style={S.title}>{TITLES[pathname] || 'Review Guardian'}</span>
      </div>
      <div style={S.right}>
        <div style={S.search}>
          <Search size={13} color="var(--tx3)" />
          <input style={S.inp} placeholder="Search products…" />
        </div>
        <div style={S.notif}>
          <Bell size={15} />
          <span style={S.dot} />
        </div>
        <div style={S.chip}>
          <div style={S.av}>A</div>
          <span style={{ fontSize:12, fontWeight:500 }}>Admin</span>
        </div>
      </div>
    </header>
  )
}

const S = {
  hdr:   { height:'var(--hh)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 22px', borderBottom:'1px solid var(--bdr)', background:'var(--surf)', position:'sticky', top:0, zIndex:50 },
  title: { fontFamily:'var(--fd)', fontSize:17, fontWeight:700, letterSpacing:'-0.02em' },
  right: { display:'flex', alignItems:'center', gap:8 },
  search:{ display:'flex', alignItems:'center', gap:7, background:'var(--elev)', border:'1px solid var(--bdr)', borderRadius:'var(--r)', padding:'6px 11px', width:200 },
  inp:   { background:'none', border:'none', outline:'none', color:'var(--tx)', fontSize:12, width:'100%', fontFamily:'var(--ff)' },
  notif: { position:'relative', width:34, height:34, background:'var(--elev)', border:'1px solid var(--bdr)', borderRadius:'var(--r)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--tx2)', cursor:'pointer' },
  dot:   { position:'absolute', top:7, right:7, width:6, height:6, borderRadius:'50%', background:'var(--red)', border:'1.5px solid var(--surf)' },
  chip:  { display:'flex', alignItems:'center', gap:7, background:'var(--elev)', border:'1px solid var(--bdr)', borderRadius:'var(--r)', padding:'5px 9px', cursor:'pointer' },
  av:    { width:22, height:22, borderRadius:5, background:'linear-gradient(135deg,#3fb950,#2ea043)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff' },
}
