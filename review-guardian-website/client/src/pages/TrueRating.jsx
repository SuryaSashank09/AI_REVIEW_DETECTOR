import { useAnalysis } from '../context/AnalysisContext'
import { useNavigate } from 'react-router-dom'
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardLabel, ScoreBar } from '../components/ui/index.jsx'

function sigColor(s) { return s > 70 ? 'var(--grn)' : s > 45 ? 'var(--yel)' : 'var(--red)' }

export default function TrueRating() {
  const { result, listedRating, isUrlAnalysis } = useAnalysis()
  const navigate = useNavigate()

  if (!result) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'72px 24px', gap:10 }}>
      <BarChart3 size={38} color="var(--tx3)" />
      <p style={{ fontFamily:'var(--fd)', fontWeight:700, fontSize:17 }}>No analysis loaded</p>
      <p style={{ fontSize:13, color:'var(--tx2)' }}>Run an analysis first to see the true adjusted rating.</p>
      <button onClick={() => navigate('/analyze')} style={{ marginTop:6, background:'linear-gradient(135deg,#2ea043,#3fb950)', color:'#fff', border:'none', borderRadius:'var(--r)', fontFamily:'var(--fd)', fontWeight:700, fontSize:13, padding:'10px 22px', cursor:'pointer' }}>
        Go to Analyze →
      </button>
    </div>
  )

  const fakeRatio  = (100 - result.score) / 100
  // Use real scraped rating if available, else estimate from score
  const rawRating  = listedRating || (isUrlAnalysis ? null : null)
  const adjusted   = rawRating
    ? Math.max(1, rawRating - fakeRatio * rawRating * 0.4).toFixed(1)
    : null
  const removedPct = Math.round(fakeRatio * 100)

  const hasRating = rawRating !== null && isUrlAnalysis

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns: hasRating ? '1fr 260px' : '1fr', gap:14 }}>

        {/* True Rating Card — only show if URL analysis with real rating */}
        {hasRating && (
          <Card style={{ padding:18 }}>
            <CardLabel>True Adjusted Rating</CardLabel>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:18 }}>
              <span style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:52, lineHeight:1 }}>{adjusted}</span>
              <div>
                <div style={{ color:'#d29922', fontSize:22, letterSpacing:2 }}>
                  {'★'.repeat(Math.round(parseFloat(adjusted)))}{'☆'.repeat(5-Math.round(parseFloat(adjusted)))}
                </div>
                <p style={{ fontSize:11.5, color:'var(--tx3)', marginTop:5 }}>
                  After adjusting for ~{removedPct}% suspicious reviews
                </p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:14, background:'var(--elev)', borderRadius:'var(--r)', padding:'12px 14px', border:'1px solid var(--bdr)' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10.5, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>Listed Rating</div>
                <div style={{ fontFamily:'var(--fd)', fontWeight:700, fontSize:20 }}>{rawRating} ★</div>
              </div>
              <TrendingDown size={18} color="var(--red)" />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10.5, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>True Rating</div>
                <div style={{ fontFamily:'var(--fd)', fontWeight:700, fontSize:20, color:'var(--grn)' }}>{adjusted} ★</div>
              </div>
            </div>
          </Card>
        )}

        {/* Manual analysis — no rating comparison, just authenticity */}
        {!hasRating && (
          <Card style={{ padding:18 }}>
            <CardLabel>Authenticity Score</CardLabel>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
              <span style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:52, lineHeight:1, color: sigColor(result.score) }}>{result.score}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:16, color: sigColor(result.score) }}>{result.gradeTitle}</div>
                <p style={{ fontSize:12, color:'var(--tx2)', marginTop:4, lineHeight:1.5 }}>
                  {result.gradeSubtitle}
                </p>
                <p style={{ fontSize:11, color:'var(--tx3)', marginTop:6 }}>
                  ℹ️ Listed rating comparison is only available when analyzing via URL
                </p>
              </div>
            </div>
            <div style={{ background:'var(--elev)', borderRadius:'var(--r)', padding:'10px 14px', border:'1px solid var(--bdr)', fontSize:12, color:'var(--tx2)', lineHeight:1.6 }}>
              To see Listed vs True Rating comparison, paste the product URL in the <strong style={{color:'var(--grn)'}}>Dashboard</strong> URL bar.
            </div>
          </Card>
        )}

        {/* Composition donut */}
        <Card style={{ padding:14 }}>
          <CardLabel>Review Composition</CardLabel>
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="45%" outerRadius="80%"
              data={[{ name:'Authentic', value:result.score, fill:'var(--grn)' }, { name:'Suspicious', value:100-result.score, fill:'var(--red)' }]}
              startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={4}/>
              <Tooltip contentStyle={{ background:'var(--elev)', border:'1px solid var(--bdr)', borderRadius:8, fontSize:12 }}/>
            </RadialBarChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 0', borderTop:'1px solid var(--bdr)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--grn)' }}/>
            <span style={{ flex:1, fontSize:12 }}>Authentic</span>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--grn)' }}>{result.score}%</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 0', borderTop:'1px solid var(--bdr)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--red)' }}/>
            <span style={{ flex:1, fontSize:12 }}>Suspicious</span>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--red)' }}>{100-result.score}%</span>
          </div>
        </Card>
      </div>

      {/* Signal Breakdown */}
      <Card style={{ padding:18 }}>
        <CardLabel>Signal Breakdown</CardLabel>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {(result.signals||[]).map((s,i) => (
            <div key={i}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{s.name}</span>
                <span style={{ fontSize:13, fontWeight:700, color:sigColor(s.score) }}>{s.score}/100</span>
                <span style={{ fontSize:11, color:'var(--tx3)', background:'var(--elev)', padding:'2px 7px', borderRadius:4, border:'1px solid var(--bdr)' }}>×{s.weight}%</span>
              </div>
              <ScoreBar value={s.score} height={6} color={sigColor(s.score)}/>
              <p style={{ fontSize:11.5, color:'var(--tx3)', marginTop:4 }}>{s.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding:18 }}>
        <CardLabel>AI Verdict</CardLabel>
        <p style={{ fontSize:13.5, color:'var(--tx2)', lineHeight:1.7 }}>{result.verdict}</p>
      </Card>
    </div>
  )
}
