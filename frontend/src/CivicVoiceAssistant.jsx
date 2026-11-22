import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Languages, Mic, MicOff, Minus, Send, Square, Trash2, Volume2,
} from 'lucide-react'
import { request } from './api'
import { resolveVoiceNavigation } from './voiceNavigation'
import './CivicVoiceAssistant.css'

const LANGUAGE_OPTIONS = [
  { value: 'Auto', label: 'Auto detect', speech: '' },
  { value: 'English', label: 'English', speech: 'en-IN' },
  { value: 'Kannada', label: 'Kannada', speech: 'kn-IN' },
  { value: 'Hindi', label: 'Hindi', speech: 'hi-IN' },
  { value: 'Telugu', label: 'Telugu', speech: 'te-IN' },
  { value: 'Tamil', label: 'Tamil', speech: 'ta-IN' },
  { value: 'Malayalam', label: 'Malayalam', speech: 'ml-IN' },
  { value: 'Marathi', label: 'Marathi', speech: 'mr-IN' },
  { value: 'Bengali', label: 'Bengali', speech: 'bn-IN' },
  { value: 'Gujarati', label: 'Gujarati', speech: 'gu-IN' },
  { value: 'Punjabi', label: 'Punjabi', speech: 'pa-IN' },
  { value: 'Urdu', label: 'Urdu', speech: 'ur-IN' },
]

const PAGE_LABELS = {
  dashboard: 'the homepage',
  janavani: 'Janavani AI',
  'civic-eye': 'Civic Eye complaint and status page',
  'seva-agent': 'Seva Agent',
  'satya-check': 'Satya Check',
  'opportunity-hub': 'Scholarships and Opportunity Hub',
  'loan-connect': 'Loan Connect',
  'opportunity-radar': 'Opportunity Radar',
  'civic-brain': 'Civic Brain',
  'civic-docs': 'Civic Docs',
  'civic-alert': 'Civic Alert',
  bengaluru: 'Bengaluru 360',
  'travel-hub': 'Civic Travel & Booking Hub',
  'regional-status': 'Regional Status',
}

function browserLanguage(selected) {
  const option = LANGUAGE_OPTIONS.find((item) => item.value === selected)
  if (option?.speech) return option.speech
  return navigator.language || 'en-IN'
}

function detectLanguage(text) {
  if (/\p{Script=Kannada}/u.test(text)) return 'Kannada'
  if (/\p{Script=Devanagari}/u.test(text)) return 'Hindi'
  if (/\p{Script=Telugu}/u.test(text)) return 'Telugu'
  if (/\p{Script=Tamil}/u.test(text)) return 'Tamil'
  if (/\p{Script=Malayalam}/u.test(text)) return 'Malayalam'
  if (/\p{Script=Bengali}/u.test(text)) return 'Bengali'
  if (/\p{Script=Gujarati}/u.test(text)) return 'Gujarati'
  if (/\p{Script=Gurmukhi}/u.test(text)) return 'Punjabi'
  if (/\p{Script=Arabic}/u.test(text)) return 'Urdu'
  return 'English'
}

function estimateEmi(text) {
  const amounts = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*)/gi)
  if (!/emi|monthly|loan/.test(text.toLowerCase()) || !amounts?.length) return null
  const principal = Number(amounts[0].replace(/[₹,rsinr\s]/gi, ''))
  if (!Number.isFinite(principal) || principal <= 0) return null
  const rateMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:percent|%)/i)
  const yearMatch = text.match(/(\d+)\s*(?:year|years|yr)/i)
  const annualRate = rateMatch ? Number(rateMatch[1]) : 9
  const years = yearMatch ? Number(yearMatch[1]) : 5
  const months = years * 12
  const monthlyRate = annualRate / 1200
  const emi = monthlyRate === 0
    ? principal / months
    : principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1)
  return `A sample estimate is about ₹${Math.round(emi).toLocaleString('en-IN')} per month for ₹${principal.toLocaleString('en-IN')} at ${annualRate}% for ${years} years. This is an illustration, not a loan offer.`
}

export default function CivicVoiceAssistant({
  activePage,
  onNavigate,
  expanded,
  setExpanded,
  language,
  setLanguage,
  startRequest,
  navigationItems,
  onOpenProfile,
}) {
  const [history, setHistory] = useState(() => {
    return []
  })
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('idle')
  const [permissionMessage, setPermissionMessage] = useState('')
  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('civic-voice-language', language)
  }, [language])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [history, expanded])

  useEffect(() => {
    if (startRequest > 0) {
      setExpanded(true)
      startListening()
    }
    // startListening reads the current recognition state and is intentionally
    // triggered only by an explicit homepage voice request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startRequest])

  const supportedLanguages = useMemo(
    () => LANGUAGE_OPTIONS.filter((item) => item.value !== 'Auto').map((item) => item.label).join(', '),
    [],
  )

  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setStatus((current) => (current === 'speaking' ? 'idle' : current))
  }

  function speak(text, languageOverride = language) {
    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') {
      setPermissionMessage('Voice playback is not supported by this browser. Text answers are still available.')
      setStatus('idle')
      return
    }
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = browserLanguage(languageOverride)
      utterance.rate = 0.95
      utterance.onstart = () => setStatus('speaking')
      utterance.onend = () => setStatus('idle')
      utterance.onerror = () => {
        setStatus('idle')
        setPermissionMessage('Speech playback is unavailable. The text response is still available.')
      }
      window.speechSynthesis.speak(utterance)
    } catch {
      setStatus('idle')
      setPermissionMessage('Speech playback could not start. The text response is still available.')
    }
  }

  function stopListening() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }

  function startListening() {
    if (status === 'listening') {
      stopListening()
      setStatus('idle')
      return
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setPermissionMessage('Voice recognition is unavailable in this browser. Please use text chat or try Chrome or Edge.')
      setExpanded(true)
      return
    }
    stopSpeaking()
    const recognition = new Recognition()
    recognition.lang = browserLanguage(language)
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => {
      setPermissionMessage('')
      setStatus('listening')
    }
    recognition.onerror = (event) => {
      const denied = event.error === 'not-allowed' || event.error === 'service-not-allowed'
      setPermissionMessage(denied
        ? 'Microphone access was not granted. You can still use text chat.'
        : event.error === 'no-speech'
          ? 'No speech was detected. Try again or use text chat.'
          : 'Voice recognition stopped unexpectedly. Please try text chat.')
      setStatus('idle')
    }
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null
    }
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) sendMessage(transcript)
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      setPermissionMessage('Microphone could not start. Please check browser permission settings.')
      setStatus('idle')
    }
  }

  async function sendMessage(text = input) {
    const question = text.trim()
    if (!question || status === 'processing') return
    stopListening()
    setInput('')
    setPermissionMessage('')
    setStatus('processing')
    const updated = [...history, { role: 'user', text: question }]
    setHistory(updated)
    const responseLanguage = language === 'Auto' ? detectLanguage(question) : language

    const intent = resolveVoiceNavigation(question, navigationItems)
    if (intent.type === 'navigate') {
      const answer = `Taking you to ${intent.label}.`
      setHistory([...updated, { role: 'assistant', text: answer, navigation: intent.id }])
      onNavigate(intent.id)
      speak(answer)
      return
    }
    if (intent.type === 'portal') {
      const answer = `Opening the verified ${intent.label}.`
      setHistory([...updated, { role: 'assistant', text: `${answer} This is an external government website.`, source: intent.href }])
      const portalWindow = window.open(intent.href, '_blank', 'noopener,noreferrer')
      if (!portalWindow) window.location.assign(intent.href)
      speak(answer, responseLanguage)
      setStatus('idle')
      return
    }
    if (intent.type === 'clarify') {
      const answer = `I couldn't identify one page with confidence. Please say the exact page name, such as ${intent.candidates.slice(0, 3).join(', ')}.`
      setHistory([...updated, { role: 'assistant', text: answer }])
      setStatus('idle')
      return
    }
    if (intent.type === 'profile') {
      onOpenProfile()
      const answer = 'Opening your profile.'
      setHistory([...updated, { role: 'assistant', text: answer }])
      speak(answer)
      return
    }
    if (intent.type === 'auth') {
      const answer = intent.mode === 'login'
        ? 'You are already signed in. Log out from your profile menu to return to the login page.'
        : 'You are already signed in. Log out from your profile menu before registering another account.'
      setHistory([...updated, { role: 'assistant', text: answer }])
      setStatus('idle')
      speak(answer)
      return
    }

    const emiAnswer = estimateEmi(question)
    if (emiAnswer) {
      setHistory([...updated, { role: 'assistant', text: emiAnswer }])
      speak(emiAnswer)
      return
    }

    try {
      const result = await request('/chat', {
        method: 'POST',
        body: {
          message: question,
          language: responseLanguage,
          current_page: activePage,
          context: history.slice(-6).map((item) => `${item.role}: ${item.text}`).join('\n'),
        },
      })
      setHistory([...updated, { role: 'assistant', text: result.answer, source: result.source }])
      speak(result.answer)
    } catch (error) {
      const answer = error?.message && error.message !== 'Failed to fetch'
        ? error.message
        : 'Civic Voice AI cannot reach the assistant service. Please check your connection and make sure the backend is running.'
      setHistory([...updated, { role: 'assistant', text: answer }])
      setStatus('idle')
      setPermissionMessage(answer)
    }
  }

  function clearHistory() {
    stopSpeaking()
    stopListening()
    setHistory([])
    setInput('')
    setStatus('idle')
  }

  const statusLabel = {
    idle: 'Ready',
    listening: 'Listening',
    processing: 'Understanding',
    speaking: 'Speaking',
  }[status]

  if (!expanded) {
    return (
      <button
        className="civic-voice-fab"
        aria-label="Open CIVIC VOICE AI"
        title="CIVIC VOICE AI"
        onClick={() => setExpanded(true)}
      >
        <Mic size={22} />
        <span>Civic Voice</span>
      </button>
    )
  }

  return (
    <aside className="civic-voice-panel" aria-label="CIVIC VOICE AI assistant">
      <header className="civic-voice-header">
        <div className="civic-voice-brand">
          <span><Mic size={18} /></span>
          <div><b>CIVIC VOICE AI</b><small><i /> {statusLabel} · {PAGE_LABELS[activePage]}</small></div>
        </div>
        <div className="civic-voice-header-actions">
          <button onClick={clearHistory} title="Clear conversation" aria-label="Clear conversation"><Trash2 size={16} /></button>
          <button onClick={() => { stopSpeaking(); stopListening(); setExpanded(false) }} title="Minimize" aria-label="Minimize assistant"><Minus size={17} /></button>
        </div>
      </header>

      <div className="civic-voice-controls">
        <label><Languages size={14} /><select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Assistant language">
          {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select></label>
        <span>{supportedLanguages}</span>
      </div>

      <div className="civic-voice-history" aria-live="polite">
        {!history.length && (
          <div className="civic-voice-welcome">
            <Mic size={25} />
            <h3>How can I help you?</h3>
            <p>Ask in {language === 'Auto' ? 'your language' : language}, or say “Take me to Civic Docs AI.”</p>
          </div>
        )}
        {history.map((message, index) => (
          <div className={`civic-voice-message ${message.role}`} key={`${index}-${message.text.slice(0, 12)}`}>
            <p>{message.text}</p>
            {message.source && <small>{message.source}</small>}
          </div>
        ))}
        {(status === 'listening' || status === 'processing') && (
          <div className={`civic-voice-status ${status}`}>
            {status === 'listening' ? <div className="voice-waves"><i /><i /><i /><i /><i /></div> : <div className="voice-thinking"><i /><i /><i /></div>}
            <span>{status === 'listening' ? 'Listening…' : 'Understanding…'}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {permissionMessage && <p className="civic-voice-permission">{permissionMessage}</p>}

      <div className="civic-voice-actions">
        <button
          className={`civic-voice-mic ${status === 'listening' ? 'is-listening' : ''}`}
          onClick={startListening}
          aria-label={status === 'listening' ? 'Stop listening' : 'Start voice assistant'}
        >
          {status === 'listening' ? <MicOff size={19} /> : <Mic size={19} />}
        </button>
        {status === 'speaking'
          ? <button className="civic-voice-play" onClick={stopSpeaking} title="Stop speech" aria-label="Stop speech"><Square size={15} /></button>
          : <button className="civic-voice-play" onClick={() => {
              const latest = [...history].reverse().find((item) => item.role === 'assistant')
              if (latest) speak(latest.text)
            }} title="Play latest response" aria-label="Play latest response"><Volume2 size={16} /></button>}
      </div>

      <form className="civic-voice-compose" onSubmit={(event) => { event.preventDefault(); sendMessage() }}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type in any supported language..."
          aria-label="Message CIVIC VOICE AI"
        />
        <button type="submit" disabled={!input.trim() || status === 'processing'} aria-label="Send message"><Send size={16} /></button>
      </form>
    </aside>
  )
}
