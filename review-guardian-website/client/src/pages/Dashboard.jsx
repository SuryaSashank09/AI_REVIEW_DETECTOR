import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useAnalysis } from '../context/AnalysisContext'
import { Card, CardLabel, GradeBadge, ScoreBar, LoadingOverlay, ErrorBox } from '../components/ui/index.jsx'

const SENT_COLORS = ['#3fb950', '#8b949e', '#f85149']

function sigColor(s) { return s > 70 ? 'var(--grn)' : s > 45 ? 'var(--yel)' : 'var(--red)' }

function normSentiment(sb) {
  const p = Math.max(0, Math.round(sb?.positive ?? 70))
  const n = Math.max(0, Math.round(sb?.neutral  ?? 20))
  const g = Math.max(0, Math.round(sb?.negative ?? 10))
  const t = p + n + g || 100
  const fp = Math.round((p/t)*100)
  const fn = Math.round((n/t)*100)
  return { positive: fp, neutral: fn, negative: Math.max(0, 100 - fp - fn) }
}

export default function Dashboard() {
  const { result, loading, step, STEPS, error, reset } = useAnalysis()
  const navigate = useNavigate()

  if (loading) return <Card><LoadingOverlay step={step} steps={STEPS} /></Card>

  const R = result
  const sent = R ? normSentiment(R.sentimentBreakdown) : null

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <ErrorBox msg={error} />

      {!R ? (
        <div style={S.empty}>
          <div style={S.emptyShield}>
            <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
              <path d="M50 8L12 24v22c0 22 16 42 38 48 22-6 38-26 38-48V24L50 8z" fill="rgba(63,185,80,0.15)" stroke="#3fb950" strokeWidth="3"/>
              <circle cx="50" cy="52" r="18" fill="none" stroke="#3fb950" strokeWidth="3"/>
              <path d="M44 52l4 4 8-8" stroke="#3fb950" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="63" y1="65" x2="72" y2="74" stroke="#3fb950" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={S.emptyTitle}>Start Analyzing Reviews</p>
          <p style={S.emptySub}>Go to <strong style={{color:'var(--grn)'}}>Analyze Product</strong> to paste review text and get an instant Trust Grade, or check <strong style={{color:'var(--grn)'}}>History</strong> to view past analyses.</p>
          <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap', justifyContent:'center' }}>
            <button style={S.ctaBtn} onClick={() => navigate('/analyze')}>Analyze Reviews →</button>
            <button style={S.secBtn} onClick={() => navigate('/history')}>View History</button>
          </div>
        </div>
      ) : (
        <div style={S.grid}>
          <Card style={{ padding:18, gridRow:'1/3' }}>
            <CardLabel>Score Card</CardLabel>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:6 }}>
              <GradeBadge grade={R.grade} size="lg" />
              <div>
                <div style={S.scoreBig}>Score: {R.score}%</div>
                <div style={{ fontSize:12, color:'var(--tx2)', marginTop:2 }}>{R.gradeTitle}</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
              {(R.signals||[]).map((s,i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:'var(--tx2)', marginBottom:4 }}>
                    <span>{s.name}</span><span>{s.score}%</span>
                  </div>
                  <ScoreBar value={s.score} color={sigColor(s.score)} />
                </div>
              ))}
            </div>
            <div style={S.verdict}>
              <p style={{ fontSize:12, color:'var(--tx2)', lineHeight:1.65 }}>{R.verdict}</p>
            </div>
            <button style={S.resetBtn} onClick={reset}>← New Analysis</button>
          </Card>

          <Card style={{ padding:14 }}>
            <CardLabel>Sentiment Analysis</CardLabel>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={[
                  { name:'Positive', value: sent.positive },
                  { name:'Neutral',  value: sent.neutral  },
                  { name:'Negative', value: sent.negative },
                ]} cx="50%" cy="50%" innerRadius={36} outerRadius={54} paddingAngle={3} dataKey="value">
                  {SENT_COLORS.map((c,i) => <Cell key={i} fill={c}/>)}
                </Pie>
                <Tooltip contentStyle={{ background:'var(--elev)', border:'1px solid var(--bdr)', borderRadius:8, fontSize:12 }} formatter={v=>`${v}%`}/>
              </PieChart>
            </ResponsiveContainer>
            {[['Positive',sent.positive,'#3fb950'],['Neutral',sent.neutral,'#8b949e'],['Negative',sent.negative,'#f85149']].map(([l,v,c]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 0', borderTop:'1px solid var(--bdr)' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:c, flexShrink:0 }}/>
                <span style={{ flex:1, fontSize:12 }}>{l}</span>
                <span style={{ fontSize:12, fontWeight:600, color:c }}>{v}%</span>
              </div>
            ))}
          </Card>

          <Card>
            <div style={{ padding:'14px 14px 10px' }}><CardLabel>Flagged Suspicious Findings</CardLabel></div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'0 14px 14px' }}>
              {(R.findings||[]).filter(f=>f.type!=='good').slice(0,3).map((f,i) => (
                <div key={i} style={{ background:'var(--elev)', border:'1px solid var(--bdr)', borderLeft:`2.5px solid ${i===0?'var(--red)':'var(--yel)'}`, borderRadius:'var(--r)', padding:'9px 11px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12, color:'var(--yel)' }}>★★★★☆</span>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20, background:i===0?'var(--red-d)':'var(--yel-d)', color:i===0?'var(--red)':'var(--yel)', border:`1px solid ${i===0?'rgba(248,81,73,0.3)':'rgba(210,153,34,0.3)'}` }}>⚠ {40+i*8}%</span>
                  </div>
                  <p style={{ fontSize:11.5, color:'var(--tx2)', lineHeight:1.5 }}>{f.text}</p>
                </div>
              ))}
              {(R.findings||[]).filter(f=>f.type!=='good').length===0 && (
                <p style={{ fontSize:13, color:'var(--grn)', padding:'8px 0' }}>✓ No suspicious patterns detected</p>
              )}
            </div>
          </Card>

          <Card style={{ padding:14 }}>
            <CardLabel>Fake Review Activity</CardLabel>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={R.fakeActivityData||[]} margin={{ top:8, right:8, left:-24, bottom:0 }}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3fb950" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3fb950" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bdr)" vertical={false}/>
                <XAxis dataKey="label" tick={{ fill:'var(--tx3)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'var(--tx3)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background:'var(--elev)', border:'1px solid var(--bdr)', borderRadius:8, fontSize:11 }}/>
                <Area type="monotone" dataKey="value" stroke="#3fb950" strokeWidth={2} fill="url(#ag)" dot={{ fill:'#3fb950', r:3 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  )
}

const S = {
  empty:      { display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 24px', gap:12, textAlign:'center' },
  emptyShield:{ width:96, height:96, background:'var(--bg-elevated)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(63,185,80,0.06)', border:'1px solid rgba(63,185,80,0.15)' },
  emptyTitle: { fontFamily:'var(--fd)', fontWeight:700, fontSize:20 },
  emptySub:   { fontSize:13, color:'var(--tx2)', maxWidth:400, lineHeight:1.7 },
  ctaBtn:     { background:'linear-gradient(135deg,#2ea043,#3fb950)', color:'#fff', border:'none', borderRadius:'var(--r)', fontFamily:'var(--fd)', fontWeight:700, fontSize:13, padding:'10px 22px', cursor:'pointer' },
  secBtn:     { background:'var(--elev)', color:'var(--tx2)', border:'1px solid var(--bdr2)', borderRadius:'var(--r)', fontSize:13, padding:'10px 22px', cursor:'pointer' },
  grid:       { display:'grid', gridTemplateColumns:'1fr 260px', gap:14 },
  scoreBig:   { fontFamily:'var(--fd)', fontWeight:800, fontSize:22 },
  verdict:    { marginTop:14, padding:'10px 12px', background:'var(--elev)', borderRadius:'var(--r)', border:'1px solid var(--bdr)' },
  resetBtn:   { marginTop:12, width:'100%', padding:'8px', background:'var(--elev)', border:'1px solid var(--bdr2)', borderRadius:'var(--r)', color:'var(--tx2)', fontSize:12, cursor:'pointer', fontFamily:'var(--ff)' },
}
