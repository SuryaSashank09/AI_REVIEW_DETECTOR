import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ScanSearch, BarChart3, ShieldAlert, History, Settings, HelpCircle } from 'lucide-react'

const NAV = [
  { to:'/dashboard',  Icon:LayoutDashboard, label:'Dashboard' },
  { to:'/analyze',    Icon:ScanSearch,      label:'Analyze Product' },
  { to:'/rating',     Icon:BarChart3,       label:'True Rating' },
  { to:'/suspicious', Icon:ShieldAlert,     label:'Suspicious Reviews' },
  { to:'/history',    Icon:History,         label:'History' },
]
const BOTTOM = [
  { to:'/settings', Icon:Settings,   label:'Settings' },
  { to:'/help',     Icon:HelpCircle, label:'Help / Docs' },
]

// Shield + magnifying glass logo (Logo 1)
function ShieldLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#1a1a24"/>
      <path d="M50 12L18 26v20c0 20 14 38 32 44 18-6 32-24 32-44V26L50 12z" fill="rgba(63,185,80,0.2)" stroke="#3fb950" strokeWidth="3.5" strokeLinejoin="round"/>
      <circle cx="47" cy="50" r="14" fill="none" stroke="#3fb950" strokeWidth="3.5"/>
      <path d="M41 50l4 4 8-9" stroke="#3fb950" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="57" y1="60" x2="66" y2="70" stroke="#3fb950" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  )
}

const S = {
  sb:   { width:'var(--sw)', minHeight:'100vh', background:'var(--surf)', borderRight:'1px solid var(--bdr)', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0 },
  logo: { display:'flex', alignItems:'center', gap:10, padding:'16px 14px', borderBottom:'1px solid var(--bdr)' },
  logoTxt: { fontFamily:'var(--fd)', fontWeight:800, fontSize:13.5, letterSpacing:'-0.01em', color:'var(--tx)' },
  user: { display:'flex', alignItems:'center', gap:9, margin:'10px 10px 6px', padding:'9px 11px', background:'var(--elev)', borderRadius:'var(--r)', border:'1px solid var(--bdr)' },
  av:   { width:28, height:28, borderRadius:6, background:'linear-gradient(135deg,#3fb950,#2ea043)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'#fff', flexShrink:0 },
  nav:  { flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'6px 8px 14px' },
  item: { display:'flex', alignItems:'center', gap:9, padding:'8px 9px', borderRadius:'var(--r)', color:'var(--tx2)', textDecoration:'none', fontSize:12.5, fontWeight:500, transition:'all .15s', border:'1px solid transparent', marginBottom:2 },
  active:{ background:'var(--grn-d)', color:'var(--grn)', borderColor:'rgba(63,185,80,0.2)' },
  div:  { borderTop:'1px solid var(--bdr)', paddingTop:8 },
}

export default function Sidebar() {
  return (
    <aside style={S.sb}>
      <div style={S.logo}>
        <ShieldLogo size={30} />
        <span style={S.logoTxt}>Review Guardian</span>
      </div>
      <div style={S.user}>
        <div style={S.av}>A</div>
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>Admin</div>
          <div style={{ fontSize:11, color:'var(--tx3)' }}>Adm18</div>
        </div>
      </div>
      <nav style={S.nav}>
        <div>
          {NAV.map(({ to, Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({ ...S.item, ...(isActive ? S.active : {}) })}>
              <Icon size={15} strokeWidth={1.8}/><span>{label}</span>
            </NavLink>
          ))}
        </div>
        <div style={S.div}>
          {BOTTOM.map(({ to, Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({ ...S.item, ...(isActive ? S.active : {}) })}>
              <Icon size={15} strokeWidth={1.8}/><span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  )
}
