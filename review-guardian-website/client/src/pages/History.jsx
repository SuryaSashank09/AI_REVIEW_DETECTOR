import { useEffect, useState } from 'react'
import { Trash2, RefreshCw, Clock, ChevronRight, X } from 'lucide-react'
import { getHistory, deleteAnalysis } from '../utils/api'
import { Card, CardLabel, GradeBadge, ScoreBar } from '../components/ui/index.jsx'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'

const gradeColor = g => ({ A:'var(--grn)', B:'var(--blu)', C:'var(--yel)', D:'#e3702a', F:'var(--red)' }[g] || '#888')
const sigColor   = s => s > 70 ? 'var(--grn)' : s > 45 ? 'var(--yel)' : 'var(--red)'
const SENT_COLORS = ['#3fb950', '#8b949e', '#f85149']

function normSent(sb) {
  const p=Math.max(0,Math.round(sb?.positive??70)), n=Math.max(0,Math.round(sb?.neutral??20)), g=Math.max(0,Math.round(sb?.negative??10))
  const t=p+n+g||100
  const fp=Math.round((p/t)*100), fn=Math.round((n/t)*100)
  return { positive:fp, neutral:fn, negative:Math.max(0,100-fp-fn) }
}

function FullReport({ item, onClose }) {
  const sent = normSent(item.sentimentBreakdown)
  return (
    <div style={RS.overlay}>
      <div style={RS.panel}>
        {/* Header */}
        <div style={RS.header}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <GradeBadge grade={item.grade} size="lg" />
            <div>
              <div style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:20 }}>Trust Score: {item.score}/100</div>
              <div style={{ fontSize:13, fontWeight:600, marginTop:2 }}>{item.gradeTitle}</div>
              <div style={{ fontSize:12, color:'var(--tx2)', marginTop:2 }}>{item.gradeSubtitle}</div>
            </div>
          </div>
          <button onClick={onClose} style={RS.closeBtn}><X size={16}/></button>
        </div>

        <div style={RS.body}>
          {/* Meta */}
          <div style={RS.metaRow}>
            <span style={{ fontSize:12, color:'var(--tx3)' }}>
              {item.productUrl ? `URL: ${item.productUrl.slice(0,60)}…` : 'Manual Analysis'}
            </span>
            <span style={{ fontSize:12, color:'var(--tx3)' }}>
              {item.reviewCount} reviews · {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Signal cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10, marginBottom:16 }}>
            {(item.signals||[]).map((s,i) => (
              <Card key={i} style={{ padding:12 }}>
                <div style={{ fontSize:10, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.name}</div>
                <div style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:24, color:sigColor(s.score), margin:'3px 0 4px' }}>{s.score}</div>
                <div style={{ fontSize:11, color:'var(--tx2)', lineHeight:1.4, marginBottom:6 }}>{s.description}</div>
                <ScoreBar value={s.score} color={sigColor(s.score)} />
              </Card>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:12, marginBottom:16 }}>
            <Card style={{ padding:12 }}>
              <CardLabel>Sentiment</CardLabel>
              <ResponsiveContainer width="100%" height={110}>
                <PieChart>
                  <Pie data={[
                    {name:'Positive',value:sent.positive},
                    {name:'Neutral', value:sent.neutral},
                    {name:'Negative',value:sent.negative},
                  ]} cx="50%" cy="50%" innerRadius={28} outerRadius={44} paddingAngle={3} dataKey="value">
                    {SENT_COLORS.map((c,i)=><Cell key={i} fill={c}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background:'var(--elev)', border:'1px solid var(--bdr)', borderRadius:6, fontSize:11 }} formatter={v=>`${v}%`}/>
                </PieChart>
              </ResponsiveContainer>
              {[['Pos',sent.positive,'#3fb950'],['Neu',sent.neutral,'#8b949e'],['Neg',sent.negative,'#f85149']].map(([l,v,c])=>(
                <div key={l} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 0', borderTop:'1px solid var(--bdr)', fontSize:11 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:c, flexShrink:0 }}/>
                  <span style={{ flex:1, color:'var(--tx2)' }}>{l}</span>
                  <span style={{ fontWeight:600, color:c }}>{v}%</span>
                </div>
              ))}
            </Card>
            <Card style={{ padding:12 }}>
              <CardLabel>Fake Activity</CardLabel>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={item.fakeActivityData||[]} margin={{ top:8,right:8,left:-24,bottom:0 }}>
                  <defs>
                    <linearGradient id="hag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3fb950" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3fb950" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bdr)" vertical={false}/>
                  <XAxis dataKey="label" tick={{ fill:'var(--tx3)', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'var(--tx3)', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ background:'var(--elev)', border:'1px solid var(--bdr)', borderRadius:6, fontSize:11 }}/>
                  <Area type="monotone" dataKey="value" stroke="#3fb950" strokeWidth={2} fill="url(#hag)" dot={{ fill:'#3fb950', r:2 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Findings */}
          <Card style={{ padding:14, marginBottom:12 }}>
            <CardLabel>Key Findings</CardLabel>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(item.findings||[]).map((f,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, background:'var(--elev)', borderRadius:'var(--r)', padding:'9px 12px', borderLeft:`3px solid ${f.type==='good'?'var(--grn)':f.type==='bad'?'var(--red)':'var(--yel)'}` }}>
                  <span style={{ fontSize:13 }}>{f.type==='good'?'✓':f.type==='bad'?'✗':'⚠'}</span>
                  <span style={{ fontSize:12.5, lineHeight:1.5 }}>{f.text}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Verdict */}
          <Card style={{ padding:14 }}>
            <CardLabel>AI Verdict</CardLabel>
            <p style={{ fontSize:13, color:'var(--tx2)', lineHeight:1.7 }}>{item.verdict}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function History() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [selected, setSelected] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try { setItems(await getHistory()) }
    catch { setError('Could not load history. Make sure the backend and MongoDB are running.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!confirm('Delete this analysis?')) return
    try { await deleteAnalysis(id); setItems(p=>p.filter(i=>i._id!==id)) }
    catch { alert('Could not delete.') }
  }

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:64, gap:10 }}>
      <div style={{ width:36, height:36, border:'3px solid var(--bdr2)', borderTopColor:'var(--grn)', borderRadius:'50%', animation:'spin .75s linear infinite' }}/>
      <p style={{ fontSize:13, color:'var(--tx2)' }}>Loading history…</p>
    </div>
  )

  return (
    <div>
      {/* Full report modal */}
      {selected && <FullReport item={selected} onClose={() => setSelected(null)} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontSize:13, color:'var(--tx2)' }}>{items.length} saved {items.length===1?'analysis':'analyses'} — click any card to view full report</span>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--elev)', border:'1px solid var(--bdr)', borderRadius:'var(--r)', color:'var(--tx2)', fontSize:12, padding:'6px 11px', cursor:'pointer' }}>
          <RefreshCw size={12}/> Refresh
        </button>
      </div>

      {error && <Card style={{ padding:14, marginBottom:14, color:'var(--red)', fontSize:13 }}>⚠ {error}</Card>}

      {items.length === 0 && !error ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'72px 24px', gap:8 }}>
          <p style={{ fontSize:30 }}>📭</p>
          <p style={{ fontFamily:'var(--fd)', fontWeight:700, fontSize:16 }}>No history yet</p>
          <p style={{ fontSize:13, color:'var(--tx2)' }}>Analyses are saved automatically after each run.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:12 }}>
          {items.map(item => (
            <Card key={item._id} style={{ padding:14, cursor:'pointer', transition:'border-color .15s', ':hover':{ borderColor:'var(--bdr2)' } }}
              onClick={() => setSelected(item)}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:9 }}>
                <GradeBadge grade={item.grade} size="sm" />
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.productUrl ? item.productUrl.replace(/https?:\/\/(www\.)?/,'').slice(0,40)+'…' : 'Manual Analysis'}
                  </div>
                  <div style={{ fontSize:11, color:'var(--tx3)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.reviewSnippet||'—'}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button onClick={e=>handleDelete(e,item._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--tx3)', padding:4, borderRadius:4 }}>
                    <Trash2 size={13}/>
                  </button>
                  <ChevronRight size={14} color="var(--tx3)"/>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--tx2)', marginTop:8 }}>
                <span style={{ fontWeight:700, color:gradeColor(item.grade) }}>{item.score}%</span>
                <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--tx3)' }}/>
                <span>{item.reviewCount} reviews</span>
                <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--tx3)' }}/>
                <Clock size={10}/>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

const RS = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'24px 16px', overflowY:'auto' },
  panel:   { background:'var(--bg-surface,var(--surf))', border:'1px solid var(--bdr2)', borderRadius:16, width:'100%', maxWidth:820, flexShrink:0 },
  header:  { display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'18px 20px', borderBottom:'1px solid var(--bdr)' },
  closeBtn:{ background:'var(--elev)', border:'1px solid var(--bdr)', borderRadius:'var(--r)', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--tx2)', flexShrink:0 },
  body:    { padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:0 },
  metaRow: { display:'flex', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:6 },
}
