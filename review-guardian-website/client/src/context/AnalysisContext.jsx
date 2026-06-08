import { createContext, useContext, useState } from 'react'
import { analyzeReviews, scrapeUrl } from '../utils/api'

const Ctx = createContext(null)

const STEPS = [
  'Extracting review text…',
  'Running linguistic analysis…',
  'Detecting sentiment patterns…',
  'Checking bot behavior signals…',
  'Computing Trust Grade…',
]

export function AnalysisProvider({ children }) {
  const [result, setResult]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [step, setStep]             = useState(0)
  const [scraping, setScraping]     = useState(false)
  const [listedRating, setListedRating] = useState(null)
  const [isUrlAnalysis, setIsUrlAnalysis] = useState(false)

  async function analyze(reviews, productUrl = '', rating = null) {
    setLoading(true); setError(null); setResult(null); setStep(0)
    const iv = setInterval(() => setStep(s => s < STEPS.length - 1 ? s + 1 : s), 700)
    try {
      const data = await analyzeReviews(reviews, productUrl, rating)
      clearInterval(iv); setStep(STEPS.length)
      setResult(data)
    } catch (e) {
      clearInterval(iv)
      setError(e.response?.data?.error || 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  async function analyzeFromUrl(url) {
    setScraping(true); setError(null); setResult(null)
    setIsUrlAnalysis(true); setListedRating(null)
    try {
      const scraped = await scrapeUrl(url)
      setListedRating(scraped.rating || null)
      await analyze(scraped.reviewText, url, scraped.rating)
    } catch (e) {
      const msg = e.response?.data?.error || 'Could not fetch this page. Please copy-paste the reviews manually.'
      setError(msg)
      setIsUrlAnalysis(false)
    } finally { setScraping(false) }
  }

  function reset() {
    setResult(null); setError(null); setStep(0)
    setListedRating(null); setIsUrlAnalysis(false)
  }

  return (
    <Ctx.Provider value={{ result, loading, error, step, STEPS, analyze, analyzeFromUrl, reset, scraping, listedRating, isUrlAnalysis }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAnalysis = () => useContext(Ctx)
