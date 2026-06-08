import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, ScanSearch, X } from 'lucide-react'
import { useAnalysis } from '../context/AnalysisContext'
import { Card, CardLabel, GradeBadge, ScoreBar, LoadingOverlay, ErrorBox } from '../components/ui/index.jsx'

function sigColor(s) { return s > 70 ? 'var(--grn)' : s > 45 ? 'var(--yel)' : 'var(--red)' }

const PLACEHOLDER = `Paste review TEXT here (copy from product page), one per line. Do NOT paste a URL.

Example:
This product is really good at this range. I would recommend it. The only problem is visibility from one angle.
Beautiful lightweight table clock, works perfectly.
Amazing product! Exceeded all expectations.`

export default function AnalyzeProduct() {
  const { analyze, loading, step, STEPS, result, error, reset } = useAnalysis()
  const [tab, setTab]         = useState('paste')
  const [text, setText]       = useState('')
  const [csvRows, setCsvRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [localErr, setLocalErr] = useState('')
  const fileRef = useRef()
  const navigate = useNavigate()

  function processCSV(file) {
    const reader = new FileReader()
    reader.onload = e => {
      const lines = e.target.result.split('\n').filter(Boolean)
      if (lines.length < 2) { setLocalErr('CSV needs a header + at least one row.'); return }
      const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
      const col = header.findIndex(h => h.includes('review') || h.includes('text') || h.includes('comment'))
      if (col === -1) { setLocalErr('CSV needs a column called "review", "text", or "comment".'); return }
      const rows = lines.slice(1).map(l => l.split(',')[col]?.replace(/"/g, '').trim()).filter(r => r?.length > 5)
      setCsvRows(rows); setFileName(file.name); setLocalErr('')
    }
    reader.readAsText(file)
  }

  async function handleSubmit() {
    setLocalErr('')
    const reviews = tab === 'paste' ? text.trim() : csvRows.join('\n')
    if (!reviews) { setLocalErr('Please add some reviews first.'); return }
    if (reviews.startsWith('http') && !reviews.includes('\n') && reviews.split(' ').length < 5) {
      setLocalErr('Please paste the actual review text, not a URL. Copy the reviews from the product page.')
      return
    }
    await analyze(reviews)
  }

  if (loading) return <Card><LoadingOverlay step={step} steps={STEPS} /></Card>

  if (result) return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <Card style={{ padding:18 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
          <GradeBadge grade={result.grade} size="lg" />
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:22 }}>Trust Score: {result.score}/100</div>
            <div style={{ fontWeight:600, fontSize:14, marginTop:2 }}>{result.gradeTitle}</div>
            <div style={{ fontSize:12, color:'var(--tx2)', marginTop:2 }}>{result.gradeSubtitle}</div>
          </div>
          <button onClick={reset} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--elev)', border:'1px solid var(--bdr)', borderRadius:'var(--r)', color:'var(--tx2)', fontSize:12, padding:'7px 12px', cursor:'pointer' }}>
            <X size={13}/> New Analysis
          </button>
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
        {(result.signals||[]).map((s,i) => (
          <Card key={i} style={{ padding:14 }}>
            <div style={{ fontSize:10.5, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.name}</div>
            <div style={{ fontFamily:'var(--fd)', fontWeight:800, fontSize:26, margin:'4px 0', color:sigColor(s.score) }}>{s.score}</div>
            <div style={{ fontSize:11.5, color:'var(--tx2)', lineHeight:1.45, marginBottom:8 }}>{s.description}</div>
            <ScoreBar value={s.score} color={sigColor(s.score)} />
          </Card>
        ))}
      </div>

      <Card style={{ padding:18 }}>
        <CardLabel>Key Findings</CardLabel>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {(result.findings||[]).map((f,i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, background:'var(--elev)', borderRadius:'var(--r)', padding:'10px 12px', borderLeft:`3px solid ${f.type==='good'?'var(--grn)':f.type==='bad'?'var(--red)':'var(--yel)'}` }}>
              <span>{f.type==='good'?'✓':f.type==='bad'?'✗':'⚠'}</span>
              <span style={{ fontSize:13, lineHeight:1.5 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding:18 }}>
        <CardLabel>AI Verdict</CardLabel>
        <p style={{ fontSize:13.5, color:'var(--tx2)', lineHeight:1.7 }}>{result.verdict}</p>
      </Card>

      <button onClick={() => navigate('/dashboard')} style={{ alignSelf:'flex-start', background:'var(--elev)', border:'1px solid var(--bdr2)', borderRadius:'var(--r)', color:'var(--tx2)', fontSize:13, padding:'9px 16px', cursor:'pointer' }}>
        View Full Dashboard →
      </button>
    </div>
  )

  return (
    <div style={{ maxWidth:680 }}>
      <Card>
        <div style={{ display:'flex', borderBottom:'1px solid var(--bdr)' }}>
          {['paste','csv'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'11px 16px', background:'none', border:'none', borderBottom:`2px solid ${tab===t?'var(--grn)':'transparent'}`, marginBottom:-1, color:tab===t?'var(--grn)':'var(--tx2)', fontSize:13, fontWeight:500, cursor:'pointer', transition:'all .15s' }}>
              {t==='paste' ? <><FileText size={13}/> Paste Reviews</> : <><Upload size={13}/> Upload CSV</>}
            </button>
          ))}
        </div>

        <div style={{ padding:18 }}>
          {tab === 'paste' ? (
            <>
              <label style={S.lbl}>Product Reviews</label>
              <textarea
                style={S.ta}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={PLACEHOLDER}
              />
              <p style={{ fontSize:11.5, color:'var(--tx3)', marginTop:6 }}>
                💡 Copy reviews from the product page and paste here. Paste 3–20 reviews for best accuracy.
              </p>
            </>
          ) : (
            <>
              <div style={S.dropZone}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); processCSV(e.dataTransfer.files[0]) }}>
                <Upload size={22} color="var(--tx3)" />
                <p style={{ fontSize:13, marginTop:8 }}>
                  <span style={{ color:'var(--grn)', fontWeight:600 }}>Click to upload</span> or drag & drop
                </p>
                <p style={{ fontSize:11.5, color:'var(--tx3)', marginTop:3 }}>
                  CSV with a "review", "text", or "comment" column
                </p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }}
                onChange={e => processCSV(e.target.files[0])} />
              {fileName && (
                <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--elev)', border:'1px solid var(--bdr)', borderRadius:'var(--r)', padding:'8px 11px', fontSize:12, marginTop:10 }}>
                  <FileText size={13}/><span style={{ flex:1 }}>{fileName}</span>
                  <span style={{ color:'var(--tx3)' }}>{csvRows.length} reviews</span>
                </div>
              )}
            </>
          )}

          <ErrorBox msg={localErr || error} />

          <button
            onClick={handleSubmit}
            style={{ ...S.submitBtn, opacity:(tab==='paste' ? text.trim() : csvRows.length > 0) ? 1 : 0.5 }}
          >
            <ScanSearch size={14}/> Analyze Reviews
          </button>
        </div>
      </Card>
    </div>
  )
}

const S = {
  lbl:      { display:'block', fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--tx3)', marginBottom:8 },
  ta:       { width:'100%', minHeight:200, background:'var(--elev)', border:'1px solid var(--bdr2)', borderRadius:'var(--r)', color:'var(--tx)', fontFamily:'var(--ff)', fontSize:13, lineHeight:1.6, padding:'11px 13px', resize:'vertical', outline:'none' },
  dropZone: { border:'2px dashed var(--bdr2)', borderRadius:'var(--rl)', padding:'32px 24px', textAlign:'center', cursor:'pointer', background:'var(--elev)' },
  submitBtn:{ width:'100%', marginTop:14, height:44, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#2ea043,#3fb950)', color:'#fff', border:'none', borderRadius:'var(--r)', fontFamily:'var(--fd)', fontWeight:700, fontSize:14, cursor:'pointer' },
}
