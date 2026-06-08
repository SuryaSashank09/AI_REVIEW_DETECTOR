import { useAnalysis } from '../context/AnalysisContext'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Card, CardLabel } from '../components/ui/index.jsx'

export default function SuspiciousReviews() {
  const { result } = useAnalysis()
  const navigate   = useNavigate()

  if (!result) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'72px 24px', gap:10 }}>
      <ShieldAlert size={38} color="var(--tx3)" />
      <p style={{ fontFamily:'var(--fd)', fontWeight:700, fontSize:17 }}>No analysis loaded</p>
      <p style={{ fontSize:13, color:'var(--tx2)' }}>Run an analysis first to see suspicious details.</p>
      <button onClick={() => navigate('/analyze')} style={{ marginTop:6, background:'linear-gradient(135deg,#2ea043,#3fb950)', color:'#fff', border:'none', borderRadius:'var(--r)', fontFamily:'var(--fd)', fontWeight:700, fontSize:13, padding:'10px 22px', cursor:'pointer' }}>
        Go to Analyze →
      </button>
    </div>
  )

  const bad = (result.findings||[]).filter(f => f.type !== 'good')

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <Card style={{ display:'flex', padding:'14px 24px', gap:0 }}>
        {[['Suspicious Signals', bad.length, 'var(--tx)'],['Trust Grade', result.grade, `var(--grn)`],['Authenticity', result.score + '%', 'var(--tx)']].map(([l,v,c],i) => (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, borderRight: i<2?'1px solid var(--bdr)':'none' }}>
            <span style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:26, color:c }}>{v}</span>
            <span style={{ fontSize:10.5, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{l}</span>
          </div>
        ))}
      </Card>

      <CardLabel>Flagged Signals</CardLabel>
      {bad.length === 0 ? (
        <Card style={{ padding:28, textAlign:'center' }}>
          <p style={{ fontSize:26, marginBottom:8 }}>✅</p>
          <p style={{ fontWeight:600, color:'var(--grn)' }}>No suspicious patterns detected</p>
          <p style={{ fontSize:12, color:'var(--tx2)', marginTop:4 }}>These reviews appear authentic.</p>
        </Card>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {bad.map((f,i) => (
            <Card key={i} style={{ padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:7 }}>
                <div style={{ width:26, height:26, borderRadius:6, background:'var(--yel-d)', border:'1px solid rgba(210,153,34,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>⚠</div>
                <span style={{ flex:1, fontSize:13, fontWeight:600 }}>Suspicious Pattern #{i+1}</span>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20, background: f.type==='bad'?'var(--red-d)':'var(--yel-d)', color: f.type==='bad'?'var(--red)':'var(--yel)', border:`1px solid ${f.type==='bad'?'rgba(248,81,73,0.3)':'rgba(210,153,34,0.3)'}` }}>
                  {f.type==='bad'?'High Risk':'Medium Risk'}
                </span>
              </div>
              <p style={{ fontSize:12.5, color:'var(--tx2)', lineHeight:1.6, paddingLeft:35 }}>{f.text}</p>
            </Card>
          ))}
        </div>
      )}

      <CardLabel>All Findings</CardLabel>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {(result.findings||[]).map((f,i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, background:'var(--surf)', border:'1px solid var(--bdr)', borderLeft:`3px solid ${f.type==='good'?'var(--grn)':f.type==='bad'?'var(--red)':'var(--yel)'}`, borderRadius:'var(--r)', padding:'10px 12px' }}>
            <span>{f.type==='good'?'✓':f.type==='bad'?'✗':'⚠'}</span>
            <span style={{ fontSize:13, lineHeight:1.5 }}>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
