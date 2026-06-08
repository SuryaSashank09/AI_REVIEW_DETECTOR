import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const analyzeReviews = (reviews, productUrl = '', listedRating = null) =>
  api.post('/analysis', { reviews, productUrl, listedRating }).then(r => r.data)

export const scrapeUrl = (url) =>
  api.post('/scrape', { url }).then(r => r.data)

export const getHistory = () =>
  api.get('/history').then(r => r.data)

export const deleteAnalysis = (id) =>
  api.delete(`/history/${id}`).then(r => r.data)

export default api
