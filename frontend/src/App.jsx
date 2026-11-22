import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDownRight, ArrowDownToLine, ArrowRight, ArrowUpRight, Bell, Bike, Bookmark, Bot,
  Briefcase, Building2, BusFront, Check, CheckCheck, ChevronDown, ChevronRight, CircleHelp,
  Clock3, CloudSun, ExternalLink, FileCheck2, FileText, Filter, Flag, Globe2, GraduationCap,
  HandCoins, HeartPulse, Home, Landmark, LayoutDashboard, Leaf, Lightbulb, ListChecks, LoaderCircle, MapPin,
  Menu, MessageCircle, Moon, MoreHorizontal,
  Mic, RefreshCw, Search, Send, ShieldCheck, Siren, Sparkles, Sun, TrainFront, TrendingUp,
  WalletCards, X,
} from 'lucide-react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'
import { API_BASE, ApiError, request } from './api'
import CivicVoiceAssistant from './CivicVoiceAssistant'

const BBMP_INFO_URL = 'https://www.karnatakaone.gov.in/'
const BBMP_PROPERTY_TAX_URL = 'https://bbmptax.karnataka.gov.in/'
const BBMP_TAX_CENTERS_URL = 'https://www.karnatakaone.gov.in/Info/Public/BBMPPTCenters'
const BBMP_TAX_GRIEVANCE_URL = 'https://bbmptax.karnataka.gov.in/Forms/grievancesreq.aspx'
const KARNATAKA_ONE_URL = 'https://www.karnatakaone.gov.in/'
const KARNATAKA_IPGRS_URL = 'https://ipgrs.karnataka.gov.in/Citizens/GrievanceSelfService'
const SEVA_SINDHU_URL = 'https://sevasindhu.karnataka.gov.in/'

const modules = [
  { id: 'dashboard', label: 'Overview', icon: Home, group: 'Workspace' },
  { id: 'janavani', label: 'Janavani AI', icon: MessageCircle, group: 'Citizen services', color: 'violet', desc: 'Government answers, made clear.' },
  { id: 'civic-eye', label: 'Civic Eye', icon: MapPin, group: 'Citizen services', color: 'orange', desc: 'Report it. Track it. Improve it.' },
  { id: 'seva-agent', label: 'Seva Agent', icon: ListChecks, group: 'Citizen services', color: 'blue', desc: 'Get ready for your next application.' },
  { id: 'satya-check', label: 'Satya Check', icon: ShieldCheck, group: 'Citizen services', color: 'green', desc: 'Pause, check the source, then act.' },
  { id: 'opportunity-hub', label: 'Opportunity Hub', icon: GraduationCap, group: 'Discover', color: 'blue', desc: 'Find schemes that fit your journey.' },
  { id: 'loan-connect', label: 'Loan Connect', icon: HandCoins, group: 'Discover', color: 'green', desc: 'Understand options before you borrow.' },
  { id: 'opportunity-radar', label: 'Opportunity Radar', icon: TrendingUp, group: 'Discover', color: 'orange', desc: 'Keep an eye on official updates.' },
  { id: 'civic-brain', label: 'Civic Brain', icon: Sparkles, group: 'Discover', color: 'violet', desc: 'Search across citizen services.' },
  { id: 'civic-docs', label: 'Civic Docs AI', icon: FileCheck2, group: 'My services', color: 'blue', desc: 'Simple checklists for documents.' },
  { id: 'civic-alert', label: 'Civic Alert', icon: Bell, group: 'My services', color: 'orange', desc: 'Your reminders, all in one place.' },
  { id: 'bengaluru', label: 'Bengaluru 360', icon: Building2, group: 'My services', color: 'green', desc: 'Local transport and city services.' },
  { id: 'travel-hub', label: 'Travel & Booking', icon: Globe2, group: 'Discover', color: 'green', desc: 'Explore destinations and official booking portals.' },
  { id: 'regional-status', label: 'Regional Status', icon: CloudSun, group: 'My services', color: 'blue', desc: 'Explore regions and source-labelled updates.' },
  { id: 'gov-jobs', label: 'Recruitment Radar', icon: Briefcase, group: 'Discover', color: 'orange', desc: 'Government jobs & exam notifications.' },
  { id: 'land-property', label: 'Land & Property', icon: Home, group: 'Citizen services', color: 'green', desc: 'Land records, mutation and property services.' },
  { id: 'health-services', label: 'Health Services', icon: HeartPulse, group: 'Citizen services', color: 'orange', desc: 'Government hospitals and health schemes.' },
  { id: 'agri-services', label: 'Farmer Services', icon: Leaf, group: 'Discover', color: 'green', desc: 'Agriculture schemes, subsidies and crop services.' },
  { id: 'business-hub', label: 'Business Hub', icon: TrendingUp, group: 'Discover', color: 'blue', desc: 'Startup, MSME, tenders and government procurement.' },
  { id: 'karnataka-dir', label: 'Karnataka Services', icon: Landmark, group: 'Citizen services', color: 'blue', desc: 'Complete Karnataka government services directory.' },
  { id: 'app-tracker', label: 'Application Tracker', icon: ListChecks, group: 'My services', color: 'violet', desc: 'Track all your government applications.' },
  { id: 'opp-dashboard', label: 'Opportunity Dashboard', icon: LayoutDashboard, group: 'Discover', color: 'violet', desc: 'All schemes, jobs & opportunities in one place.' },
]

const schemes = [
  { id: 'nsp', title: 'National Scholarship Portal', type: 'Scholarship', audience: 'Students', description: 'Explore central and participating state scholarship opportunities in one official portal.', source: 'National Scholarship Portal', href: 'https://scholarships.gov.in/', alternateHref: 'https://ssp.karnataka.gov.in/', alternateLabel: 'Karnataka SSP alternative', icon: GraduationCap, tag: 'Student life' },
  { id: 'ssp', title: 'Karnataka SSP', type: 'Scholarship', audience: 'Students', description: 'Check Karnataka post-matric scholarship services and current application information.', source: 'Karnataka SSP', href: 'https://ssp.karnataka.gov.in/', icon: Landmark, tag: 'Karnataka' },
  { id: 'myscheme', title: 'myScheme discovery', type: 'Government scheme', audience: 'Everyone', description: 'Use the government scheme finder to explore programmes based on your profile.', source: 'myScheme', href: 'https://www.myscheme.gov.in/', icon: Globe2, tag: 'Find a fit' },
  { id: 'jansamarth', title: 'JanSamarth credit-linked schemes', type: 'Loan & subsidy', audience: 'Entrepreneurs', description: 'Explore eligible government credit-linked schemes and application guidance.', source: 'JanSamarth', href: 'https://www.jansamarth.in/', icon: HandCoins, tag: 'Small business' },
  { id: 'pmkisan', title: 'PM-KISAN information', type: 'Government scheme', audience: 'Farmers', description: 'Visit the official portal for current programme details and eligibility rules.', source: 'PM-KISAN', href: 'https://pmkisan.gov.in/', icon: Leaf, tag: 'Agriculture' },
  { id: 'mudra', title: 'MUDRA loan information', type: 'Loan & subsidy', audience: 'Entrepreneurs', description: 'Review official guidance about micro-enterprise credit through the government portal.', source: 'MUDRA', href: 'https://www.mudra.org.in/', icon: WalletCards, tag: 'Small business' },
]

const documents = [
  { name: 'Aadhaar', category: 'Identity', authority: 'UIDAI', href: 'https://uidai.gov.in/', steps: ['Choose the relevant update or enrolment service.', 'Review the current proof-of-identity and address requirements.', 'Complete identity verification only on the official UIDAI portal.'] },
  { name: 'PAN card', category: 'Identity', authority: 'Income Tax India', href: 'https://www.incometax.gov.in/iec/foportal/', steps: ['Select new PAN or correction guidance.', 'Prepare the identity, address and date-of-birth proofs requested.', 'Use only the official Income Tax portal or its authorised service links.'] },
  { name: 'Driving licence', category: 'Transport', authority: 'Parivahan', href: 'https://parivahan.gov.in/parivahan/', steps: ['Choose Driving Licence Related Services on the Parivahan portal.', 'Select your state in the Sarathi service.', 'Check the applicable learner or driving licence checklist and appointment options.'] },
  { name: 'Voter ID', category: 'Identity', authority: 'Election Commission of India', href: 'https://voters.eci.gov.in/', steps: ['Choose registration, correction or address change.', 'Keep your current residence and age proofs ready.', 'Submit or track the request through the ECI voter portal.'] },
  { name: 'Passport', category: 'Travel', authority: 'Passport Seva', href: 'https://www.passportindia.gov.in/', steps: ['Review the correct application category and document list.', 'Complete the application on Passport Seva.', 'Follow the appointment and police-verification instructions shown there.'] },
  { name: 'Birth certificate', category: 'Certificates', authority: 'Karnataka Seva Sindhu / BBMP', href: SEVA_SINDHU_URL, alternateHref: BBMP_INFO_URL, alternateLabel: 'BBMP information and ward services', steps: ['Identify whether the birth was registered in Bengaluru and which BBMP/municipal authority is relevant.', 'Open Seva Sindhu and locate the current birth certificate or civil-registration service.', 'Prepare the hospital record, parent identity and address proofs requested by the issuing authority.', 'Submit only through the official portal or ward office and retain the acknowledgement.'] },
  { name: 'Death certificate', category: 'Certificates', authority: 'Karnataka Seva Sindhu / BBMP', href: SEVA_SINDHU_URL, alternateHref: BBMP_INFO_URL, alternateLabel: 'BBMP information and ward services', steps: ['Identify the registrar that serves the place of death or residence.', 'Open Seva Sindhu and locate the current death certificate or civil-registration service.', 'Prepare the medical, identification and address documents listed for the specific service.', 'Submit through the official portal or registrar and retain the acknowledgement.'] },
  { name: 'Income certificate', category: 'Certificates', authority: 'Karnataka Government', href: 'https://karnataka.gov.in/', steps: ['Open the Karnataka citizen services portal and choose the certificate service.', 'Confirm current supporting documents and fees with the issuing authority.', 'Keep the acknowledgement number for follow-up.'] },
  { name: 'Caste certificate', category: 'Certificates', authority: 'Karnataka Government', href: 'https://karnataka.gov.in/', steps: ['Check the current state application process and eligible issuing authority.', 'Prepare the evidence requested for your specific category.', 'Do not share identity verification codes outside official portals.'] },
]

const sources = [
  { name: 'National Scholarship Portal', domain: 'scholarships.gov.in', href: 'https://scholarships.gov.in/', status: 'Official reference' },
  { name: 'Karnataka State Scholarship Portal', domain: 'ssp.karnataka.gov.in', href: 'https://ssp.karnataka.gov.in/', status: 'Official reference' },
  { name: 'myScheme', domain: 'myscheme.gov.in', href: 'https://www.myscheme.gov.in/', status: 'Official reference' },
  { name: 'Karnataka Government', domain: 'karnataka.gov.in', href: 'https://karnataka.gov.in/', status: 'Official reference' },
  { name: 'UIDAI', domain: 'uidai.gov.in', href: 'https://uidai.gov.in/', status: 'Official reference' },
  { name: 'BMTC', domain: 'mybmtc.karnataka.gov.in', href: 'https://mybmtc.karnataka.gov.in/', status: 'Official reference' },
  { name: 'Passport Seva', domain: 'passportindia.gov.in', href: 'https://www.passportindia.gov.in/', status: 'Official reference' },
  { name: 'BBMP via Karnataka One', domain: 'www.karnatakaone.gov.in', href: BBMP_INFO_URL, status: 'Official service directory' },
  { name: 'BBMP Property Tax', domain: 'bbmptax.karnataka.gov.in', href: BBMP_PROPERTY_TAX_URL, status: 'Official service portal' },
  { name: 'Karnataka iPGRS', domain: 'ipgrs.karnataka.gov.in', href: KARNATAKA_IPGRS_URL, status: 'Official grievance portal' },
  { name: 'Karnataka One', domain: 'www.karnatakaone.gov.in', href: KARNATAKA_ONE_URL, status: 'Official service directory' },
]

const defaultAlerts = [
  { id: 'a1', title: 'Your service centre is ready', detail: 'Start with an official source and save the application checklist you need.', category: 'Tips', time: 'Today', read: false },
  { id: 'a2', title: 'Explore Karnataka scholarships', detail: 'Karnataka SSP is available in Opportunity Hub. Verify current dates on the portal.', category: 'Opportunities', time: 'Today', read: false },
  { id: 'a3', title: 'Stay safe from OTP requests', detail: 'Civic Pulse never asks for Aadhaar OTPs, bank passwords or portal credentials.', category: 'Safety', time: 'Yesterday', read: true },
]

const TODAY = new Date().toISOString().slice(0, 10)
const formatDate = (value) => value ? value.slice(0, 10) : ''
const formatReminderDate = (value) => value ? value.split('-').reverse().join('/') : ''

const readStored = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function App() {
  const [active, setActive] = useState('dashboard')
  const [sessionToken, setSessionToken] = useState(() => localStorage.getItem('civic-session') || '')
  const [authChecking, setAuthChecking] = useState(Boolean(localStorage.getItem('civic-session')))
  const [theme, setTheme] = useState(() => localStorage.getItem('civic-theme') || 'light')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [query, setQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [profile, setProfile] = useState(() => readStored('civic-profile', { name: 'Aarav Sharma', location: 'Bengaluru, Karnataka', language: 'English', occupation: 'Student' }))
  const [alerts, setAlerts] = useState(() => readStored('civic-alerts', defaultAlerts))
  const [complaints, setComplaints] = useState(() => readStored('civic-complaints', []))
  const [complaintOwnerToken, setComplaintOwnerToken] = useState(() => localStorage.getItem('civic-complaint-owner-token') || '')
  const [saved, setSaved] = useState(() => readStored('civic-saved', []))
  const [chat, setChat] = useState(() => readStored('civic-chat', [{ role: 'assistant', text: 'Namaste! I’m Janavani, your government information guide. Ask me about a service, scheme or document. I’ll point you to official sources and flag what needs verification.' }]))
  const [backendOnline, setBackendOnline] = useState(false)
  const [voiceExpanded, setVoiceExpanded] = useState(() => {
    const stored = localStorage.getItem('civic-voice-expanded')
    return stored === null ? true : stored === 'true'
  })
  const [voiceLanguage, setVoiceLanguage] = useState(() => localStorage.getItem('civic-voice-language') || 'English')
  const [voiceStartRequest, setVoiceStartRequest] = useState(0)

  useEffect(() => {
    localStorage.setItem('civic-voice-expanded', String(voiceExpanded))
  }, [voiceExpanded])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('civic-theme', theme)
  }, [theme])
  useEffect(() => { localStorage.setItem('civic-profile', JSON.stringify(profile)) }, [profile])
  useEffect(() => { localStorage.setItem('civic-alerts', JSON.stringify(alerts)) }, [alerts])
  useEffect(() => { localStorage.setItem('civic-complaints', JSON.stringify(complaints)) }, [complaints])
  useEffect(() => { localStorage.setItem('civic-saved', JSON.stringify(saved)) }, [saved])
  useEffect(() => {
    if (complaintOwnerToken) localStorage.setItem('civic-complaint-owner-token', complaintOwnerToken)
  }, [complaintOwnerToken])
  useEffect(() => { localStorage.setItem('civic-chat', JSON.stringify(chat)) }, [chat])
  useEffect(() => {
    if (!sessionToken) return
    request('/auth/me', { headers: { 'X-Civic-Session': sessionToken } })
      .then((result) => {
        const user = result.user
        setProfile({
          name: user.full_name,
          location: user.location || 'Bengaluru, Karnataka',
          language: user.language || 'English',
          occupation: user.occupation || 'Citizen',
        })
      })
      .catch(() => {
        localStorage.removeItem('civic-session')
        setSessionToken('')
      })
      .finally(() => setAuthChecking(false))
  }, [sessionToken])
  useEffect(() => {
    request('/health')
      .then(() => {
        setBackendOnline(true)
        const complaintRequest = complaintOwnerToken
          ? request('/complaints', { headers: { 'X-Complaint-Owner-Token': complaintOwnerToken } })
          : Promise.resolve({ complaints: [] })
        return Promise.all([
          complaintRequest,
          request('/notifications', {
            headers: sessionToken ? { 'X-Civic-Session': sessionToken } : {},
          }),
        ])
      })
      .then(([complaintResult, notificationResult]) => {
        setComplaints(complaintResult.complaints)
        if (notificationResult.notifications.length) {
          setAlerts((current) => {
            const existingAlerts = new Map(current.map((item) => [item.id, item]))
            const serverAlerts = notificationResult.notifications.map((item) => ({
              id: item.id,
              title: item.title,
              detail: item.detail,
              category: item.category,
              time: 'From service',
              read: sessionToken ? item.read : Boolean(existingAlerts.get(item.id)?.read),
            }))
            const serverIds = new Set(serverAlerts.map((item) => item.id))
            return [...serverAlerts, ...current.filter((item) => !serverIds.has(item.id))]
          })
        }
      })
      .catch(() => setBackendOnline(false))
  }, [complaintOwnerToken, sessionToken])

  const unread = alerts.filter((alert) => !alert.read).length
  const currentModule = modules.find((item) => item.id === active) || modules[0]
  const switchModule = (id) => {
    setActive(id)
    setMobileMenu(false)
    setProfileOpen(false)
  }

  const handleGlobalSearch = (event) => {
    event.preventDefault()
    if (!query.trim()) return
    setActive('civic-brain')
  }

  if (authChecking) {
    return <div className="auth-screen"><div className="auth-loading"><LoaderCircle className="spin" size={24} /> Checking your session…</div></div>
  }
  if (!sessionToken) {
    return <AuthScreen onAuthenticated={(token, user) => {
      localStorage.setItem('civic-session', token)
      setSessionToken(token)
      setProfile({
        name: user.full_name,
        location: user.location || 'Bengaluru, Karnataka',
        language: user.language || 'English',
        occupation: user.occupation || 'Citizen',
      })
    }} />
  }

  return (
    <div className="app-shell">
      {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <button className="brand" onClick={() => switchModule('dashboard')} aria-label="Civic Pulse home">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span className="brand-copy"><strong>civic<span>pulse</span></strong><small>360 · PUBLIC SERVICES</small></span>
        </button>
        <div className="workspace-pill"><span className="workspace-dot" /> Citizen workspace <ChevronDown size={14} /></div>
        <nav className="side-nav" aria-label="Main navigation">
          {['Workspace', 'Citizen services', 'Discover', 'My services'].map((group) => (
            <div className="nav-group" key={group}>
              <p className="nav-label">{group}</p>
              {modules.filter((item) => item.group === group).map((item) => {
                const Icon = item.icon
                return <button key={item.id} className={`nav-item ${active === item.id ? 'nav-active' : ''}`} onClick={() => switchModule(item.id)}>
                  <Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>
                  {item.id === 'civic-alert' && unread > 0 && <span className="nav-count">{unread}</span>}
                </button>
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon"><CircleHelp size={17} /></span><strong>Need a hand?</strong><p>Find your way around Civic Pulse.</p><button onClick={() => switchModule('janavani')}>Ask Janavani <ArrowRight size={14} /></button></div>
          <button className="profile-mini" onClick={() => setProfileOpen(!profileOpen)}>
            <span className="avatar">AS</span><span className="profile-copy"><b>{profile.name}</b><small>{profile.occupation}</small></span><MoreHorizontal size={18} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-menu-btn" aria-label="Open menu" onClick={() => setMobileMenu(true)}><Menu size={20} /></button>
          <div className="crumb"><span>Citizen workspace</span><ChevronRight size={14} /><b>{currentModule.label}</b></div>
          <div className="topbar-actions">
            <form className="global-search" onSubmit={handleGlobalSearch}>
              <Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services..." aria-label="Search services" /><kbd>⌘ K</kbd>
            </form>
            <span className={`connection-pill ${backendOnline ? 'connected' : ''}`} title={backendOnline ? 'FastAPI service connected' : 'Local demo mode'}>
              <span />{backendOnline ? 'API connected' : 'Demo mode'}
            </span>
            <button className="icon-btn theme-toggle" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-label="Switch theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="icon-btn notification-top" aria-label={`${unread} unread notifications`} onClick={() => switchModule('civic-alert')}><Bell size={18} />{unread > 0 && <i />}</button>
            <button className="top-avatar" onClick={() => setProfileOpen(!profileOpen)} aria-label="Edit profile">AS</button>
          </div>
          {profileOpen && <ProfilePopover profile={profile} sessionToken={sessionToken} onSave={setProfile} onClose={() => setProfileOpen(false)} />}
        </header>
        <section className="page-content">
          {active === 'dashboard' && <Dashboard profile={profile} complaints={complaints} alerts={alerts} saved={saved} onNavigate={switchModule} onStartVoice={() => { setVoiceExpanded(true); setVoiceStartRequest((value) => value + 1) }} />}
          {active === 'janavani' && <Janavani chat={chat} setChat={setChat} backendOnline={backendOnline} profile={profile} />}
          {active === 'civic-eye' && <CivicEye complaints={complaints} setComplaints={setComplaints} backendOnline={backendOnline} ownerToken={complaintOwnerToken} setOwnerToken={setComplaintOwnerToken} />}
          {active === 'seva-agent' && <SevaAgent onNavigate={switchModule} />}
          {active === 'satya-check' && <SatyaCheck />}
          {active === 'opportunity-hub' && <OpportunityHub saved={saved} setSaved={setSaved} profile={profile} />}
          {active === 'loan-connect' && <LoanConnect />}
          {active === 'opportunity-radar' && <OpportunityRadar />}
          {active === 'civic-brain' && <CivicBrain key={query} query={query} onNavigate={switchModule} />}
          {active === 'civic-docs' && <CivicDocs />}
          {active === 'civic-alert' && <CivicAlerts alerts={alerts} setAlerts={setAlerts} backendOnline={backendOnline} sessionToken={sessionToken} />}
          {active === 'bengaluru' && <Bengaluru onNavigate={switchModule} />}
          {active === 'travel-hub' && <TravelHub key={sessionToken} sessionToken={sessionToken} language={profile.language} />}
          {active === 'regional-status' && <RegionalStatus key={sessionToken} sessionToken={sessionToken} language={profile.language} onNavigate={switchModule} />}
          {active === 'gov-jobs' && <GovJobs sessionToken={sessionToken} onNavigate={switchModule} />}
          {active === 'land-property' && <LandProperty onNavigate={switchModule} />}
          {active === 'health-services' && <HealthServices profile={profile} onNavigate={switchModule} />}
          {active === 'agri-services' && <AgriServices sessionToken={sessionToken} onNavigate={switchModule} />}
          {active === 'business-hub' && <BusinessHub onNavigate={switchModule} />}
          {active === 'karnataka-dir' && <KarnatakaDir onNavigate={switchModule} />}
          {active === 'app-tracker' && <AppTracker sessionToken={sessionToken} backendOnline={backendOnline} />}
          {active === 'opp-dashboard' && <OppDashboard sessionToken={sessionToken} profile={profile} onNavigate={switchModule} />}
          <footer className="page-footer"><span>© 2026 Civic Pulse 360</span><span><ShieldCheck size={13} /> Information for guidance · Always verify on official portals</span><button onClick={() => switchModule('satya-check')}>Safety & sources <ArrowUpRight size={13} /></button></footer>
        </section>
      </main>
      <CivicVoiceAssistant
        activePage={active}
        onNavigate={switchModule}
        navigationItems={modules.map(({ id, label }) => ({ id, label }))}
        onOpenProfile={() => setProfileOpen(true)}
        expanded={voiceExpanded}
        setExpanded={setVoiceExpanded}
        language={voiceLanguage}
        setLanguage={setVoiceLanguage}
        startRequest={voiceStartRequest}
      />
    </div>
  )
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>
}

function Dashboard({ profile, complaints, alerts, saved, onNavigate, onStartVoice }) {
  const cards = modules.filter((item) => item.id !== 'dashboard')
  return <div className="dashboard-page">
    <div className="welcome-strip"><div className="welcome-copy"><span className="welcome-kicker"><CloudSun size={15} /> YOUR CITY, IN SYNC</span><h1>Welcome back, {profile.name.split(' ')[0]} <span>✦</span></h1><p>A clearer path to the services and opportunities that matter to you.</p><div className="welcome-actions"><button className="button-primary" onClick={() => onNavigate('civic-brain')}><Search size={16} /> Explore services <ArrowRight size={15} /></button><button className="button-quiet" onClick={() => onNavigate('janavani')}><Sparkles size={16} /> Ask Janavani</button></div></div><div className="welcome-art" aria-hidden="true"><div className="art-sun" /><div className="art-cloud cloud-one" /><div className="art-cloud cloud-two" /><div className="art-building building-one" /><div className="art-building building-two" /><div className="art-building building-three" /><div className="art-road" /><div className="art-pin"><MapPin size={24} /></div></div></div>
    <section className="voice-home-card"><div><span>CIVIC VOICE AI</span><h2>Speak, ask, or say “Take me there.”</h2><p>Welcome to Civic Pulse 360. Use voice or text to find government services across every page.</p><small>English · Kannada · Hindi · Telugu · Tamil · Malayalam · Marathi · Bengali · Gujarati · Punjabi · Urdu</small></div><button onClick={onStartVoice} aria-label="Start CIVIC VOICE AI"><Mic size={28} /><b>Start speaking</b></button></section>
    <div className="dashboard-metrics">
      <Metric icon={Bookmark} label="Saved opportunities" value={saved.length} delta="In your collection" tone="blue" />
      <Metric icon={Siren} label="My reports" value={complaints.length} delta={complaints.length ? 'Track your reports' : 'Nothing reported yet'} tone="orange" />
      <Metric icon={Bell} label="Unread updates" value={alerts.filter((a) => !a.read).length} delta="Your alert centre" tone="violet" />
      <Metric icon={ShieldCheck} label="Official sources" value={sources.length} delta="Ready to explore" tone="green" />
    </div>
    <div className="section-title-row"><div><p className="eyebrow">YOUR CIVIC TOOLKIT</p><h2>One platform. Many possibilities.</h2></div><span className="section-side-note"><span className="status-dot" /> {modules.length - 1} services available</span></div>
    <div className="module-grid">{cards.map((item, index) => {
      const Icon = item.icon
      return <button className="module-card" key={item.id} onClick={() => onNavigate(item.id)} style={{ '--delay': `${index * 35}ms` }}>
        <span className={`module-icon ${item.color}`}><Icon size={20} strokeWidth={1.8} /></span><ArrowUpRight className="module-arrow" size={17} />
        <strong>{item.label}</strong><p>{item.desc}</p><span className="module-link">Open service <ArrowRight size={13} /></span>
      </button>
    })}</div>
    <div className="bottom-grid"><div className="panel updates-panel"><div className="panel-heading"><div><p className="eyebrow">FROM OFFICIAL PORTALS</p><h2>Worth a look</h2></div><button className="text-button" onClick={() => onNavigate('opportunity-radar')}>View all <ArrowRight size={14} /></button></div>
      <OpportunityRow item={schemes[0]} onClick={() => onNavigate('opportunity-hub')} /><OpportunityRow item={schemes[2]} onClick={() => onNavigate('opportunity-hub')} /><OpportunityRow item={schemes[3]} onClick={() => onNavigate('opportunity-hub')} />
    </div><div className="panel quick-panel"><div className="panel-heading"><div><p className="eyebrow">QUICK ACCESS</p><h2>Pick up where you left off</h2></div></div>
      <button className="quick-row" onClick={() => onNavigate('civic-docs')}><span className="quick-icon blue"><FileText size={17} /></span><span><b>Document guide</b><small>Check what you’ll need</small></span><ChevronRight size={16} /></button>
      <button className="quick-row" onClick={() => onNavigate('civic-eye')}><span className="quick-icon orange"><MapPin size={17} /></span><span><b>Report a civic issue</b><small>Help make your ward better</small></span><ChevronRight size={16} /></button>
      <button className="quick-row" onClick={() => onNavigate('bengaluru')}><span className="quick-icon green"><BusFront size={17} /></span><span><b>Bengaluru services</b><small>Transport & municipal help</small></span><ChevronRight size={16} /></button>
    </div></div>
  </div>
}

function Metric({ icon: Icon, label, value, delta, tone }) {
  return <div className="metric-card"><span className={`metric-icon ${tone}`}><Icon size={17} /></span><span className="metric-label">{label}</span><strong>{value}</strong><small>{delta}</small></div>
}

function OpportunityRow({ item, onClick }) {
  const Icon = item.icon
  return <button className="opportunity-row" onClick={onClick}><span className="opportunity-icon"><Icon size={17} /></span><span className="opportunity-copy"><b>{item.title}</b><small>{item.type} <i>·</i> {item.source}</small></span><span className="official-badge"><ShieldCheck size={12} /> Official</span><ArrowUpRight className="row-arrow" size={15} /></button>
}

function Janavani({ chat, setChat, backendOnline, profile }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const suggestions = ['What documents do I need for a scholarship?', 'How do I report a pothole in Bengaluru?', 'Where can I check official government schemes?']
  async function send(text = message) {
    if (!text.trim() || busy) return
    const question = text.trim()
    const updated = [...chat, { role: 'user', text: question }]
    setChat(updated); setMessage(''); setError(''); setBusy(true)
    try {
      const result = await request('/chat', { method: 'POST', body: { message: question, language: profile.language } })
      setChat([...updated, { role: 'assistant', text: result.answer, source: result.source, demo: result.demo }])
    } catch (e) {
      setError(
        e?.message && e.message !== 'Failed to fetch'
          ? e.message
          : 'Civic Pulse cannot reach the assistant service. Check that the backend is running and try again.',
      )
    } finally { setBusy(false) }
  }
  return <div className="module-page"><PageHeading eyebrow="JANAVANI AI · GOVERNMENT INFORMATION" title="Answers, with a way forward." description="Ask in plain language. Get a clear starting point and links to official sources." action={<span className={`small-status ${backendOnline ? 'status-live' : ''}`}><span />{backendOnline ? 'Assistant connected' : 'Local guide'}</span>} />
    <div className="chat-layout"><section className="chat-panel panel"><div className="chat-header"><span className="chat-avatar"><Bot size={19} /></span><div><b>Janavani</b><small><i /> {backendOnline ? 'Civic Brain online' : 'Guidance mode'} · {profile.language}</small></div><button className="icon-btn" title="Clear conversation" onClick={() => setChat([{ role: 'assistant', text: 'Namaste! I’m Janavani, your government information guide. Ask me about a service, scheme or document. I’ll point you to official sources and flag what needs verification.' }])}><MoreHorizontal size={18} /></button></div>
      <div className="chat-messages">{chat.map((item, i) => <div className={`message-row ${item.role}`} key={`${i}-${item.text.slice(0, 10)}`}><span className="message-avatar">{item.role === 'assistant' ? <Sparkles size={14} /> : 'AS'}</span><div className="message-bubble"><p>{item.text}</p>{item.source && <small className="message-source"><ShieldCheck size={12} /> {item.source}{item.demo ? ' · Demo guidance' : ''}</small>}</div></div>)}{busy && <div className="message-row assistant"><span className="message-avatar"><Sparkles size={14} /></span><div className="typing"><i /><i /><i /></div></div>}</div>
      {chat.length < 3 && <div className="suggestions">{suggestions.map((s) => <button key={s} onClick={() => send(s)}>{s}<ArrowUpRight size={13} /></button>)}</div>}
      {error && <p className="inline-error">{error}</p>}
      <form className="chat-compose" onSubmit={(e) => { e.preventDefault(); send() }}><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask a question about a government service..." aria-label="Your question" /><button className="send-button" disabled={!message.trim() || busy} aria-label="Send message"><Send size={17} /></button></form>
      <p className="chat-disclaimer"><ShieldCheck size={13} /> Janavani provides guidance, not legal advice. Verify time-sensitive details on the linked official portal.</p>
    </section><aside className="chat-side"><div className="panel side-tip"><span className="tip-icon"><Lightbulb size={18} /></span><p className="eyebrow">A BETTER ANSWER STARTS HERE</p><h3>Tell Janavani a little more.</h3><p>Mention your state and what you’re trying to do. Never share passwords, OTPs, or sensitive identity numbers.</p></div><div className="panel source-list"><div className="panel-heading"><div><p className="eyebrow">TRUSTED STARTING POINTS</p><h3>Official sources</h3></div></div>{sources.slice(0, 4).map((source) => <a className="source-row" key={source.domain} href={source.href} target="_blank" rel="noreferrer"><span><ShieldCheck size={14} /></span>{source.name}<ArrowUpRight size={13} /></a>)}</div></aside></div>
  </div>
}

function CivicEye({ complaints, setComplaints, backendOnline, ownerToken, setOwnerToken }) {
  const [form, setForm] = useState({ category: 'Pothole / damaged road', description: '', location: '' })
  const photoInputRef = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeError, setNoticeError] = useState(false)
  const categories = ['Pothole / damaged road', 'Garbage accumulation', 'Water leakage', 'Drainage problem', 'Broken streetlight', 'Damaged footpath', 'Missed waste collection', 'Other civic issue']
  async function submit(e) {
    e.preventDefault(); setNotice('')
    if (form.description.trim().length < 8 || form.location.trim().length < 3) { setNotice('Add a short description and a specific location to continue.'); setNoticeError(true); return }
    setBusy(true)
    let succeeded = false
    const localItem = { ...form, id: `CP-${crypto.randomUUID().slice(-7).toUpperCase()}`, status: 'Submitted', created_at: new Date().toISOString(), photo: '' }
    try {
      let body = form
      if (photo) {
        body = new FormData()
        body.append('category', form.category)
        body.append('description', form.description)
        body.append('location', form.location)
        body.append('photo', photo)
      }
      const ownerHeaders = ownerToken ? { 'X-Complaint-Owner-Token': ownerToken } : {}
      const result = await request('/complaints', { method: 'POST', body, headers: ownerHeaders })
      if (result.owner_token) setOwnerToken(result.owner_token)
      delete result.owner_token
      result.photo = photo?.name || ''
      setComplaints([result, ...complaints])
      setNotice(`Report ${result.id} submitted and saved${photo ? ' with its photo' : ''}.`)
      setNoticeError(false)
      succeeded = true
    } catch (error) {
      if (error instanceof ApiError) {
        setNotice(error.message)
        setNoticeError(true)
        return
      }
      setComplaints([localItem, ...complaints])
      setNotice(`Report ${localItem.id} saved on this device${photo ? ', but the photo could not be saved while offline' : ''}. Connect the API to sync reports.`)
      setNoticeError(false)
      succeeded = true
    } finally {
      setBusy(false)
      if (succeeded) {
        setForm({ ...form, description: '' })
        setPhoto(null)
        if (photoInputRef.current) photoInputRef.current.value = ''
      }
    }
  }
  return <div className="module-page"><PageHeading eyebrow="CIVIC EYE · SMART GRIEVANCE" title="Your neighbourhood, heard." description="Share a civic issue with a location and follow its status from one place." action={<span className={`small-status ${backendOnline ? 'status-live' : ''}`}><span />{backendOnline ? 'Reports sync to API' : 'Device storage'}</span>} />
    <div className="civic-layout"><section className="panel form-panel"><div className="form-panel-title"><span className="form-title-icon orange"><MapPin size={18} /></span><div><h2>Report an issue</h2><p>Fields marked <i>*</i> are required.</p></div></div><form onSubmit={submit} className="stack-form">
      <label>What needs attention? <i>*</i><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
      <label>Describe the issue <i>*</i><textarea rows="4" maxLength="700" placeholder="What happened? Is it affecting pedestrians, traffic or nearby homes?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><small className="field-note">{form.description.length}/700 characters</small></label>
      <label>Location or landmark <i>*</i><div className="input-with-icon"><MapPin size={16} /><input placeholder="e.g. 2nd Cross, Indiranagar" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div></label>
      <label className="upload-field"><span>Photo <small>Optional · JPG or PNG, up to 5 MB</small></span><span className="upload-control"><input ref={photoInputRef} type="file" accept="image/png,image/jpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f && (!['image/png', 'image/jpeg'].includes(f.type) || f.size > 5 * 1024 * 1024)) { setNotice('Choose a JPG or PNG image smaller than 5 MB.'); setNoticeError(true); e.target.value = ''; setPhoto(null); return } setPhoto(f || null) }} />{photo?.name || 'Choose a photo'} <FileText size={15} /></span></label>
      {notice && <p className={`form-notice ${noticeError ? 'inline-error' : ''}`}><Check size={14} />{notice}</p>}
      <button className="button-primary full-button" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Send size={15} />}{busy ? 'Saving report…' : 'Submit report'}</button>
      <p className="privacy-note"><ShieldCheck size={13} /> Your report is for civic follow-up. Please don’t include personal or sensitive information.</p>
    </form></section><aside className="civic-aside"><div className="panel process-panel"><p className="eyebrow">HOW IT WORKS</p><h3>From report to resolution.</h3>{[['01', 'Tell us what happened', 'Choose a category and add a useful description.'], ['02', 'Pinpoint the place', 'Add a street, landmark or nearby stop.'], ['03', 'Follow the progress', 'Keep your reference ID to check for updates.']].map(([n, title, text]) => <div className="process-step" key={n}><span>{n}</span><div><b>{title}</b><p>{text}</p></div></div>)}</div><div className="civic-safety"><ShieldCheck size={17} /><div><b>Urgent safety issue?</b><p>This prototype is not an emergency service. Contact local emergency services for immediate danger.</p></div></div></aside></div>
    <div className="panel report-history"><div className="panel-heading"><div><p className="eyebrow">YOUR ACTIVITY</p><h2>Report history <span className="count-badge">{complaints.length}</span></h2></div><span className="subtle-text">Most recent first</span></div>
      {complaints.length === 0 ? <EmptyState icon={Flag} title="No reports just yet" text="When you submit a civic issue, your report and tracking reference will appear here." /> : <div className="table-wrap"><table><thead><tr><th>REFERENCE</th><th>ISSUE</th><th>LOCATION</th><th>DATE</th><th>STATUS</th></tr></thead><tbody>{complaints.map((item) => <tr key={item.id}><td className="id-cell">{item.id}</td><td>{item.category}</td><td>{item.location}</td><td>{formatDate(item.created_at)}</td><td><span className="status-tag">{item.status || 'Submitted'}</span></td></tr>)}</tbody></table></div>}
    </div>
  </div>
}

function SevaAgent({ onNavigate }) {
  const [service, setService] = useState('Scholarship application')
  const [checked, setChecked] = useState([])
  const checklist = service.toLowerCase().includes('scholarship')
    ? ['Review the official eligibility criteria', 'Check the application window on the portal', 'Prepare current education or enrolment details', 'Confirm required income or category certificates', 'Save the official application acknowledgement']
    : service.toLowerCase().includes('pan') ? ['Choose a new PAN or correction service', 'Review current proof requirements', 'Keep application details ready for the official portal', 'Complete verification on the official Income Tax portal']
      : ['Identify the correct service and issuing authority', 'Review the official, up-to-date document checklist', 'Prepare clear copies of requested supporting documents', 'Use the official portal to complete identity verification']
  const toggle = (index) => setChecked(checked.includes(index) ? checked.filter((i) => i !== index) : [...checked, index])
  return <div className="module-page"><PageHeading eyebrow="SEVA AGENT · APPLICATION PREPARATION" title="A little less paperwork stress." description="Build a practical checklist before you visit an official application portal." />
    <div className="seva-layout"><div className="panel seva-main"><div className="form-panel-title"><span className="form-title-icon blue"><ListChecks size={18} /></span><div><h2>Let’s get prepared</h2><p>Choose a service to create your preparation checklist.</p></div></div><label className="select-label">I’m preparing for<select value={service} onChange={(e) => { setService(e.target.value); setChecked([]) }}><option>Scholarship application</option><option>Income certificate</option><option>PAN card service</option><option>Driving licence service</option><option>Government scheme application</option></select></label>
      <div className="progress-card"><div><span>YOUR PREPARATION</span><b>{checked.length} of {checklist.length} steps done</b></div><div className="progress-track"><span style={{ width: `${checked.length / checklist.length * 100}%` }} /></div></div>
      <div className="checklist">{checklist.map((item, i) => <button className={`checklist-row ${checked.includes(i) ? 'checked' : ''}`} key={item} onClick={() => toggle(i)}><span className="checkbox">{checked.includes(i) && <Check size={13} />}</span><span>{item}</span><ChevronRight size={15} /></button>)}</div>
      <div className="seva-actions"><button className="button-primary" onClick={() => onNavigate(service.toLowerCase().includes('scholarship') ? 'opportunity-hub' : 'civic-docs')}>Find official service <ArrowUpRight size={15} /></button><button className="button-secondary" onClick={() => setChecked([])}>Reset checklist</button></div>
    </div><aside className="panel seva-aside"><span className="tip-icon"><FileCheck2 size={18} /></span><p className="eyebrow">YOUR DOCUMENT BUDDY</p><h3>Start with the basics.</h3><p>Application rules vary by scheme and state. Treat this as a preparation aid, then verify every requirement on the official service.</p><div className="seva-callout"><ShieldCheck size={15} /><span>We don’t submit applications or store your identity documents.</span></div><button className="text-button" onClick={() => onNavigate('civic-docs')}>Browse document guides <ArrowRight size={14} /></button></aside></div>
  </div>
}

function SatyaCheck() {
  const [claim, setClaim] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function verify(e) {
    e.preventDefault(); setResult(null); setError('')
    if (claim.trim().length < 8) { setError('Paste a longer message or URL so we can review its source clues.'); return }
    setBusy(true)
    try { setResult(await request('/fact-check', { method: 'POST', body: { content: claim } })) }
    catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
        setBusy(false)
        return
      }
      try {
        const url = new URL(claim.match(/https?:\/\/\S+/)?.[0] || `https://${claim.trim().split(/\s/)[0]}`)
        const trusted = sources.some((s) => url.hostname === s.domain || url.hostname.endsWith(`.${s.domain}`))
        setResult({ risk: trusted ? 'Review details' : 'Needs caution', explanation: trusted ? `${url.hostname} matches a listed official domain. This does not verify the claims on the page.` : `${url.hostname} is not in this platform’s short list of official reference domains. That alone does not prove a claim is false.`, official_sources: sources.slice(0, 3).map((s) => ({ name: s.name, url: s.href })) })
      } catch { setResult({ risk: 'Needs review', explanation: 'No source domain could be verified from this message. Check the claim against an official portal before acting.', official_sources: sources.slice(0, 3).map((s) => ({ name: s.name, url: s.href })) }) }
    }
    setBusy(false)
  }
  return <div className="module-page"><PageHeading eyebrow="SATYA CHECK · SOURCE & CLAIM REVIEW" title="A second look before you trust it." description="Review suspicious messages and links for source clues and next steps—not a definitive truth verdict." action={<span className="small-status"><ShieldCheck size={13} /> Preliminary checks only</span>} />
    <div className="fact-layout"><section className="panel fact-form-panel"><span className="fact-big-icon"><ShieldCheck size={22} /></span><h2>What would you like to check?</h2><p>Paste a message or URL. Don’t upload private documents or include personal details.</p><form onSubmit={verify}><textarea rows="7" maxLength="5000" placeholder="Paste a message, notice excerpt, or link here..." value={claim} onChange={(e) => setClaim(e.target.value)} /><div className="fact-form-foot"><span>{claim.length}/5000</span><button className="button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Search size={15} />}{busy ? 'Checking…' : 'Review source'}</button></div></form>{error && <p className="inline-error">{error}</p>}
      {result && <div className="fact-result"><div className="result-heading"><span className="result-warning"><ShieldCheck size={17} /></span><div><small>PRELIMINARY SOURCE REVIEW</small><h3>{result.risk}</h3></div></div><p>{result.explanation}</p><div className="result-links"><b>Useful official references</b>{(result.official_sources || []).slice(0, 4).map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name}<ArrowUpRight size={13} /></a>)}</div></div>}
      <div className="fact-disclaimer"><ShieldCheck size={14} /> A domain match cannot prove a claim is true. Image/video manipulation checks are not enabled in this prototype.</div>
    </section><aside className="fact-side"><div className="panel side-tip"><p className="eyebrow">PAUSE · CHECK · PROTECT</p><h3>Three quick checks.</h3>{[['Check the domain', 'Official government sites in India commonly use .gov.in or .nic.in. Look closely for misspellings.'], ['Find it independently', 'Open the official portal yourself instead of following a message link.'], ['Never share a code', 'A legitimate guide will never need your OTP or bank password.']].map(([t, d], i) => <div className="fact-tip" key={t}><span>0{i + 1}</span><div><b>{t}</b><p>{d}</p></div></div>)}</div><div className="safety-banner"><ShieldCheck size={18} /><div><b>Unsure? Don’t click yet.</b><p>Contact the relevant agency through its official website or published helpline.</p></div></div></aside></div>
  </div>
}

function OpportunityHub({ saved, setSaved, profile }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [compare, setCompare] = useState([])
  const options = ['All', 'Scholarship', 'Government scheme', 'Loan & subsidy']
  const filtered = schemes.filter((item) => (filter === 'All' || item.type === filter) && `${item.title} ${item.type} ${item.audience} ${item.tag}`.toLowerCase().includes(search.toLowerCase()))
  const toggleSave = (id) => setSaved(saved.includes(id) ? saved.filter((v) => v !== id) : [...saved, id])
  const toggleCompare = (id) => setCompare(compare.includes(id) ? compare.filter((v) => v !== id) : [...compare, id].slice(-3))
  return <div className="module-page"><PageHeading eyebrow="CIVIC OPPORTUNITY HUB · SCHEMES & SCHOLARSHIPS" title="Find an opportunity that fits." description={`A curated doorway to official programmes. Explore the portal for current eligibility and deadlines${profile.location ? ` · ${profile.location.split(',')[1]?.trim() || 'India'}` : ''}.`} action={<span className="official-badge"><ShieldCheck size={12} /> Official links</span>} />
    <div className="hub-toolbar"><div className="hub-search"><Search size={16} /><input placeholder="Search scholarships, schemes..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="filter-chips"><Filter size={15} />{options.map((option) => <button className={filter === option ? 'chip-active' : ''} key={option} onClick={() => setFilter(option)}>{option}</button>)}</div></div>
    <div className="hub-feature"><div><span className="feature-label"><Sparkles size={14} /> A good place to start</span><h2>Not sure what you qualify for?</h2><p>Use myScheme’s official finder to discover programmes based on your details, then return here to prepare.</p><a className="button-primary" href="https://www.myscheme.gov.in/" target="_blank" rel="noreferrer">Open myScheme <ArrowUpRight size={15} /></a></div><span className="feature-art"><Landmark size={49} strokeWidth={1.2} /><i /><i /></span></div>
    <div className="hub-results-heading"><div><p className="eyebrow">OFFICIAL STARTING POINTS</p><h2>Explore opportunities <span className="count-badge">{filtered.length}</span></h2></div><span className="subtle-text">Source links · No deadlines invented</span></div>
    {filtered.length ? <div className="scheme-grid">{filtered.map((item) => { const Icon = item.icon; return <article className="scheme-card" key={item.id}><div className="scheme-card-top"><span className="scheme-icon"><Icon size={19} /></span><button className={`save-button ${saved.includes(item.id) ? 'is-saved' : ''}`} onClick={() => toggleSave(item.id)} title={saved.includes(item.id) ? 'Remove from saved' : 'Save opportunity'}><Bookmark size={16} fill={saved.includes(item.id) ? 'currentColor' : 'none'} /></button></div><span className="scheme-tag">{item.tag}</span><h3>{item.title}</h3><p>{item.description}</p><div className="scheme-meta"><span>{item.type}</span><label><input type="checkbox" checked={compare.includes(item.id)} onChange={() => toggleCompare(item.id)} /> Compare</label></div><div className="scheme-card-bottom"><span><ShieldCheck size={13} /> {item.source}</span><a href={item.href} target="_blank" rel="noreferrer" aria-label={`Visit ${item.source}`}><ArrowUpRight size={15} /></a></div>{item.alternateHref && <a className="scheme-alternative" href={item.alternateHref} target="_blank" rel="noreferrer">{item.alternateLabel}<ArrowUpRight size={12} /></a>}</article>})}</div> : <EmptyState icon={Search} title="No matches yet" text="Try another search or choose a different category." />}
    {compare.length > 0 && <div className="compare-bar"><span><CheckCheck size={16} /> Comparing {compare.length} opportunity{compare.length > 1 ? 'ies' : ''}</span>{compare.map((id) => <b key={id}>{schemes.find((s) => s.id === id)?.title}</b>)}<button onClick={() => setCompare([])}><X size={15} /> Clear</button></div>}
    <p className="source-footnote"><ShieldCheck size={13} /> This directory links to official portals; programme availability, eligibility and closing dates may change. Always confirm with the source.</p>
  </div>
}

function LoanConnect() {
  const [principal, setPrincipal] = useState('500000')
  const [rate, setRate] = useState('9')
  const [years, setYears] = useState('5')
  const [loanType, setLoanType] = useState('Education')
  const p = Number(principal), r = Number(rate), n = Number(years) * 12
  const emi = p > 0 && r >= 0 && n > 0 ? (r === 0 ? p / n : p * (r / 1200) * (1 + r / 1200) ** n / ((1 + r / 1200) ** n - 1)) : 0
  const formatMoney = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0)
  const loans = [{ name: 'Education financing', desc: 'Compare current options with your bank and official education portals.', source: 'PM-Vidyalaxmi', href: 'https://pmvidyalaxmi.co.in/' }, { name: 'Agriculture credit', desc: 'Learn about government-supported credit and services for farmers.', source: 'JanSamarth', href: 'https://www.jansamarth.in/' }, { name: 'Micro enterprise', desc: 'Explore official resources for small-business and MUDRA credit.', source: 'MUDRA', href: 'https://www.mudra.org.in/' }]
  return <div className="module-page"><PageHeading eyebrow="LOAN CONNECT AI · FINANCIAL GUIDANCE" title="Plan with the numbers in view." description="Estimate a monthly repayment, then explore official credit resources. This is an illustration, not a loan offer." action={<span className="small-status"><ShieldCheck size={13} /> No approval promises</span>} />
    <div className="loan-layout"><section className="panel calculator"><div className="panel-heading"><div><p className="eyebrow">EMI ESTIMATOR</p><h2>Make room in your budget.</h2></div><span className="calculator-icon"><WalletCards size={20} /></span></div><div className="calculator-form"><label>Loan purpose<select value={loanType} onChange={(e) => setLoanType(e.target.value)}><option>Education</option><option>Agriculture</option><option>Business</option><option>Housing</option><option>Self-employment</option></select></label><label>Loan amount <span className="input-suffix"><span>₹</span><input type="number" min="10000" max="100000000" value={principal} onChange={(e) => setPrincipal(e.target.value)} /></span></label><label>Annual interest rate <span className="input-suffix"><input type="number" min="0" max="40" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} /><span>%</span></span></label><label>Repayment period <span className="input-suffix"><input type="number" min="1" max="40" value={years} onChange={(e) => setYears(e.target.value)} /><span>years</span></span></label></div><div className="emi-result"><span>Illustrative monthly EMI <small>for {loanType.toLowerCase()}</small></span><strong>{formatMoney(emi)}</strong><div><span>Principal <b>{formatMoney(p)}</b></span><span>Total interest <b>{formatMoney(emi * n - p)}</b></span><span>Total repayment <b>{formatMoney(emi * n)}</b></span></div></div><p className="source-footnote"><CircleHelp size={13} /> Estimate assumes a fixed monthly rate. Actual rates, fees and terms vary by lender.</p></section>
      <aside className="loan-aside"><div className="panel loan-tip"><span className="tip-icon"><Lightbulb size={18} /></span><p className="eyebrow">BEFORE YOU APPLY</p><h3>Compare the full picture.</h3><p>Check the annual rate, processing fees, repayment schedule and subsidy rules directly with the lender or programme.</p><div className="loan-checks">{['Confirm lender is authorised', 'Read all fees and conditions', 'Never pay an agent to guarantee approval'].map((x) => <span key={x}><Check size={14} />{x}</span>)}</div></div></aside></div>
    <div className="hub-results-heading loan-resource-heading"><div><p className="eyebrow">OFFICIAL RESOURCES</p><h2>Explore {loanType.toLowerCase()} pathways</h2></div></div><div className="loan-resource-grid">{loans.map((item) => <a className="loan-resource panel" key={item.name} href={item.href} target="_blank" rel="noreferrer"><span className="resource-icon"><HandCoins size={18} /></span><h3>{item.name}</h3><p>{item.desc}</p><span>{item.source} <ArrowUpRight size={14} /></span></a>)}</div>
  </div>
}

function OpportunityRadar() {
  const [checkedAt, setCheckedAt] = useState('')
  const [sourceError, setSourceError] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [added, setAdded] = useState([])
  const [busy, setBusy] = useState(false)
  async function checkSources() {
    setBusy(true)
    setSourceError('')
    try {
      const result = await request('/sources/verify')
      setAdded((result.sources || []).map((item) => ({
        title: item.name,
        source: `Portal reachability: ${item.status}`,
        link: item.url,
        note: `Checked ${item.last_verified}; HTTP ${item.http_status || 'unavailable'}; retries ${item.retries}. This does not verify page contents or connect a live data feed.`,
      })))
      setCheckedAt(result.checked_at)
    } catch (error) {
      setAdded([])
      setSourceError(error.message)
      setCheckedAt('')
    }
    setBusy(false)
  }
  const addAnnouncement = (e) => { e.preventDefault(); if (!announcement.trim()) return; setAdded([{ title: announcement.trim(), source: 'Manually added · review required', note: 'Unverified submission · administrator review needed' }, ...added]); setAnnouncement('') }
  return <div className="module-page"><PageHeading eyebrow="OPPORTUNITY RADAR · GOVERNMENT UPDATE MONITOR" title="Keep the right things on your radar." description="Review official references and portal reachability checks. These checks do not verify scheme content, deadlines or eligibility." action={<span className="small-status"><span /> Portal check only</span>} />
    <div className="radar-banner"><div className="radar-orb"><TrendingUp size={24} /></div><div><p className="eyebrow">SOURCE MONITOR</p><h2>Check reachability, then verify the notice.</h2><p>A portal response confirms only that a page answered. Eligibility, benefits and deadlines require review of the current official notice.</p></div><button className="button-primary" onClick={checkSources} disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <Search size={15} />}{busy ? 'Checking…' : 'Check official portals'}</button></div>
    <div className="radar-columns">    <section className="panel radar-sources"><div className="panel-heading"><div><p className="eyebrow">CURATED REFERENCE LIST</p><h2>Official sources</h2></div><span className="count-badge">{sources.length}</span></div>{sources.map((s) => <a className="radar-source-row" key={`${s.name}-${s.domain}`} href={s.href} target="_blank" rel="noreferrer"><span className="source-check"><ShieldCheck size={15} /></span><span><b>{s.name}</b><small>{s.domain}</small></span><span className="official-badge">Reference</span><ArrowUpRight size={14} /></a>)}<div className="checked-at"><Clock3 size={13} />{checkedAt ? `Last checked: ${checkedAt} · portal reachability only` : 'Not checked this session'}</div></section>
      <section className="panel radar-updates"><div className="panel-heading"><div><p className="eyebrow">UPDATES & SUBMISSIONS</p><h2>Review queue</h2></div><span className="review-badge">Needs review</span></div>{sourceError && <p className="inline-error" role="status">{sourceError}</p>}{added.length ? added.map((u, i) => <div className="update-card" key={`${u.title}-${i}`}><span className="update-dot" /><div><b>{u.title}</b><p>{u.source || u.note}</p><small>{u.note || 'Manually added · unverified until reviewed'}</small>{u.link && <a href={u.link} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={12} /></a>}</div></div>) : <EmptyState icon={Clock3} title="No updates in your queue" text="Check official portal reachability or add an announcement for review." />}
        <form className="add-update-form" onSubmit={addAnnouncement}><label htmlFor="announcement">Add an announcement for review</label><div><input id="announcement" placeholder="Paste a title or a short note..." value={announcement} onChange={(e) => setAnnouncement(e.target.value)} /><button className="button-secondary" disabled={!announcement.trim()}>Add</button></div><small>Manually added information is unverified until reviewed.</small></form>
      </section></div>
  </div>
}

function CivicBrain({ query, onNavigate }) {
  const [search, setSearch] = useState(query)
  const searchable = [...modules.filter((m) => m.id !== 'dashboard').map((m) => ({ title: m.label, description: m.desc, type: 'Citizen service', action: m.id })), ...schemes.map((s) => ({ title: s.title, description: s.description, type: s.type, action: 'opportunity-hub', href: s.href })) , ...documents.map((d) => ({ title: `${d.name} document guide`, description: `Guidance and official links from ${d.authority}.`, type: 'Document service', action: 'civic-docs', href: d.href }))]
  const result = searchable.filter((x) => `${x.title} ${x.description} ${x.type}`.toLowerCase().includes(search.toLowerCase()))
  return <div className="module-page"><PageHeading eyebrow="CIVIC BRAIN · SHARED SERVICE SEARCH" title="One search. A clearer next step." description="Search across available service guides, document checklists and official programme links." />
    <div className="brain-search"><Sparkles size={18} /><input autoFocus placeholder="Try “scholarship”, “pothole” or “passport”..." value={search} onChange={(e) => setSearch(e.target.value)} /><button onClick={() => setSearch('')}>Clear</button></div>
    <div className="brain-summary"><span><Sparkles size={14} /> {result.length} helpful starting points</span><small>Results are based on the content available in this demo.</small></div>
    {result.length ? <div className="brain-results">{result.map((item, i) => <button className="brain-result panel" key={`${item.title}-${i}`} onClick={() => item.href ? window.open(item.href, '_blank', 'noopener,noreferrer') : onNavigate(item.action)}><span className="brain-result-icon"><Search size={17} /></span><span><small>{item.type}</small><b>{item.title}</b><p>{item.description}</p></span><ArrowUpRight size={16} /></button>)}</div> : <EmptyState icon={Search} title="Nothing matched that search" text="Try a shorter keyword or browse the service menu." />}
  </div>
}

function CivicDocs() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState([])
  const [reminders, setReminders] = useState(() => readStored('civic-doc-reminders', []))
  const [expiry, setExpiry] = useState('')
  useEffect(() => localStorage.setItem('civic-doc-reminders', JSON.stringify(reminders)), [reminders])
  const filtered = documents.filter((d) => `${d.name} ${d.category}`.toLowerCase().includes(search.toLowerCase()))
  const toggleCheck = (i) => setChecked(checked.includes(i) ? checked.filter((x) => x !== i) : [...checked, i])
  function addReminder(e) { e.preventDefault(); if (!expiry || !selected) return; const item = { id: crypto.randomUUID(), name: selected.name, expiry }; setReminders([item, ...reminders]); setExpiry('') }
  return <div className="module-page"><PageHeading eyebrow="CIVIC DOCS AI · DOCUMENT GUIDANCE" title="Be document-ready." description="Find the right government service guide, prepare a checklist and set a local reminder." action={<span className="small-status"><ShieldCheck size={13} /> Guidance only · no document uploads</span>} />
    <div className="docs-layout"><section className="docs-main"><div className="hub-search docs-search"><Search size={16} /><input placeholder="Find a document service..." value={search} onChange={(e) => setSearch(e.target.value)} /><span>{filtered.length} guides</span></div><div className="document-list">{filtered.map((doc) => <button key={doc.name} className={`document-row panel ${selected?.name === doc.name ? 'document-selected' : ''}`} onClick={() => { setSelected(doc); setChecked([]) }}><span className="document-icon"><FileText size={18} /></span><span><b>{doc.name}</b><small>{doc.category} · {doc.authority}</small></span><ArrowRight size={16} /></button>)}</div>
      <div className="panel reminder-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR DEVICE · LOCAL ONLY</p><h2>Renewal reminders</h2></div><Clock3 size={17} /></div>{reminders.length ? reminders.map((r) => <div className="reminder-row" key={r.id}><span><Bell size={14} /></span><b>{r.name}</b><small>Reminder date · {formatReminderDate(r.expiry)}</small></div>) : <p className="subtle-text">No reminders set. Choose a document guide to add one.</p>}</div>
    </section>    <aside className="panel document-detail">{selected ? <><div className="document-detail-head"><span className="document-icon large"><FileText size={21} /></span><div><p className="eyebrow">{selected.category.toUpperCase()} SERVICE</p><h2>{selected.name}</h2><span>{selected.authority}</span></div></div><p className="detail-intro">A preparation checklist to help you start on the right official service.</p><div className="checklist">{selected.steps.map((step, i) => <button className={`checklist-row ${checked.includes(i) ? 'checked' : ''}`} key={step} onClick={() => toggleCheck(i)}><span className="checkbox">{checked.includes(i) && <Check size={13} />}</span><span>{step}</span></button>)}</div><a className="button-primary full-button" href={selected.href} target="_blank" rel="noreferrer">Open official service <ArrowUpRight size={15} /></a>{selected.alternateHref && <a className="document-alternative" href={selected.alternateHref} target="_blank" rel="noreferrer">If this information site is unavailable: {selected.alternateLabel}<ArrowUpRight size={12} /></a>}<form className="reminder-form" onSubmit={addReminder}><label htmlFor="expiry">Set a reminder for this document</label><div><input id="expiry" aria-label="Reminder date" type="date" min={TODAY} value={expiry} onChange={(e) => setExpiry(e.target.value)} /><button className="button-secondary" disabled={!expiry}>Add reminder</button></div></form><p className="privacy-note"><ShieldCheck size={13} /> Never share OTPs or sensitive identity documents outside official services.</p></> : <EmptyState icon={FileCheck2} title="Choose a document guide" text="Select a service to view its preparation checklist and official link." />}
    </aside></div>
  </div>
}

function CivicAlerts({ alerts, setAlerts, backendOnline, sessionToken }) {
  const [filter, setFilter] = useState('All')
  const [error, setError] = useState('')
  const [integrationStatus, setIntegrationStatus] = useState(null)
  const [preferences, setPreferences] = useState({
    scholarships: true,
    report_updates: true,
    document_reminders: true,
    safety: true,
    browser_push: false,
    email: false,
  })
  const categories = ['All', 'Opportunities', 'Safety', 'Tips', 'Reports']
  const shown = alerts.filter((a) => filter === 'All' || a.category === filter)
  useEffect(() => {
    if (!backendOnline || !sessionToken) return
    request('/notification-preferences', { headers: { 'X-Civic-Session': sessionToken } })
      .then((result) => setPreferences(result.preferences))
      .catch(() => {})
  }, [backendOnline, sessionToken])

  useEffect(() => {
    if (!backendOnline) return
    request('/integrations/status')
      .then(setIntegrationStatus)
      .catch(() => setIntegrationStatus(null))
  }, [backendOnline])

  async function savePreferences(next) {
    setPreferences(next)
    if (!backendOnline) {
      localStorage.setItem('civic-notification-preferences', JSON.stringify(next))
      return
    }
    try {
      await request('/notification-preferences', {
        method: 'PUT',
        headers: { 'X-Civic-Session': sessionToken },
        body: next,
      })
    } catch (error) {
      setError(error.message)
    }
  }

  async function enableBrowserPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('Browser push notifications are not supported by this browser.')
      return
    }
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Browser notification permission was not granted.')
        return
      }
      const registration = await navigator.serviceWorker.register('/sw.js')
      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!publicKey) {
        setError('Push delivery is not configured. Add VAPID keys to the environment.')
        return
      }
      const converted = (key) => {
        const padding = '='.repeat((4 - key.length % 4) % 4)
        const base64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/')
        const raw = atob(base64)
        return Uint8Array.from(raw, (character) => character.charCodeAt(0))
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: converted(publicKey),
      })
      const json = subscription.toJSON()
      await request('/push/subscription', {
        method: 'POST',
        headers: { 'X-Civic-Session': sessionToken },
        body: {
          endpoint: subscription.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
      })
      await savePreferences({ ...preferences, browser_push: true })
      setError('')
    } catch (error) {
      setError(error.message || 'Browser push setup failed.')
    }
  }
  async function markRead(id) {
    if (backendOnline && sessionToken && id.startsWith('NT-')) {
      try {
        await request(`/notifications/${id}/read`, {
          method: 'PATCH',
          headers: { 'X-Civic-Session': sessionToken },
        })
      }
      catch (e) { setError(e.message); return }
    }
    setAlerts(alerts.map((a) => a.id === id ? { ...a, read: true } : a))
  }
  async function markAllRead() {
    try {
      if (backendOnline && sessionToken) {
        for (const alert of alerts.filter((item) => !item.read && item.id.startsWith('NT-'))) {
          await request(`/notifications/${alert.id}/read`, {
            method: 'PATCH',
            headers: { 'X-Civic-Session': sessionToken },
          })
        }
      }
      setAlerts(alerts.map((a) => ({ ...a, read: true })))
      setError('')
    } catch (e) { setError(e.message) }
  }
  return <div className="module-page"><PageHeading eyebrow="CIVIC ALERT · NOTIFICATION CENTRE" title="The updates you asked to see." description="Manage in-app reminders and useful service nudges, saved on this device." action={<button className="button-secondary" onClick={markAllRead}><CheckCheck size={15} /> Mark all read</button>} />
    <div className="alerts-layout"><section className="panel alert-list"><div className="filter-chips alert-filters">{categories.map((c) => <button className={filter === c ? 'chip-active' : ''} key={c} onClick={() => setFilter(c)}>{c}</button>)}</div>{error && <p className="inline-error">{error}</p>}{shown.length ? shown.map((a) => <button key={a.id} onClick={() => markRead(a.id)} className={`alert-row ${a.read ? 'is-read' : ''}`}><span className={`alert-symbol ${a.category === 'Safety' ? 'violet' : a.category === 'Opportunities' ? 'green' : 'blue'}`}>{a.category === 'Safety' ? <ShieldCheck size={17} /> : a.category === 'Opportunities' ? <GraduationCap size={17} /> : <Lightbulb size={17} />}</span><span className="alert-copy"><span><b>{a.title}</b>{!a.read && <i className="unread-dot" />}</span><p>{a.detail}</p><small>{a.category} · {a.time}</small></span><MoreHorizontal size={16} /></button>) : <EmptyState icon={Bell} title="No notifications here" text="Try a different category filter." />}</section>
      <aside className="panel notification-settings"><p className="eyebrow">YOUR PREFERENCES</p><h3>Keep it useful.</h3><p>Choose which kinds of updates you want to explore. Account preferences are stored by the API.</p>{[
        ['Scholarships & schemes', 'scholarships', 'New opportunities and deadlines'],
        ['Civic report changes', 'report_updates', 'Updates on your submitted reports'],
        ['Document reminders', 'document_reminders', 'Reminders you create'],
        ['Safety tips', 'safety', 'Source and scam awareness'],
      ].map(([item, key, description]) => <label className="preference-row" key={item}><span>{item}<small>{description}</small></span><input type="checkbox" checked={preferences[key]} onChange={(event) => savePreferences({ ...preferences, [key]: event.target.checked })} /></label>)}
      <button type="button" className="button-secondary full-button" onClick={enableBrowserPush}><Bell size={14} /> Enable browser push</button>
      <label className="preference-row"><span>Email notifications<small>Deadline and scheme updates</small></span><input type="checkbox" checked={preferences.email} onChange={(event) => savePreferences({ ...preferences, email: event.target.checked })} /></label>
      <p className="privacy-note"><Bell size={13} /> {integrationStatus?.browser_push?.message || 'Browser push configuration status is unavailable.'}</p>
      <p className="privacy-note"><Bell size={13} /> {integrationStatus?.smtp?.message || 'Email delivery configuration status is unavailable.'}</p>
      <p className="privacy-note"><Bell size={13} /> SMS and WhatsApp require provider credentials and remain disabled until configured.</p></aside></div>
  </div>
}

function Bengaluru({ onNavigate }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [route, setRoute] = useState(null)
  const [issue, setIssue] = useState('')
  const [sent, setSent] = useState(false)
  const [liveStatus, setLiveStatus] = useState(null)
  useEffect(() => {
    request('/transport/bmtc-live')
      .then(setLiveStatus)
      .catch(() => setLiveStatus({
        live_tracking_available: false,
        message: 'BMTC live-status service could not be reached.',
      }))
  }, [])
  const services = [
    { name: 'Property tax', desc: 'Pay property tax through the official BBMP tax portal.', href: BBMP_PROPERTY_TAX_URL, fallback: 'BBMP tax service centers', fallbackHref: BBMP_TAX_CENTERS_URL, icon: Building2 },
    { name: 'Property-tax grievance', desc: 'Submit a grievance through the BBMP property-tax portal.', href: BBMP_TAX_GRIEVANCE_URL, fallback: 'Karnataka public grievance service', fallbackHref: KARNATAKA_IPGRS_URL, icon: MessageCircle },
    { name: 'Khata & trade licence', desc: 'Check BBMP information and service guidance.', href: BBMP_INFO_URL, fallback: 'Karnataka One service directory', fallbackHref: KARNATAKA_ONE_URL, icon: FileCheck2 },
    { name: 'Water & drainage', desc: 'Official BWSSB water and drainage information.', href: 'https://bwssb.karnataka.gov.in/', fallback: 'BWSSB helpline: 1916', fallbackHref: 'https://bwssb.karnataka.gov.in/237/helpline-numbers:-/en', icon: CloudSun },
    { name: 'Birth & death certificates', desc: 'Find the Karnataka civil-registration service and Bengaluru municipal guidance.', href: SEVA_SINDHU_URL, fallback: 'BBMP information and ward services', fallbackHref: BBMP_INFO_URL, icon: FileText },
    { name: 'Civic grievances', desc: 'Use Karnataka’s public grievance service for eligible state-government matters.', href: KARNATAKA_IPGRS_URL, fallback: 'Karnataka One service directory', fallbackHref: KARNATAKA_ONE_URL, icon: MessageCircle },
  ]
  async function findRoute(e) {
    e.preventDefault()
    setRoute(null)
    setIssue('')
    try {
      const [fromResult, toResult] = await Promise.all([
        request(`/transport/geocode?q=${encodeURIComponent(from)}`),
        request(`/transport/geocode?q=${encodeURIComponent(to)}`),
      ])
      if (!fromResult.results?.length || !toResult.results?.length) {
        setRoute({ from, to, route: 'Location not found', note: 'Try a more specific Bengaluru landmark or street name.' })
        return
      }
      const start = fromResult.results[0]
      const end = toResult.results[0]
      const calculated = await request(`/transport/route?from_lat=${start.lat}&from_lon=${start.lon}&to_lat=${end.lat}&to_lon=${end.lon}`)
      setRoute({
        from: start.name,
        to: end.name,
        route: `${(calculated.distance_meters / 1000).toFixed(1)} km · About ${Math.max(1, Math.round(calculated.duration_seconds / 60))} min driving`,
        note: 'Real road geometry from OpenStreetMap/OSRM. This is driving guidance, not live BMTC bus data.',
        geometry: calculated.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || [],
      })
    } catch (error) {
      setRoute({ from, to, route: 'Route service unavailable', note: error.message || 'Please try again or use the official BMTC portal.' })
    }
  }
  function sendFeedback(e) { e.preventDefault(); if (!issue.trim()) return; setSent(true); setIssue('') }
  return <div className="module-page"><PageHeading eyebrow="BENGALURU 360 · CITY & TRANSPORT" title="Your city, a little easier to navigate." description="Bengaluru service links, real driving route search and a quick path to report local issues." action={<a className="button-secondary" href="https://mybmtc.karnataka.gov.in/" target="_blank" rel="noreferrer"><BusFront size={15} /> Official BMTC <ArrowUpRight size={13} /></a>} />
    <div className="city-hero"><div><span className="city-label"><MapPin size={14} /> BENGALURU, KARNATAKA</span><h2>A better day starts with knowing where to go.</h2><p>Official service portals and helpful guidance, together in one place.</p></div><span className="city-illustration"><Building2 size={57} strokeWidth={1.1} /><Bike size={30} /></span></div>
    <div className="city-columns">    <div className="panel route-panel"><div className="panel-heading"><div><p className="eyebrow">DRIVING ROUTE LOOKUP</p><h2>Where are you headed?</h2></div><BusFront size={19} /></div><form className="route-form" onSubmit={findRoute}><label>From<input required placeholder="e.g. Majestic" value={from} onChange={(e) => setFrom(e.target.value)} /></label><span className="route-connector"><ArrowDownRight size={15} /></span><label>To<input required placeholder="e.g. Indiranagar" value={to} onChange={(e) => setTo(e.target.value)} /></label><button className="button-primary"><Search size={15} /> Find route</button></form>{route && <div className="route-result"><span><TrainFront size={17} /></span><div><b>{route.route}</b><p>{route.from} → {route.to}</p><small>{route.note}</small></div></div>}<div className="map-frame"><MapContainer center={[12.9716, 77.5946]} zoom={12} scrollWheelZoom={false} aria-label="OpenStreetMap view of Bengaluru"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><CircleMarker center={[12.9716, 77.5946]} radius={8} pathOptions={{ color: '#b9704e', fillColor: '#dc9771', fillOpacity: 0.9 }}><Popup>Bengaluru city reference point. This is not a live incident marker.</Popup></CircleMarker>{route?.geometry?.length > 0 && <Polyline positions={route.geometry} pathOptions={{ color: '#167f79', weight: 5 }} />}</MapContainer><span className="map-label"><MapPin size={13} /> BENGALURU · CITY REFERENCE</span><span className="map-legend"><i /> No live incident data</span></div>        <p className="privacy-note"><CircleHelp size={13} /> Road geometry is obtained from OpenStreetMap. BMTC bus routes, fares and disruption data are not connected.</p>
    {liveStatus && <div className="route-result"><span><BusFront size={17} /></span><div><b>BMTC Live Tracker</b><p>{liveStatus.live_tracking_available ? 'Live feed connected' : 'Live tracking unavailable'}</p><small>{liveStatus.message}</small></div></div>}</div>
      <aside className="city-side"><div className="portal-availability-note"><span><CircleHelp size={17} /></span><div><b>Use trusted service links</b><p>The older bbmp.gov.in address is not used after the reported certificate error. If the BBMP information site is unavailable, use Karnataka One or the service-specific tax and grievance links below.</p><div><a href={BBMP_INFO_URL} target="_blank" rel="noopener noreferrer">BBMP information<ArrowUpRight size={12} /></a><a href={KARNATAKA_ONE_URL} target="_blank" rel="noopener noreferrer">Karnataka One fallback<ArrowUpRight size={12} /></a></div></div></div><div className="panel city-services"><div className="panel-heading"><div><p className="eyebrow">MUNICIPAL QUICK LINKS</p><h2>City services</h2></div></div>{services.map((item) => { const Icon = item.icon; return <div className="city-service-item" key={item.name}><a className="city-service-row" href={item.href} target="_blank" rel="noopener noreferrer"><span><Icon size={16} /></span><div><b>{item.name}</b><small>{item.desc}</small></div><ArrowUpRight size={14} /></a>{item.fallback && <a className="city-service-fallback" href={item.fallbackHref} target="_blank" rel="noopener noreferrer">Alternative: {item.fallback}<ArrowUpRight size={12} /></a>}</div>})}</div>
      <div className="panel transit-feedback"><p className="eyebrow">TRANSIT FEEDBACK</p><h3>Something to tell BMTC?</h3><form onSubmit={sendFeedback}><textarea rows="3" placeholder="Share bus cleanliness or service feedback..." value={issue} onChange={(e) => { setIssue(e.target.value); setSent(false) }} /><button className="button-secondary" disabled={!issue.trim()}><Send size={14} /> Save feedback locally</button></form>{sent && <small className="success-note"><Check size={13} /> Saved on this device. Not sent to BMTC.</small>}</div></aside></div>
    <div className="city-report-banner"><span><MapPin size={17} /></span><div><b>See a pothole, leak or missed collection?</b><small>Send a location-based civic report and keep its tracking reference.</small></div><button className="button-primary" onClick={() => onNavigate('civic-eye')}>Report an issue <ArrowRight size={14} /></button></div>
  </div>
}

function TravelHub({ sessionToken, language }) {
  const [query, setQuery] = useState('')
  const [state, setState] = useState('')
  const [category, setCategory] = useState('')
  const [data, setData] = useState({ destinations: [], states: [], categories: [] })
  const [selected, setSelected] = useState(null)
  const [travelDate, setTravelDate] = useState(TODAY)
  const [returnDate, setReturnDate] = useState('')
  const [visitors, setVisitors] = useState(1)
  const [history, setHistory] = useState([])
  const [issue, setIssue] = useState('')
  const [loadedFilterKey, setLoadedFilterKey] = useState('')
  const [plan, setPlan] = useState('')
  const [planAnswer, setPlanAnswer] = useState('')
  const filterKey = new URLSearchParams({ q: query, state, category }).toString()
  const loading = filterKey !== loadedFilterKey

  useEffect(() => {
    let active = true
    request(`/travel/destinations?${filterKey}`)
      .then((result) => { if (active) { setData(result); setIssue(''); setLoadedFilterKey(filterKey) } })
      .catch((error) => { if (active) { setIssue(error.message); setLoadedFilterKey(filterKey) } })
    return () => { active = false }
  }, [filterKey])

  useEffect(() => {
    if (!sessionToken) return
    request('/travel/booking-history', { headers: { 'X-Civic-Session': sessionToken } })
      .then((result) => setHistory(result.bookings || []))
      .catch((error) => setIssue(error.message))
  }, [sessionToken])

  async function savePlan() {
    setIssue('')
    if (!selected) return
    if (!sessionToken) { setIssue('Log in to save this outbound provider link to your account.'); return }
    try {
      const result = await request('/travel/booking-intents', {
        method: 'POST',
        headers: { 'X-Civic-Session': sessionToken },
        body: {
          destination_id: selected.id,
          destination_name: selected.name,
          provider_name: selected.provider,
          provider_url: selected.provider_url,
          travel_date: travelDate,
          return_date: returnDate,
          visitors: Number(visitors),
        },
      })
      setIssue(result.message)
      setHistory((current) => [{
        id: result.intent_id,
        destination_name: selected.name,
        provider_name: selected.provider,
        provider_url: result.booking_url,
        travel_date: travelDate,
        return_date: returnDate,
        visitors,
        status: result.status,
        created_at: new Date().toISOString(),
      }, ...current])
    } catch (error) {
      setIssue(error.message)
    }
  }

  async function makeItinerary(event) {
    event.preventDefault()
    setPlanAnswer('')
    try {
      const result = await request('/chat', {
        method: 'POST',
        body: {
          message: `Suggest a practical travel itinerary and budget-planning checklist for: ${plan}. Never invent live prices, opening hours, available tickets, transport schedules, or booking confirmations. Mark estimates as illustrative and direct me to official sources.`,
          language,
          current_page: 'travel-hub',
          context: 'Travel planning only. Do not claim real-time availability, pricing, confirmed reservations, or payment status.',
        },
      })
      setPlanAnswer(`${result.answer}\n\n${result.source}`)
    } catch (error) {
      setIssue(error.message)
    }
  }

  return <div className="module-page"><PageHeading eyebrow="CIVIC TRAVEL & BOOKING HUB" title="Explore India, using trusted starting points." description="Discover destinations and continue to listed provider portals. Live availability, fares, payments and confirmations are not supplied by Civic Pulse." />
    <div className="travel-disclaimer"><ShieldCheck size={16} /><span>Official portal redirection – direct booking is not available through CIVIC PULSE 360. Directory information only · Availability, prices and slots are not supplied · Civic Pulse does not issue booking confirmations, payments, QR tickets, cancellations or refunds.</span></div>
    <section className="panel travel-provider-panel"><p className="eyebrow">TRANSPORT & STAY PORTALS</p><div className="travel-provider-links">
      {[
        ['Indian Railways', 'https://www.irctc.co.in/nget/train-search'],
        ['IRCTC Tourism', 'https://www.irctctourism.com/'],
        ['KSRTC', 'https://ksrtc.in/'],
        ['Incredible India', 'https://www.incredibleindia.gov.in/'],
      ].map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label}<ArrowUpRight size={13} /></a>)}
      </div><small>These links open external provider sites. If the IRCTC train-search page times out, retry the official link or use support/contact details published on IRCTC itself. Civic Pulse does not query trains or seat availability. Public-parking reservations, accommodation/package inventory and state-bus availability are not integrated. No prices, slots or QR tickets are supplied here.</small></section>
    <div className="travel-layout"><section className="travel-main">
      <div className="panel travel-search"><div className="panel-heading"><div><p className="eyebrow">ALL-INDIA DESTINATIONS</p><h2>Find somewhere to go.</h2></div><Globe2 size={19} /></div>
        <div className="travel-filters"><label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Destination or state" /></label><label>State<select value={state} onChange={(event) => setState(event.target.value)}><option value="">All listed states</option>{data.states.map((item) => <option key={item}>{item}</option>)}</select></label><label>Type<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All types</option>{data.categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
        {issue && <p className="inline-error">{issue}</p>}
        {loading ? <p className="privacy-note">Loading the destination directory…</p> : <div className="travel-destination-grid">{data.destinations.map((item) => <article className={`panel travel-destination ${selected?.id === item.id ? 'travel-selected' : ''}`} key={item.id}>
          <div className="travel-card-top"><span className="travel-card-icon"><MapPin size={16} /></span><small>{item.state}</small></div><h3>{item.name}</h3><p>{item.category}</p><small>Source: <a href={item.source_url} target="_blank" rel="noopener noreferrer">{item.source}<ArrowUpRight size={11} /></a></small><div className="travel-metadata"><span>Availability: not provided</span><span>Pricing: check provider</span></div><button className="button-secondary" onClick={() => setSelected(item)}>{selected?.id === item.id ? 'Selected' : 'Plan this visit'}</button>
        </article>)}</div>}
        {!loading && !data.destinations.length && <EmptyState icon={MapPin} title="No listed destinations match" text="Try changing the search or filters." />}
      </div>
      {selected && <div className="panel travel-book-panel"><p className="eyebrow">PLAN · {selected.name.toUpperCase()}</p><div className="travel-date-fields"><label>Visit date<input type="date" min={TODAY} value={travelDate} onChange={(event) => setTravelDate(event.target.value)} /></label><label>Return date<input type="date" min={travelDate} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} /></label><label>Visitors<input type="number" min="1" max="30" value={visitors} onChange={(event) => setVisitors(event.target.value)} /></label></div><p className="privacy-note">No slots or prices are available here. Your next step is an external link to {selected.provider}; booking, payment and confirmation must occur there.</p><button className="button-primary" onClick={savePlan}>Save provider link <ArrowUpRight size={14} /></button>      <a className="travel-provider-cta" href={selected.provider_url} target="_blank" rel="noopener noreferrer">Open {selected.provider}<ArrowUpRight size={13} /></a></div>}
    </section>
    <aside className="travel-side">
      <section className="panel travel-itinerary"><p className="eyebrow">AI TRAVEL ASSISTANT</p><h3>Plan a route and budget checklist.</h3><p>Suggestions are not live fare quotes, provider availability or confirmed bookings.</p><form onSubmit={makeItinerary}><textarea value={plan} onChange={(event) => setPlan(event.target.value)} placeholder="e.g. 3 days in Hampi for two adults, starting in Bengaluru" required minLength={5} /><button className="button-secondary"><Sparkles size={14} /> Generate guidance</button></form>{planAnswer && <p className="travel-ai-answer">{planAnswer}</p>}</section>
      <section className="panel travel-history"><p className="eyebrow">MY TRAVEL LINKS</p><h3>Booking history</h3>{!sessionToken ? <p className="privacy-note">Log in to keep outbound provider links with your account.</p> : history.length ? history.map((item) => <div className="travel-history-row" key={item.id}><b>{item.destination_name}</b><small>{item.provider_name} · {item.travel_date} · {item.visitors} visitor(s)</small><small>Status: {item.status === 'redirected_to_provider' ? 'External link recorded; not confirmed' : item.status}</small></div>) : <p className="privacy-note">No provider links recorded yet.</p>}</section>
    </aside></div>
  </div>
}

const REGIONAL_CATEGORY_SLUGS = {
  'Weather and rainfall': 'weather',
  'Traffic and roads': 'traffic',
  'Accidents and closures': 'accidents',
  'Public transport': 'public-transport',
  'Bus services': 'bus-service',
  'Bus service': 'bus-service',
  'Rail services': 'rail-service',
  'Rail service': 'rail-service',
  'Water supply': 'water-supply',
  'Electricity': 'electricity',
  'Air quality': 'air-quality',
  'Parking': 'parking',
  'Civic complaints': 'complaints',
  'Road damage': 'road-damage',
  'Government services': 'government-services',
  'Tourist attractions': 'tourist-attractions',
  'Emergency and disaster alerts': 'emergency-alerts',
}

const REFRESHABLE_REGIONAL_CATEGORIES = new Set(['Weather and rainfall', 'Air quality'])

function regionalStatusLabel(item) {
  if (item.category === 'Civic complaints' || item.category === 'Road damage') return 'Civic records'
  if (item.category === 'Government services' || item.category === 'Tourist attractions') return 'Directory'
  if (item.status === 'live') return 'Measured'
  return (item.status || 'unavailable').replaceAll('_', ' ')
}

function CategoryLiveView({ category, data, onNavigate }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <p className="privacy-note">
        Information is temporarily unavailable for this category. Please try again later.
      </p>
    )
  }

  switch (category) {
    case 'Weather and rainfall':
      return (
        <div className="category-live-details">
          <div className="category-metrics-grid">
            <div className="category-metric-card">
              <span>Temperature</span>
              <b>{data.temperature_c ?? '--'}°C</b>
              <small>Feels {data.apparent_temperature_c ?? '--'}°C</small>
            </div>
            <div className="category-metric-card">
              <span>Humidity</span>
              <b>{data.relative_humidity_pct ?? data.humidity ?? '--'}%</b>
            </div>
            <div className="category-metric-card">
              <span>Wind Speed</span>
              <b>{data.wind_speed_kmh ?? data.wind_speed ?? '--'} km/h</b>
            </div>
            <div className="category-metric-card">
              <span>Precipitation</span>
              <b>{data.rainfall_mm ?? 0} mm</b>
            </div>
          </div>
          {data.hourly_forecast?.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: '8px', marginBottom: '4px' }}>HOURLY FORECAST (NEXT 12 HOURS)</p>
              <div className="hourly-chips">
                {data.hourly_forecast.slice(0, 12).map((h, idx) => (
                  <div className="hourly-chip" key={idx}>
                    <span>{h.time}</span>
                    <b>{h.temperature_c}°C</b>
                    <small>{h.precipitation_probability_pct}% rain</small>
                  </div>
                ))}
              </div>
            </>
          )}
          {data.daily_forecast?.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: '8px', marginBottom: '4px' }}>5-DAY FORECAST</p>
              <div className="category-metrics-grid">
                {data.daily_forecast.map((d, idx) => (
                  <div className="category-metric-card" key={idx}>
                    <span>{d.date}</span>
                    <b>{d.temperature_max_c}° / {d.temperature_min_c}°</b>
                    <small>{d.precipitation_sum_mm} mm</small>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )

    case 'Air quality':
      return (
        <div className="category-live-details">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>AIR QUALITY INDEX (OPEN-METEO)</p>
              <h2 style={{ margin: '2px 0', fontSize: '16px', color: 'var(--heading)' }}>
                {data.aqi_index ?? '--'} · <span style={{ color: 'var(--teal)' }}>{data.aqi_category || 'Moderate'}</span>
              </h2>
            </div>
          </div>
          <div className="category-metrics-grid">
            <div className="category-metric-card">
              <span>PM2.5</span>
              <b>{data.pollutants?.pm2_5?.value ?? '--'}</b>
              <small>µg/m³</small>
            </div>
            <div className="category-metric-card">
              <span>PM10</span>
              <b>{data.pollutants?.pm10?.value ?? '--'}</b>
              <small>µg/m³</small>
            </div>
            <div className="category-metric-card">
              <span>NO₂</span>
              <b>{data.pollutants?.nitrogen_dioxide?.value ?? '--'}</b>
              <small>µg/m³</small>
            </div>
            <div className="category-metric-card">
              <span>Ozone (O₃)</span>
              <b>{data.pollutants?.ozone?.value ?? '--'}</b>
              <small>µg/m³</small>
            </div>
            <div className="category-metric-card">
              <span>CO</span>
              <b>{data.pollutants?.carbon_monoxide?.value ?? '--'}</b>
              <small>µg/m³</small>
            </div>
            <div className="category-metric-card">
              <span>SO₂</span>
              <b>{data.pollutants?.sulphur_dioxide?.value ?? '--'}</b>
              <small>µg/m³</small>
            </div>
          </div>
          {data.health_advisory && (
            <p className="auth-disclosure-note" style={{ borderLeftColor: 'var(--teal)' }}>
              <b>Health Advisory:</b> {data.health_advisory}
            </p>
          )}
        </div>
      )

    case 'Traffic and roads':
      return (
        <div className="category-live-details">
          <p className="eyebrow">MONITORED TRAFFIC CORRIDORS</p>
          <div className="category-sublist">
            {data.monitored_corridors?.map((corridor, idx) => (
              <div className="category-sublist-item" key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{corridor.name}</b>
                  <span className={`status-tag status-${corridor.status === 'Congested' ? 'delayed' : 'live'}`}>
                    {corridor.status} ({corridor.average_speed_kmh} km/h)
                  </span>
                </div>
                <p>{corridor.advisory}</p>
              </div>
            ))}
          </div>
          {data.advisories?.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: '10px' }}>BTP OFFICIAL TRAFFIC ADVISORIES</p>
              <div className="category-sublist">
                {data.advisories.map((adv, idx) => (
                  <div className="category-sublist-item" key={idx}>
                    <b>{adv.title}</b>
                    <p>{adv.detail}</p>
                    <small>Issued {adv.published_at}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          {data.missing_authorization && (
            <p className="auth-disclosure-note">
              <b>Access Note:</b> {data.missing_authorization}
            </p>
          )}
        </div>
      )

    case 'Accidents and closures':
      return (
        <div className="category-live-details">
          <p className="eyebrow">ACTIVE INCIDENTS & ROAD CLOSURES</p>
          <div className="category-sublist">
            {data.active_incidents?.map((inc, idx) => (
              <div className="category-sublist-item" key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{inc.title}</b>
                  <span className="status-tag status-delayed">{inc.impact}</span>
                </div>
                <p><b>Location:</b> {inc.road} ({inc.location})</p>
                <p>{inc.detail}</p>
                <small>{inc.time} · Source: {inc.source}</small>
              </div>
            ))}
            {data.planned_closures?.map((closure, idx) => (
              <div className="category-sublist-item" key={idx}>
                <b>{closure.title}</b>
                <p><b>Affected:</b> {closure.affected_stretch}</p>
                <p><b>Alternate:</b> {closure.alternate_route}</p>
                <small>Dates: {closure.dates} · Reason: {closure.reason}</small>
              </div>
            ))}
          </div>
          {data.emergency_helpline && (
            <p className="auth-disclosure-note" style={{ marginTop: '8px' }}>
              <b>Police Helpline:</b> {data.emergency_helpline}
            </p>
          )}
        </div>
      )

    case 'Bus services':
    case 'Bus service':
      return (
        <div className="category-live-details">
          <p className="eyebrow">MONITORED BMTC ROUTES & SCHEDULES</p>
          <div className="category-sublist">
            {data.monitored_routes?.map((route, idx) => (
              <div className="category-sublist-item" key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>Route {route.route_no} ({route.service_type})</b>
                  <span className="status-tag status-scheduled">{route.fare_range}</span>
                </div>
                <p>{route.origin} ➔ {route.destination} (via {route.via})</p>
                <small>Frequency: Every {route.frequency_mins} mins · Operating: {route.first_bus} to {route.last_bus}</small>
              </div>
            ))}
          </div>
          {data.pass_tariffs?.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: '10px' }}>BMTC PASS TARIFFS</p>
              <div className="category-metrics-grid">
                {data.pass_tariffs.map((p, idx) => (
                  <div className="category-metric-card" key={idx}>
                    <span>{p.pass_type}</span>
                    <b>{p.price_inr}</b>
                    <small>{p.description}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          {data.shakti_scheme && (
            <p className="auth-disclosure-note" style={{ borderLeftColor: 'var(--teal)' }}>
              <b>Shakti Scheme:</b> {data.shakti_scheme.details}
            </p>
          )}
          {data.bmtc_helpline && (
            <small style={{ display: 'block', marginTop: '6px', color: 'var(--muted)' }}>
              BMTC Helpline: {data.bmtc_helpline}
            </small>
          )}
        </div>
      )

    case 'Water supply':
      return (
        <div className="category-live-details">
          <p className="eyebrow">BWSSB WATER SUPPLY ADVISORIES</p>
          <div className="category-sublist">
            {data.maintenance_advisories?.map((adv, idx) => (
              <div className="category-sublist-item" key={idx}>
                <b>{adv.area}</b>
                <p><b>Reason:</b> {adv.reason}</p>
                <p><b>Affected Wards:</b> {adv.affected_wards}</p>
                <small>Date: {adv.date} ({adv.duration}) · Tanker Support: {adv.tanker_support}</small>
              </div>
            ))}
          </div>
          {data.helpline && (
            <p className="auth-disclosure-note">
              <b>BWSSB Helpline:</b> {data.helpline} | {data.water_conservation_tips}
            </p>
          )}
        </div>
      )

    case 'Electricity':
      return (
        <div className="category-live-details">
          <p className="eyebrow">BESCOM SCHEDULED FEEDER MAINTENANCE</p>
          <div className="category-sublist">
            {data.maintenance_schedule?.map((pow, idx) => (
              <div className="category-sublist-item" key={idx}>
                <b>Substation: {pow.substation} — Feeder: {pow.feeder}</b>
                <p><b>Affected:</b> {pow.affected_areas}</p>
                <small>Date: {pow.date} · Hours: {pow.hours} · Reason: {pow.reason}</small>
              </div>
            ))}
          </div>
          {data.helpline && (
            <p className="auth-disclosure-note">
              <b>BESCOM 24x7 Helpline:</b> {data.helpline}
            </p>
          )}
        </div>
      )

    case 'Public transport':
      return (
        <div className="category-live-details">
          <p className="eyebrow">NAMMA METRO & TRANSIT NETWORK</p>
          <div className="category-sublist">
            {data.namma_metro?.lines?.map((line, idx) => (
              <div className="category-sublist-item" key={idx}>
                <b>{line.name} ({line.color})</b>
                <p>Stretch: {line.stretch} ({line.stations_count} stations)</p>
                <small>Operating: {line.first_train} - {line.last_train} | Peak Headway: {line.peak_headway}</small>
              </div>
            ))}
          </div>
          {data.multimodal_hubs?.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: '10px' }}>MAJOR INTERCHANGE HUBS</p>
              <div className="category-sublist">
                {data.multimodal_hubs.map((hub, idx) => (
                  <div className="category-sublist-item" key={idx}>
                    <b>{hub.hub}</b>
                    <p>Modes: {hub.modes}</p>
                    <small>{hub.features}</small>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )

    case 'Rail services':
    case 'Rail service':
      return (
        <div className="category-live-details">
          <p className="eyebrow">SOUTH WESTERN RAILWAY (SWR) TERMINALS</p>
          <div className="category-sublist">
            {data.major_stations?.map((stn, idx) => (
              <div className="category-sublist-item" key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{stn.name} ({stn.code})</b>
                  <span className="status-tag status-scheduled">{stn.platforms} platforms</span>
                </div>
                <small>Enquiry: {stn.enquiry_number} · Division: {stn.division}</small>
              </div>
            ))}
          </div>
          {data.commuter_rail?.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: '10px' }}>COMMUTER & SUBURBAN TRAINS (MEMU)</p>
              <div className="category-sublist">
                {data.commuter_rail.map((cr, idx) => (
                  <div className="category-sublist-item" key={idx}>
                    <b>{cr.train_no} - {cr.name}</b>
                    <p>{cr.route}</p>
                    <small>Frequency: {cr.frequency} · Type: {cr.type}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          {data.ntes_helpline && (
            <p className="auth-disclosure-note">
              <b>Railway Enquiry:</b> {data.ntes_helpline} | Tracking: <a href={data.official_portal} target="_blank" rel="noopener noreferrer">NTES Portal <ArrowUpRight size={10} /></a>
            </p>
          )}
        </div>
      )

    case 'Parking':
      return (
        <div className="category-live-details">
          <p className="eyebrow">MUNICIPAL & SMART PARKING DIRECTORY</p>
          <div className="category-sublist">
            {data.facilities?.map((f, idx) => (
              <div className="category-sublist-item" key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{f.name}</b>
                  <span className="status-tag status-directory">{f.hourly_rate_inr}</span>
                </div>
                <p>{f.address} · Type: {f.type}</p>
                <small>Capacity: {f.capacity_cars} cars, {f.capacity_twowheelers} two-wheelers · Hours: {f.operating_hours}</small>
              </div>
            ))}
          </div>
          <p className="auth-disclosure-note">
            <b>Directory Notice:</b> {data.directory_note || 'Verified municipal parking locations and standard tariffs. Live sensor vacancy requires BBMP IoT feed integration.'}
          </p>
        </div>
      )

    case 'Civic complaints':
      return (
        <div className="category-live-details">
          <p className="eyebrow">CIVIC EYE GRIEVANCE SUMMARY</p>
          <div className="category-metrics-grid">
            <div className="category-metric-card">
              <span>Active Reports</span>
                <b>{data.total_active_complaints ?? data.total_complaints ?? 0}</b>
            </div>
            <div className="category-metric-card">
              <span>Pending</span>
                <b>{data.pending_complaints ?? data.pending_submitted ?? 0}</b>
            </div>
            <div className="category-metric-card">
              <span>Investigating</span>
                <b>{data.investigating_complaints ?? data.in_progress ?? 0}</b>
            </div>
            <div className="category-metric-card">
              <span>Resolved</span>
                <b>{data.resolved_complaints ?? data.resolved ?? 0}</b>
            </div>
          </div>
          {data.recent_complaints?.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: '10px' }}>RECENT COMMUNITY COMPLAINTS</p>
              <div className="category-sublist">
                {data.recent_complaints.map((c, idx) => (
                  <div className="category-sublist-item" key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b>{c.category}</b>
                      <span className={`status-tag status-${c.status === 'Resolved' ? 'live' : 'delayed'}`}>{c.status}</span>
                    </div>
                    <p>{c.description}</p>
                    <small>{c.location} · {c.created_at}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          <button
            type="button"
            className="button-secondary"
            style={{ marginTop: '8px', width: '100%' }}
            onClick={() => onNavigate('civic-eye')}
          >
            File or Track Grievance in Civic Eye
          </button>
        </div>
      )

    case 'Road damage':
      return (
        <div className="category-live-details">
          <p className="eyebrow">ROAD DAMAGE & POTHOLE TRACKER</p>
          <div className="category-metrics-grid">
            <div className="category-metric-card">
              <span>Total Reports</span>
              <b>{data.total_road_damage_reports ?? 0}</b>
            </div>
            <div className="category-metric-card">
              <span>Potholes</span>
              <b>{data.potholes_reported ?? 0}</b>
            </div>
            <div className="category-metric-card">
              <span>In Progress</span>
              <b>{data.repairs_in_progress ?? 0}</b>
            </div>
            <div className="category-metric-card">
              <span>Repaired</span>
              <b>{data.fixed ?? 0}</b>
            </div>
          </div>
          {data.known_hotspots?.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: '10px' }}>REPORTED DAMAGE HOTSPOTS</p>
              <div className="category-sublist">
                {data.known_hotspots.map((h, idx) => (
                  <div className="category-sublist-item" key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b>{h.location}</b>
                      <span className="status-tag status-delayed">{h.status}</span>
                    </div>
                    <p>{h.description}</p>
                    <small>Reported {h.reported_date}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          <button
            type="button"
            className="button-secondary"
            style={{ marginTop: '8px', width: '100%' }}
            onClick={() => onNavigate('civic-eye')}
          >
            Report Road Damage in Civic Eye
          </button>
        </div>
      )

    case 'Government services':
      return (
        <div className="category-live-details">
          <p className="eyebrow">KARNATAKA CITIZEN SCHEMES & SEVA SINDHU</p>
          <div className="category-sublist">
            {data.schemes?.map((scheme, idx) => (
              <div className="category-sublist-item" key={idx}>
                <b>{scheme.name} ({scheme.department})</b>
                <p>{scheme.description || scheme.benefit}</p>
                <small><b>Eligibility:</b> {scheme.eligibility}</small><br />
                <small><b>Benefits:</b> {scheme.benefits || scheme.benefit}</small>
                {(scheme.application_url || scheme.application_portal) && (
                  <div>
                    <a href={scheme.application_url || scheme.application_portal} target="_blank" rel="noopener noreferrer">
                      Apply via Official Portal <ArrowUpRight size={10} />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
          {data.helpline && (
            <p className="auth-disclosure-note">
              <b>Citizen Assistance Helpline:</b> {data.helpline}
            </p>
          )}
        </div>
      )

    case 'Tourist attractions':
      return (
        <div className="category-live-details">
          <p className="eyebrow">VERIFIED DESTINATIONS & MONUMENTS</p>
          <div className="category-sublist">
            {data.attractions?.map((attr, idx) => (
              <div className="category-sublist-item" key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{attr.name}</b>
                </div>
                <p>{attr.location} — {attr.highlights}</p>
                {(attr.booking_url || attr.official_portal) && (
                  <div>
                    <a href={attr.booking_url || attr.official_portal} target="_blank" rel="noopener noreferrer">
                      Official information <ArrowUpRight size={10} />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
          {data.tourism_helpline && (
            <p className="auth-disclosure-note">
              <b>Tourism Information:</b> {data.tourism_helpline} · {data.ticketing_guidance}
            </p>
          )}
        </div>
      )

    case 'Emergency and disaster alerts':
      return (
        <div className="category-live-details">
          <div className="alert-urgent-box">
            <b>CURRENT ALERT LEVEL: {data.alert_level || 'ADVISORY'}</b>
          </div>
          {data.active_alerts?.length > 0 && (
            <div className="category-sublist">
              {data.active_alerts.map((al, idx) => (
                <div className="category-sublist-item" key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b>{al.title}</b>
                    <span className="status-tag status-error">{al.severity}</span>
                  </div>
                  <p><b>Affected Zones:</b> {al.affected_zones}</p>
                  <p>{al.instructions}</p>
                  <small>Issued: {al.issued_at} · Expires: {al.expires_at} · Source: {al.source}</small>
                </div>
              ))}
            </div>
          )}
          {data.emergency_contacts?.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: '10px' }}>24x7 EMERGENCY HELPLINES</p>
              <div className="category-metrics-grid">
                {data.emergency_contacts.map((c, idx) => (
                  <div className="category-metric-card" key={idx}>
                    <span>{c.service}</span>
                    <b style={{ color: '#dc2626' }}>{c.number}</b>
                    <small>{c.description}</small>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )

    default:
      return null
  }
}

function RegionalStatus({ sessionToken, language, onNavigate }) {
  const [regions, setRegions] = useState([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const [liveData, setLiveData] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState('')
  const [expandedCategory, setExpandedCategory] = useState('')
  const [categoryDetail, setCategoryDetail] = useState(null)
  const [categoryDetailError, setCategoryDetailError] = useState('')
  const [refreshingCategory, setRefreshingCategory] = useState('')
  const [issue, setIssue] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminSession, setAdminSession] = useState('')
  const [adminAccount, setAdminAccount] = useState(null)
  const [editingRegion, setEditingRegion] = useState(false)
  const [regionName, setRegionName] = useState('')
  const [regionType, setRegionType] = useState('district')
  const [parentId, setParentId] = useState('')
  const [statusCategory, setStatusCategory] = useState('Weather and rainfall')
  const [statusValue, setStatusValue] = useState('unavailable')
  const [statusSummary, setStatusSummary] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [otherRegion, setOtherRegion] = useState('')
  const [comparison, setComparison] = useState(null)
  const [mapResult, setMapResult] = useState(null)
  const [subscribedRegionId, setSubscribedRegionId] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [regionalNotices, setRegionalNotices] = useState([])
  const [analyticsBucket, setAnalyticsBucket] = useState('daily')
  const [analyticsCategory, setAnalyticsCategory] = useState('')
  const [analyticsFromDate, setAnalyticsFromDate] = useState('')
  const [analyticsToDate, setAnalyticsToDate] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [analyticsError, setAnalyticsError] = useState('')
  const dashboardRequestId = useRef(0)
  const canManageRegions = ['super_admin', 'government_data_admin'].includes(adminAccount?.role)
  const analyticsParams = new URLSearchParams({
    region_id: selectedRegion,
    bucket: analyticsBucket,
    ...(analyticsCategory ? { category: analyticsCategory } : {}),
    ...(analyticsFromDate ? { from_date: analyticsFromDate } : {}),
    ...(analyticsToDate ? { to_date: analyticsToDate } : {}),
  })
  const analyticsQuery = analyticsParams.toString()
  const allStates = regions.filter((item) => ['state', 'union_territory'].includes(item.region_type))
  const selected = regions.find((item) => item.id === selectedRegion)
  const mapPoint = mapResult?.regionId === selectedRegion ? mapResult.point : null
  const selectedDashboard = dashboard?.region.id === selectedRegion ? dashboard : null
  const selectedLiveData = liveData?.region.id === selectedRegion ? liveData : null
  let stateRegion = selected
  while (stateRegion?.parent_id) stateRegion = regions.find((item) => item.id === stateRegion.parent_id)
  const regionsInState = regions.filter((item) => {
    let current = item
    while (current) {
      if (current.id === stateRegion?.id) return true
      current = regions.find((region) => region.id === current.parent_id)
    }
    return false
  })
  const displayCategories = selectedDashboard?.categories.map((stored) => {
    const feed = selectedLiveData?.categories?.[stored.category]
    if (feed && feed.status !== 'unavailable') return { ...stored, ...feed, category: stored.category }
    if (stored.status !== 'unavailable') {
      return {
        ...stored,
        note: feed?.note ? `${stored.note} Current feed: ${feed.note}` : stored.note,
      }
    }
    return feed ? { ...stored, ...feed, category: stored.category } : stored
  }) || []

  const loadRegions = useCallback(async () => {
    try {
      const result = await request('/regional/regions')
      setRegions(result.regions)
      const karnataka = result.regions.find((r) => r.name === 'Karnataka')
      setSelectedRegion((current) => current || karnataka?.id || result.regions[0]?.id || '')
      setIssue('')
    } catch (error) { setIssue(error.message) }
  }, [])

  const loadDashboard = useCallback(async (regionId, refresh = false) => {
    if (!regionId) return
    const requestId = ++dashboardRequestId.current
    setDashboardLoading(true)
    setLiveLoading(true)
    setIssue('')
    setLiveError('')
    const [dashboardResult, liveResult] = await Promise.allSettled([
      request(`/regional/regions/${regionId}/dashboard`),
      request(`/regional/regions/${regionId}/live${refresh ? '?refresh=true' : ''}`),
    ])
    if (requestId !== dashboardRequestId.current) return
    if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value)
    else setIssue(dashboardResult.reason.message)
    if (liveResult.status === 'fulfilled') setLiveData(liveResult.value)
    else setLiveError(liveResult.reason.message)
    setDashboardLoading(false)
    setLiveLoading(false)
  }, [])

  useEffect(() => {
    request('/regional/regions')
      .then((result) => {
        setRegions(result.regions)
        const karnataka = result.regions.find((r) => r.name === 'Karnataka')
        setSelectedRegion((current) => current || karnataka?.id || result.regions[0]?.id || '')
      })
      .catch((error) => setIssue(error.message))
  }, [])

  useEffect(() => {
    if (!selectedRegion) return
    let active = true
    Promise.resolve().then(() => {
      if (active) void loadDashboard(selectedRegion)
    })
    return () => { active = false }
  }, [selectedRegion, loadDashboard])

  useEffect(() => {
    if (!selectedRegion) return
    let active = true
    request(`/regional/analytics?${analyticsQuery}`)
      .then((result) => { if (active) { setAnalytics(result); setAnalyticsError('') } })
      .catch((error) => { if (active) { setAnalyticsError(error.message); setAnalytics(null) } })
    return () => { active = false }
  }, [analyticsQuery, selectedRegion])

  const selectedName = selected?.name
  useEffect(() => {
    if (!selectedName) return
    request(`/transport/geocode?q=${encodeURIComponent(selectedName)}`)
      .then((result) => {
        const point = result.results?.[0]
        setMapResult({ regionId: selectedRegion, point: point ? [Number(point.lat), Number(point.lon)] : null })
      })
      .catch(() => setMapResult({ regionId: selectedRegion, point: null }))
  }, [selectedName, selectedRegion])

  useEffect(() => {
    if (!sessionToken || !selectedRegion) return
    request('/regional/subscriptions', { headers: { 'X-Civic-Session': sessionToken } })
      .then((result) => {
        const subscription = result.subscriptions.find((item) => item.region_id === selectedRegion)
        setSubscribedRegionId(subscription?.region_id || '')
        setSelectedCategories(subscription?.categories || [])
      })
      .catch((error) => setIssue(error.message))
  }, [sessionToken, selectedRegion])

  useEffect(() => {
    if (!sessionToken) return
    request('/regional/notifications', { headers: { 'X-Civic-Session': sessionToken } })
      .then((result) => setRegionalNotices(result.notifications))
      .catch((error) => setIssue(error.message))
  }, [sessionToken])

  async function loginAdmin(event) {
    event.preventDefault()
    try {
      const result = await request('/admin/login', { method: 'POST', body: { email: adminEmail, password: adminPassword } })
      setAdminSession(result.session_token)
      setAdminAccount(result.admin)
      setAdminPassword('')
      setIssue(`Administrator signed in as ${result.admin.role.replaceAll('_', ' ')}.`)
    } catch (error) { setIssue(error.message) }
  }

  async function logoutAdmin() {
    try {
      await request('/admin/logout', { method: 'POST', headers: { 'X-Admin-Session': adminSession } })
    } catch (error) { setIssue(error.message) }
    setAdminSession('')
    setAdminAccount(null)
  }

  async function syncOfficialSources() {
    try {
      const result = await request('/sources/sync', { method: 'POST', headers: { 'X-Admin-Session': adminSession } })
      const available = result.sources.filter((item) => item.status === 'available').length
      setIssue(`Portal reachability check finished: ${available}/${result.sources.length} reachable. No regional data was ingested.`)
    } catch (error) { setIssue(error.message) }
  }

  async function saveRegion(event) {
    event.preventDefault()
    if (!canManageRegions) { setIssue('A Government Data Administrator or Super Admin account is required.'); return }
    try {
      const isEditing = editingRegion
      const payload = { name: regionName, region_type: regionType, parent_id: parentId || null }
      const result = isEditing
        ? await request(`/regional/regions/${selectedRegion}`, { method: 'PUT', headers: { 'X-Admin-Session': adminSession }, body: payload })
        : await request('/regional/regions', { method: 'POST', headers: { 'X-Admin-Session': adminSession }, body: payload })
      setRegionName('')
      setEditingRegion(false)
      setIssue(`Region ${isEditing ? 'updated' : 'added'}: ${result.region.name}`)
      await loadRegions()
      if (!isEditing) setSelectedRegion(result.region.id)
    } catch (error) { setIssue(error.message) }
  }

  async function deleteRegion() {
    if (!selected || !window.confirm(`Remove ${selected.name} and its child regions?`)) return
    if (!canManageRegions) { setIssue('A Government Data Administrator or Super Admin account is required.'); return }
    try {
      await request(`/regional/regions/${selectedRegion}`, { method: 'DELETE', headers: { 'X-Admin-Session': adminSession } })
      setSelectedRegion('')
      setDashboard(null)
      await loadRegions()
      setIssue('Region and child records removed.')
    } catch (error) { setIssue(error.message) }
  }

  async function saveRegionalStatus(event) {
    event.preventDefault()
    if (!selected) return
    if (!canManageRegions) { setIssue('A Government Data Administrator or Super Admin account is required.'); return }
    try {
      const result = await request(`/regional/regions/${selectedRegion}/status`, {
        method: 'POST',
        headers: { 'X-Admin-Session': adminSession },
        body: {
          category: statusCategory,
          status: statusValue,
          summary: statusSummary,
          source_name: sourceName,
          source_url: sourceUrl,
          observed_at: new Date().toISOString(),
        },
      })
      setIssue(result.message)
      await loadDashboard(selectedRegion)
    } catch (error) { setIssue(error.message) }
  }

  async function subscribe() {
    if (!sessionToken || !selectedRegion) { setIssue('Log in to subscribe to regional updates.'); return }
    try {
      const subscribed = sessionToken && subscribedRegionId === selectedRegion
      const result = await request(subscribed ? `/regional/subscriptions/${selectedRegion}` : '/regional/subscriptions', {
        method: subscribed ? 'DELETE' : 'POST',
        headers: { 'X-Civic-Session': sessionToken },
        body: subscribed ? undefined : { region_id: selectedRegion, categories: selectedCategories },
      })
      setSubscribedRegionId(result.subscribed ? selectedRegion : '')
      if (!result.subscribed) setSelectedCategories([])
      setIssue(result.subscribed ? `Subscribed to selected in-app updates for ${selected?.name}.` : `Unsubscribed from ${selected?.name}.`)
    } catch (error) { setIssue(error.message) }
  }

  async function askRegionalAssistant(event) {
    event.preventDefault()
    setAiAnswer('')
    const facts = (dashboard?.categories || []).map((item) => `${item.category}: ${item.status}; ${item.summary}; source ${item.source_name || 'none'} ${item.source_url || ''}; observed ${item.observed_at || 'not recorded'}; feed-verified ${item.verified_by_feed}`).join('\n')
    try {
      const result = await request('/chat', {
        method: 'POST',
        body: {
          message: `Answer for region ${selected?.name}: ${aiQuestion}. Only use supplied status context and state when it is missing. Do not invent current conditions.`,
          language,
          current_page: 'regional-status',
          region_id: selectedRegion,
          context: facts || 'No current regional feed records are available.',
        },
      })
      setAiAnswer(`${result.answer}\n\n${result.source}`)
    } catch (error) { setIssue(error.message) }
  }

  async function compareRegions() {
    if (!otherRegion || !selectedRegion) return
    try {
      const result = await request(`/regional/regions/${otherRegion}/dashboard`)
      setComparison(result)
    } catch (error) { setIssue(error.message) }
  }

  async function toggleCategoryDetails(category) {
    if (expandedCategory === category) {
      setExpandedCategory('')
      setCategoryDetail(null)
      setCategoryDetailError('')
      return
    }
    setExpandedCategory(category)
    setCategoryDetail(null)
    setCategoryDetailError('')
    try {
      const result = await request(`/regional/regions/${selectedRegion}/categories/${encodeURIComponent(category)}`)
      setCategoryDetail(result)
    } catch (error) {
      setCategoryDetailError(error.message)
    }
  }

  async function refreshCategoryDetails(category) {
    if (!selectedRegion || !category) return
    setCategoryDetailError('')
    try {
      const result = await request(`/regional/regions/${selectedRegion}/categories/${encodeURIComponent(category)}`)
      setCategoryDetail(result)
    } catch (error) {
      setCategoryDetailError(error.message)
    }
  }

  async function refreshCategory(categoryName) {
    const slug = REGIONAL_CATEGORY_SLUGS[categoryName]
    if (!slug || !selected) return
    setRefreshingCategory(categoryName)
    try {
      const refreshed = await request(`/regional-status/${slug}?location=${encodeURIComponent(selected.name)}&refresh=true`)
      setLiveData((current) => {
        if (!current) return current
        return {
          ...current,
          categories: {
            ...current.categories,
            [categoryName]: {
              status: refreshed.status,
              summary: refreshed.summary || current.categories?.[categoryName]?.summary,
              observed_at: refreshed.last_updated,
              source_name: refreshed.source,
              source_url: refreshed.source_url,
              verified_by_feed: true,
              note: `Refreshed from ${refreshed.source}.`,
              data: refreshed.data || {},
            },
          },
        }
      })
      if (expandedCategory === categoryName) {
        await refreshCategoryDetails(categoryName)
      }
    } catch (err) {
      setIssue(`Failed to refresh ${categoryName}: ${err.message}`)
    } finally {
      setRefreshingCategory('')
    }
  }

  const categoryActions = {
    "Civic complaints": { label: 'Submit or track an in-app report', module: 'civic-eye' },
    "Road damage": { label: 'Report road damage in Civic Eye', module: 'civic-eye' },
    "Traffic and roads": { label: 'Open Bengaluru route tools', module: 'bengaluru' },
    "Accidents and closures": { label: 'Open Bengaluru route tools', module: 'bengaluru' },
    "Bus services": { label: 'Open Bengaluru route planning', module: 'bengaluru' },
    "Public transport": { label: 'Open the travel directory', module: 'travel-hub' },
    "Rail services": { label: 'Open travel directory', module: 'travel-hub' },
    "Tourist attractions": { label: 'Browse destinations', module: 'travel-hub' },
    "Government services": { label: 'Open service guidance', module: 'seva-agent' },
  }

  return (
    <div className="module-page">
      <PageHeading
        eyebrow="CIVIC PULSE 360 · REGIONAL STATUS"
        title="A regional view, with sources and limits in sight."
        description="Browse current weather and air-quality measurements, Civic Pulse reports, and official service directories. Unsupported live feeds are not shown."
        action={
          <>
            <button
              className="button-secondary"
              onClick={async () => {
                await loadDashboard(selectedRegion, true)
                if (expandedCategory) await refreshCategoryDetails(expandedCategory)
              }}
              disabled={!selectedRegion || dashboardLoading || liveLoading}
            >
              {liveLoading ? 'Refreshing…' : 'Refresh live data'}
            </button>
            <button className="button-secondary" onClick={loadRegions}>Refresh regions</button>
          </>
        }
      />
      {issue && <p className="regional-citizen-notice" role="status">{issue.includes('required') || issue.includes('signed') || issue.includes('Subscribed') || issue.includes('Unsubscribed') ? issue : 'Information is temporarily unavailable. Please try again later.'}</p>}
      {liveError && <p className="regional-citizen-notice" role="status">Information is temporarily unavailable. Please try again later.</p>}
      <div className="regional-controls panel">
        <label>
          State or union territory
          <select
            value={stateRegion?.id || ''}
            onChange={(event) => {
              setEditingRegion(false)
              setSelectedRegion(event.target.value)
              setDashboard(null)
            }}
          >
            <option value="">Choose region</option>
            {allStates.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <label>
          Region dashboard
          <select
            value={selectedRegion}
            onChange={(event) => {
              setEditingRegion(false)
              setSelectedRegion(event.target.value)
              if (!event.target.value) setDashboard(null)
            }}
          >
            <option value="">Choose region</option>
            {regionsInState.map((item) => (
              <option key={item.id} value={item.id}>{item.name} · {item.region_type.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
        <button className="button-secondary" onClick={subscribe}>
          {sessionToken && subscribedRegionId === selectedRegion ? 'Unsubscribe from alerts' : 'Subscribe to in-app alerts'} <Bell size={13} />
        </button>
      </div>
      {!selectedDashboard && (dashboardLoading ? <p className="privacy-note" role="status">Loading regional dashboard…</p> : null)}
      {selectedDashboard && (
        <>
          <div className="regional-status-banner">
            <CloudSun size={18} />
            <div>
              <b>{selectedDashboard.region.name}</b>
              <p>
                {selectedLiveData?.provider
                  ? 'Weather and air quality use public model measurements. Other cards are Civic Pulse records or official directory links.'
                  : 'Loading regional information…'}
              </p>
            </div>
            <small>
              {selectedLiveData?.retrieved_at
                ? `Provider check ${selectedLiveData.retrieved_at}`
                : selectedDashboard.last_updated
                ? `Last updated ${selectedDashboard.last_updated}`
                : 'Verified'}
            </small>
          </div>
          <div className="regional-summary-grid" aria-label="Regional status summary">
            {['Weather and rainfall', 'Traffic and roads', 'Public transport', 'Water supply', 'Air quality', 'Emergency and disaster alerts'].map((summaryCategory) => {
              const item = displayCategories.find((entry) => entry.category === summaryCategory)
              return item ? (
                <article className="panel regional-summary-card" key={summaryCategory}>
                  <span>{summaryCategory}</span>
                  <b>{regionalStatusLabel(item)}</b>
                  <p>{item.summary}</p>
                </article>
              ) : null
            })}
          </div>
          <div className="regional-layout">
            <section className="regional-main">
              <div className="regional-status-grid">
                {displayCategories.map((item) => (
                  <article className="panel regional-status-card" key={item.category}>
                    <div className="regional-card-header-actions" style={{ justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h3>{item.category}</h3>
                        <span className={`status-tag status-${item.status}`}>
                          {regionalStatusLabel(item)}
                        </span>
                      </div>
                      {REFRESHABLE_REGIONAL_CATEGORIES.has(item.category) && <button
                        type="button"
                        className="button-icon-subtle"
                        title={`Refresh ${item.category} data`}
                        disabled={!REFRESHABLE_REGIONAL_CATEGORIES.has(item.category) || refreshingCategory === item.category}
                        onClick={(e) => {
                          e.stopPropagation()
                          void refreshCategory(item.category)
                        }}
                      >
                        <RefreshCw size={11} className={refreshingCategory === item.category ? 'spin' : ''} />
                      </button>}
                    </div>
                    <p>{item.summary}</p>
                    {item.source_url ? (
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                        Source: {item.source_name} <ArrowUpRight size={12} />
                      </a>
                    ) : (
                      <small style={{ color: 'var(--muted)' }}>Source: {item.source_name || 'Official Register'}</small>
                    )}
                    <small>
                      {item.observed_at ? `Observed ${item.observed_at}` : 'Current measurement'} · {item.note}
                    </small>
                    <div className="regional-card-actions">
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => toggleCategoryDetails(item.category)}
                      >
                        {expandedCategory === item.category ? 'Hide details' : 'View details'}
                      </button>
                      {categoryActions[item.category] && (
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => onNavigate(categoryActions[item.category].module)}
                        >
                          {categoryActions[item.category].label}
                        </button>
                      )}
                    </div>
                    {expandedCategory === item.category && (
                      <div className="regional-category-detail">
                        {selectedLiveData?.categories?.[item.category]?.location && (
                          <p>
                            Location: {selectedLiveData.categories[item.category].location.name}
                            {selectedLiveData.categories[item.category].location.district ? `, ${selectedLiveData.categories[item.category].location.district}` : ''}
                            {selectedLiveData.categories[item.category].location.state ? `, ${selectedLiveData.categories[item.category].location.state}` : ''}
                          </p>
                        )}
                        {selectedLiveData?.categories?.[item.category]?.retrieved_at && (
                          <small>Retrieved {selectedLiveData.categories[item.category].retrieved_at} · measurement timestamp is shown above.</small>
                        )}
                        {categoryDetailError && <p className="regional-citizen-notice" role="status">Information is temporarily unavailable. Please try again later.</p>}
                        {!categoryDetail && !categoryDetailError && (
                          <p className="privacy-note">Loading category sources and reports…</p>
                        )}
                        {categoryDetail && (
                          <>
                            <CategoryLiveView
                              category={item.category}
                              data={categoryDetail.category_data || item.data}
                              onNavigate={onNavigate}
                            />
                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                              <p className="regional-detail-note">
                                {item.category === 'Weather and rainfall' || item.category === 'Air quality'
                                  ? 'Measurements are supplied by a public Open-Meteo model endpoint and are not government station readings.'
                                  : item.category === 'Civic complaints' || item.category === 'Road damage'
                                  ? 'These are citizen reports stored in Civic Pulse. They are not automatically submitted to a government department.'
                                  : 'This is a directory of official information. Current availability, hours, prices, and application status must be confirmed on the linked portal.'}
                              </p>
                              <small>Information scope: {categoryDetail.source_region_scope}.</small>
                              <div>
                                {categoryDetail.official_sources.length ? (
                                  categoryDetail.official_sources.map((source) => (
                                    <article key={source.url}>
                                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                                        {source.name} <ArrowUpRight size={12} />
                                      </a>
                                      {source.description && <p>{source.description}</p>}
                                      {source.contact && <small>{source.contact}</small>}
                                      <small>
                                        {source.verification_method === 'manual_portal_review'
                                          ? `Official portal manually checked ${source.portal_reviewed_on}; this does not verify its current service data.`
                                          : 'Official source link has not been manually checked in this review.'}
                                      </small>
                                    </article>
                                  ))
                                ) : (
                                  <p>Official information is temporarily unavailable for this category.</p>
                                )}
                              </div>
                              <button type="button" className="button-secondary" onClick={() => refreshCategoryDetails(item.category)}>
                                Refresh category details
                              </button>
                              {categoryDetail.records.length ? (
                                <div>
                                  {categoryDetail.records.map((record) => (
                                    <article key={`${record.created_at}-${record.source_url}`}>
                                      <b>{record.status} · {record.data_origin === 'administrator_report' ? 'administrator-entered, not feed-verified' : 'source reported'}</b>
                                      <p>{record.summary}</p>
                                      <a href={record.source_url} target="_blank" rel="noopener noreferrer">
                                        {record.source_name} <ArrowUpRight size={12} />
                                      </a>
                                      <small>Observed {record.observed_at}</small>
                                    </article>
                                  ))}
                                </div>
                              ) : (
                                <p>No stored category reports. Official links are references, not proof of a current incident or announcement.</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
              <section className="panel regional-map-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">REGIONAL MAP</p>
                    <h2>{selected?.name || 'Selected region'}</h2>
                  </div>
                  <MapPin size={17} />
                </div>
                <div className="regional-map">
                  <MapContainer
                    key={selectedRegion}
                    center={mapPoint || [12.9716, 77.5946]}
                    zoom={mapPoint ? 10 : 6}
                    scrollWheelZoom={false}
                    aria-label={`Map view for ${selected?.name || 'India'}`}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapPoint && (
                      <CircleMarker center={mapPoint} radius={8}>
                        <Popup>{selected?.name} reference point ({mapPoint[0].toFixed(4)}, {mapPoint[1].toFixed(4)}). City-centre reference.</Popup>
                      </CircleMarker>
                    )}
                  </MapContainer>
                  {!mapPoint && (
                    <span className="regional-map-fallback">Bengaluru / Karnataka reference · coordinates centered at (12.9716, 77.5946)</span>
                  )}
                </div>
              </section>
              <section className="panel regional-analytics">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">HISTORICAL REPORTS</p>
                    <h2>Stored status trends</h2>
                  </div>
                  <a href={`${API_BASE}/regional/analytics.csv?${analyticsQuery}`}>
                    Download CSV <ArrowDownToLine size={13} />
                  </a>
                </div>
                <div className="regional-analytics-filters">
                  <label>
                    Interval
                    <select value={analyticsBucket} onChange={(event) => setAnalyticsBucket(event.target.value)}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </label>
                  <label>
                    Category
                    <select value={analyticsCategory} onChange={(event) => setAnalyticsCategory(event.target.value)}>
                      <option value="">All categories</option>
                      {dashboard.categories.map((item) => (
                        <option key={item.category}>{item.category}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    From
                    <input type="date" value={analyticsFromDate} onChange={(event) => setAnalyticsFromDate(event.target.value)} />
                  </label>
                  <label>
                    To
                    <input type="date" value={analyticsToDate} onChange={(event) => setAnalyticsToDate(event.target.value)} />
                  </label>
                </div>
                {analyticsError ? (
                  <p className="inline-error" role="status">{analyticsError}</p>
                ) : analytics?.series.length ? (
                  <div className="regional-analytics-list">
                    {analytics.series.map((item) => (
                      <div className="regional-analytics-row" key={`${item.period}-${item.region_id}-${item.category}`}>
                        <div>
                          <b>{item.period} · {item.category}</b>
                          <small>{item.records} stored report(s)</small>
                        </div>
                        <div className="regional-trend-bar" role="img" aria-label={`${item.period}: ${item.live} live, ${item.delayed} delayed, ${item.unavailable} unavailable reports`}>
                          {['live', 'delayed', 'unavailable'].map((status) => (
                            item[status] > 0 && <span key={status} className={`trend-${status}`} style={{ width: `${(item[status] / item.records) * 100}%` }} />
                          ))}
                        </div>
                        <small>Live {item.live} · Delayed {item.delayed} · Unavailable {item.unavailable}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="privacy-note">
                    {analytics ? 'No historical records match these filters. No sample history is generated.' : 'Loading stored reports…'}
                  </p>
                )}
                <small>{analytics?.verification || 'Only actual stored records are included; no data is synthesized.'}</small>
              </section>
            </section>
            <aside className="regional-side">
              <section className="panel regional-ai">
                <p className="eyebrow">REGIONAL INFORMATION ASSISTANT</p>
                <h3>Ask about this region.</h3>
                <form onSubmit={askRegionalAssistant}>
                  <textarea
                    value={aiQuestion}
                    onChange={(event) => setAiQuestion(event.target.value)}
                    placeholder="Ask about available status updates…"
                    required
                    minLength={2}
                  />
                  <button className="button-secondary">
                    <Sparkles size={13} /> Ask Janavani
                  </button>
                </form>
                {aiAnswer && <p className="travel-ai-answer">{aiAnswer}</p>}
                <small>Answers may use AI or local guidance. No status is inferred when source records are absent.</small>
              </section>
              <section className="panel regional-compare">
                <p className="eyebrow">COMPARE REGIONS</p>
                <select value={otherRegion} onChange={(event) => setOtherRegion(event.target.value)}>
                  <option value="">Choose another region</option>
                  {regions.filter((item) => item.id !== selectedRegion).map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <button className="button-secondary" onClick={compareRegions}>Compare available status</button>
                {comparison && (
                  <div className="regional-compare-result">
                    <b>{selected?.name} / {comparison.region.name}</b>
                    {displayCategories.map((item) => {
                      const match = comparison.categories.find((other) => other.category === item.category)
                      return (
                        <p key={item.category}>{item.category}: {item.status} / {match?.status || 'unavailable'}</p>
                      )
                    })}
                    <small>Current stored status only; historical records appear in the trend report.</small>
                  </div>
                )}
              </section>
              <section className="panel regional-subscriptions">
                <p className="eyebrow">IN-APP ALERT PREFERENCES</p>
                <p>Select categories to include in a subscription; leaving all unchecked subscribes to all categories.</p>
                <div>
                  {displayCategories.map((item) => (
                    <label key={item.category}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(item.category)}
                        onChange={(event) => setSelectedCategories((current) => event.target.checked ? [...current, item.category] : current.filter((value) => value !== item.category))}
                      />
                      {item.category}
                    </label>
                  ))}
                </div>
              </section>
              {sessionToken && (
                <section className="panel regional-subscriptions">
                  <p className="eyebrow">YOUR REGIONAL NOTIFICATIONS</p>
                  <button
                    className="button-secondary"
                    onClick={() => request('/regional/notifications', { headers: { 'X-Civic-Session': sessionToken } }).then((result) => setRegionalNotices(result.notifications)).catch((error) => setIssue(error.message))}
                  >
                    Refresh alerts
                  </button>
                  {regionalNotices.length ? (
                    regionalNotices.filter((item) => item.region_id === selectedRegion).map((item) => (
                      <article key={item.id}>
                        <b>{item.title}</b>
                        <small>{item.detail} · {item.created_at}</small>
                      </article>
                    ))
                  ) : (
                    <p>No regional in-app notifications yet.</p>
                  )}
                </section>
              )}
              {adminSession && <section className="panel regional-admin">
                <p className="eyebrow">INDIVIDUAL ADMINISTRATOR ACCESS</p>
                {!adminSession ? (
                  <form onSubmit={loginAdmin}>
                    <p>Sign in with an administrator account. The session remains in memory and expires after eight hours.</p>
                    <label>
                      Administrator email
                      <input type="email" autoComplete="username" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required />
                    </label>
                    <label>
                      Password
                      <input type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required />
                    </label>
                    <button className="button-secondary">Sign in</button>
                  </form>
                ) : (
                  <>
                    <p>Signed in: {adminAccount.full_name} · {adminAccount.role.replaceAll('_', ' ')}</p>
                    <div className="regional-admin-actions">
                      <button type="button" className="button-secondary" onClick={logoutAdmin}>Sign out</button>
                      {canManageRegions && <button type="button" className="button-secondary" onClick={syncOfficialSources}>Check official portal reachability</button>}
                    </div>
                    {!canManageRegions && <p>This role can review information but cannot edit regions or reports.</p>}
                    {canManageRegions && selectedRegion && (
                      <form onSubmit={saveRegion}>
                        <p className="eyebrow">REGION MANAGEMENT</p>
                        <label>
                          Region name
                          <input value={regionName} onChange={(event) => setRegionName(event.target.value)} required minLength={2} />
                        </label>
                        <label>
                          Region type
                          <select value={regionType} onChange={(event) => setRegionType(event.target.value)}>
                            <option value="district">District</option>
                            <option value="city">City</option>
                            <option value="locality">Locality</option>
                            <option value="state">State</option>
                            <option value="union_territory">Union territory</option>
                          </select>
                        </label>
                        <label>
                          Parent region
                          <select value={parentId} onChange={(event) => setParentId(event.target.value)}>
                            <option value="">No parent</option>
                            {regions.filter((item) => regionType === 'district' ? ['state', 'union_territory'].includes(item.region_type) : regionType === 'city' ? ['district', 'state', 'union_territory'].includes(item.region_type) : regionType === 'locality' ? ['city', 'district'].includes(item.region_type) : false).map((item) => (
                              <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                          </select>
                        </label>
                        <div className="regional-admin-actions">
                          <button className="button-secondary">{editingRegion ? 'Save region changes' : 'Add region'}</button>
                          {selected.region_type !== 'state' && selected.region_type !== 'union_territory' && (
                            <button
                              type="button"
                              className="button-secondary"
                              onClick={() => {
                                setEditingRegion(true)
                                setRegionName(selected.name)
                                setRegionType(selected.region_type)
                                setParentId(selected.parent_id || '')
                              }}
                            >
                              Edit selected region
                            </button>
                          )}
                          <button type="button" className="button-secondary" onClick={deleteRegion}>Remove selected region</button>
                        </div>
                      </form>
                    )}
                    {canManageRegions && selectedRegion && (
                      <form onSubmit={saveRegionalStatus}>
                        <p className="eyebrow">RECORD AN ADMIN UPDATE</p>
                        <p>Reports are operator-entered and are not independently verified against a live feed.</p>
                        <label>
                          Data category
                          <select value={statusCategory} onChange={(event) => setStatusCategory(event.target.value)}>
                            {dashboard.categories.map((item) => (
                              <option key={item.category}>{item.category}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Reported status
                          <select value={statusValue} onChange={(event) => setStatusValue(event.target.value)}>
                            <option value="unavailable">Unavailable</option>
                            <option value="delayed">Delayed</option>
                            <option value="live">Live (operator-reported, not feed-verified)</option>
                          </select>
                        </label>
                        <label>
                          Summary
                          <input value={statusSummary} onChange={(event) => setStatusSummary(event.target.value)} required minLength={3} />
                        </label>
                        <label>
                          Source name
                          <input value={sourceName} onChange={(event) => setSourceName(event.target.value)} required minLength={2} />
                        </label>
                        <label>
                          HTTPS source URL
                          <input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} required />
                        </label>
                        <button className="button-secondary">Save unverified report</button>
                      </form>
                    )}
                  </>
                )}
              </section>}
            </aside>
          </div>
        </>
      )}
      <p className="privacy-note">
        <ShieldCheck size={13} /> Weather and air quality are public model measurements. Civic complaints and road damage are citizen-submitted Civic Pulse records; directory cards link to official portals and do not claim live government status.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PART B: NEW CIVIC MODULES
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared helper ────────────────────────────────────────────────────────────
function SourceBadge({ source, url }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="source-badge-link">
      <ShieldCheck size={12} /> {source} <ExternalLink size={11} />
    </a>
  )
}

// ── Government Recruitment Radar ─────────────────────────────────────────────
function GovJobs({ sessionToken, onNavigate }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    setLoading(true)
    request('/gov-jobs')
      .then(d => { setJobs(d.jobs || []); setError('') })
      .catch(() => setError('Could not load job listings. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const categories = [...new Set(jobs.map(j => j.category))].sort()
  const filtered = jobs.filter(j => {
    const qOk = !q || j.title.toLowerCase().includes(q.toLowerCase()) || j.organization.toLowerCase().includes(q.toLowerCase())
    const cOk = !category || j.category === category
    return qOk && cOk
  })

  return (
    <div className="module-page">
      <PageHeading eyebrow="DISCOVER" title="Recruitment Radar" description="Official government job and exam notifications. Always verify current details on the official notification link." />
      <div className="panel" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '180px' }}>
            <Search size={16} style={{ color: 'var(--muted)' }} />
            <input className="text-input" placeholder="Search job title or organisation…" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, padding: '0.5rem 0.6rem' }} />
          </span>
          <select className="text-input" value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '0.5rem 0.6rem' }}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {loading && <div className="state-loading"><LoaderCircle size={22} className="spin" /> Loading…</div>}
      {error && <div className="state-error">{error}</div>}
      {!loading && !error && filtered.length === 0 && <div className="state-empty">No jobs match your search.</div>}
      <div className="gov-jobs-grid">
        {filtered.map(job => (
          <div key={job.id} className={`job-card panel ${expanded === job.id ? 'expanded' : ''}`}>
            <div className="job-card-header" onClick={() => setExpanded(expanded === job.id ? null : job.id)}>
              <span className={`module-icon orange`} style={{ width: 36, height: 36 }}><Briefcase size={18} /></span>
              <div style={{ flex: 1 }}>
                <strong>{job.title}</strong>
                <small style={{ display: 'block', color: 'var(--muted)' }}>{job.organization}</small>
              </div>
              <span className="job-status-badge">{job.category}</span>
              <ChevronDown size={16} style={{ color: 'var(--muted)', transform: expanded === job.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {expanded === job.id && (
              <div className="job-card-body">
                {job.qualification && <p><strong>Qualification:</strong> {job.qualification}</p>}
                {job.age_limit && <p><strong>Age limit:</strong> {job.age_limit}</p>}
                {job.vacancies > 0 && <p><strong>Vacancies:</strong> {job.vacancies}</p>}
                {job.application_end && <p><strong>Last date to apply:</strong> {job.application_end}</p>}
                {job.exam_date && <p><strong>Exam date:</strong> {job.exam_date}</p>}
                <p className="state-note" style={{ marginTop: '0.5rem' }}>⚠ Figures shown may not reflect the latest notification. Always check the official link.</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  {job.notification_url && <a href={job.notification_url} target="_blank" rel="noopener noreferrer" className="button-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>Official Notification <ExternalLink size={12} /></a>}
                  {job.portal_url && job.portal_url !== job.notification_url && <a href={job.portal_url} target="_blank" rel="noopener noreferrer" className="button-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>Apply Portal <ExternalLink size={12} /></a>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="eyebrow" style={{ marginTop: '2rem', textAlign: 'center' }}>
        Source: Official recruitment portals · Data reflects seed information — verify deadlines and vacancies on the official notification link.
      </p>
    </div>
  )
}

// ── Land & Property Services ──────────────────────────────────────────────────
function LandProperty({ onNavigate }) {
  const services = [
    { id: 'rtc', title: 'RTC / Pahani (Land Record)', icon: FileText, color: 'green', desc: 'View Record of Rights, Tenancy and Crops for agricultural land in Karnataka.', url: 'https://landrecords.karnataka.gov.in/', urlLabel: 'Bhoomi Portal', steps: ['Visit landrecords.karnataka.gov.in', 'Select district, Taluk, Hobli, Village', 'Enter survey number', 'View or download RTC'] },
    { id: 'mutation', title: 'Mutation (Khata Change)', icon: RefreshCw, color: 'blue', desc: 'Transfer land ownership records after purchase, inheritance or gift deed.', url: 'https://landrecords.karnataka.gov.in/', urlLabel: 'Bhoomi / Tahsildar', steps: ['Obtain registered sale deed or gift deed', 'Apply at Tahsildar / Nadakacheri or Bhoomi portal', 'Pay prescribed fee', 'Track mutation status online'] },
    { id: 'ec', title: 'Encumbrance Certificate (EC)', icon: ShieldCheck, color: 'violet', desc: 'Confirm no mortgage or legal dues exist against a property.', url: 'https://kaveri.karnataka.gov.in/', urlLabel: 'Kaveri Online', steps: ['Visit kaveri.karnataka.gov.in', 'Select Encumbrance Certificate', 'Enter property / document details', 'Pay fee and download EC'] },
    { id: 'property-reg', title: 'Property Registration', icon: FileCheck2, color: 'orange', desc: 'Register sale, gift or will deeds at the Sub-Registrar office.', url: 'https://kaveri.karnataka.gov.in/', urlLabel: 'Kaveri Online', steps: ['Prepare sale deed with legal help', 'Pay stamp duty and registration fee', 'Book appointment on Kaveri Online', 'Appear at Sub-Registrar office with witnesses and originals'] },
    { id: 'bbmp-tax', title: 'BBMP Property Tax (Bengaluru)', icon: Building2, color: 'green', desc: 'Pay and manage property tax for BBMP-jurisdiction properties.', url: 'https://bbmptax.karnataka.gov.in/', urlLabel: 'BBMP Tax Portal', steps: ['Visit bbmptax.karnataka.gov.in', 'Enter SAS Application Number', 'Verify tax calculation', 'Pay online and download receipt'] },
    { id: 'rera', title: 'Karnataka RERA — Verify Builder / Project', icon: ShieldCheck, color: 'blue', desc: 'Check if a builder and project are RERA-registered before buying.', url: 'https://rera.karnataka.gov.in/', urlLabel: 'RERA Karnataka', steps: ['Visit rera.karnataka.gov.in', 'Search by project name or registration number', 'View registration details and approvals', 'File complaints if developer is non-compliant'] },
  ]
  const [expanded, setExpanded] = useState(null)
  return (
    <div className="module-page">
      <PageHeading eyebrow="CITIZEN SERVICES" title="Land & Property" description="Karnataka land records, property registration and encumbrance certificate services. All links lead to official government portals." />
      <div className="land-service-cards">
        {services.map(svc => {
          const Icon = svc.icon
          return (
            <div key={svc.id} className="panel service-card-block">
              <button className="service-card-header" onClick={() => setExpanded(expanded === svc.id ? null : svc.id)}>
                <span className={`module-icon ${svc.color}`} style={{ width: 36, height: 36 }}><Icon size={18} /></span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <strong>{svc.title}</strong>
                  <small style={{ display: 'block', color: 'var(--muted)' }}>{svc.desc}</small>
                </div>
                <ChevronDown size={16} style={{ color: 'var(--muted)', transform: expanded === svc.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </button>
              {expanded === svc.id && (
                <div style={{ padding: '0.75rem 1rem 1rem', borderTop: '1px solid var(--border)' }}>
                  <ol style={{ paddingLeft: '1.2rem', margin: '0 0 0.75rem', color: 'var(--text)' }}>
                    {svc.steps.map((step, i) => <li key={i} style={{ marginBottom: '0.4rem', fontSize: '0.9rem' }}>{step}</li>)}
                  </ol>
                  <a href={svc.url} target="_blank" rel="noopener noreferrer" className="button-primary" style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}>{svc.urlLabel} <ExternalLink size={12} /></a>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="panel" style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'var(--teal-pale)' }}>
        <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>NEED AI GUIDANCE?</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text)', margin: 0 }}>For step-by-step help with land or property services in Karnataka, ask <button className="text-button" onClick={() => onNavigate('janavani')}>Janavani AI</button>.</p>
      </div>
    </div>
  )
}

// ── Government Health Services ────────────────────────────────────────────────
function HealthServices({ profile, onNavigate }) {
  const schemes = [
    { name: 'Ayushman Bharat – PM-JAY', desc: '₹5 lakh health coverage per family per year at empanelled hospitals.', url: 'https://beneficiary.nha.gov.in/', urlLabel: 'Check eligibility', color: 'green' },
    { name: 'Karnataka Arogya Karnataka', desc: 'State health assurance scheme for Karnataka BPL families not covered by PM-JAY.', url: 'https://sast.karnataka.gov.in/', urlLabel: 'SAST Portal', color: 'blue' },
    { name: 'Janani Suraksha Yojana (JSY)', desc: 'Cash assistance for pregnant BPL women delivering at government facilities.', url: 'https://nhm.gov.in/', urlLabel: 'NHM Portal', color: 'orange' },
    { name: 'ASHA Worker Services', desc: 'Community health worker support for maternal, child and preventive health in rural areas.', url: 'https://nhm.gov.in/', urlLabel: 'NHM', color: 'violet' },
  ]
  const resources = [
    { label: 'Karnataka Health Department', url: 'https://hfw.karnataka.gov.in/' },
    { label: 'BBMP Health Services', url: 'https://bbmponline.karnataka.gov.in/' },
    { label: 'National Health Mission', url: 'https://nhm.gov.in/' },
    { label: 'Ayushman Bharat Digital Mission', url: 'https://abdm.gov.in/' },
    { label: 'eSanjeevani (Telemedicine)', url: 'https://esanjeevaniopd.in/' },
    { label: 'Blood Bank Directory (NHM)', url: 'https://www.notto.abdm.gov.in/' },
  ]
  return (
    <div className="module-page">
      <PageHeading eyebrow="CITIZEN SERVICES" title="Government Health Services" description="Official government health schemes and facility links for Karnataka and central government programmes." />
      <div className="panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'var(--teal-pale)', borderLeft: '4px solid var(--teal)' }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>⚠ Medical Disclaimer:</strong> This module provides links to official government health programmes and portals. It does not provide medical advice, diagnosis or treatment. Always consult a registered healthcare provider for medical decisions.</p>
      </div>
      <div className="section-title-row"><div><p className="eyebrow">HEALTH SCHEMES</p><h2>Key government health programmes</h2></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {schemes.map(s => (
          <div key={s.name} className="panel" style={{ padding: '1rem 1.1rem' }}>
            <span className={`module-icon ${s.color}`} style={{ marginBottom: '0.6rem' }}><HeartPulse size={18} /></span>
            <strong style={{ display: 'block', marginBottom: '0.3rem' }}>{s.name}</strong>
            <p style={{ fontSize: '0.88rem', color: 'var(--text)', margin: '0 0 0.75rem' }}>{s.desc}</p>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="button-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>{s.urlLabel} <ExternalLink size={11} /></a>
          </div>
        ))}
      </div>
      <div className="section-title-row"><div><p className="eyebrow">OFFICIAL RESOURCES</p><h2>Health portals & directories</h2></div></div>
      <div className="panel" style={{ padding: '0.5rem 0' }}>
        {resources.map(r => (
          <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" className="quick-row" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="quick-icon green"><HeartPulse size={15} /></span>
            <span style={{ flex: 1 }}><b>{r.label}</b></span>
            <ExternalLink size={14} style={{ color: 'var(--muted)' }} />
          </a>
        ))}
      </div>
      <div className="panel" style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'var(--teal-pale)' }}>
        <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>NEED AI GUIDANCE?</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text)', margin: 0 }}>Ask <button className="text-button" onClick={() => onNavigate('janavani')}>Janavani AI</button> about health scheme eligibility, required documents and official application steps.</p>
      </div>
    </div>
  )
}

// ── Farmer & Agriculture Services ─────────────────────────────────────────────
function AgriServices({ sessionToken, onNavigate }) {
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    setLoading(true)
    request('/gov-schemes?category=farmer')
      .then(d => { setSchemes(d.schemes || []); setError('') })
      .catch(() => setError('Could not load farmer schemes. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const resources = [
    { label: 'PM-KISAN Portal', url: 'https://pmkisan.gov.in/', desc: 'Check beneficiary status and instalment details.' },
    { label: 'PM Fasal Bima Yojana', url: 'https://pmfby.gov.in/', desc: 'Crop insurance scheme — enrol before seasonal deadline.' },
    { label: 'Karnataka Raitha Seva Kendra', url: 'https://raitamitra.karnataka.gov.in/', desc: 'Karnataka Agriculture Department farmer services.' },
    { label: 'eNAM – National Agriculture Market', url: 'https://www.enam.gov.in/', desc: 'Online trading platform for agricultural commodities.' },
    { label: 'Soil Health Card Portal', url: 'https://soilhealth.dac.gov.in/', desc: 'Get soil health card and crop-wise fertilizer recommendations.' },
    { label: 'Kisan Call Centre', url: 'tel:18001801551', desc: 'Free helpline for farmer queries: 1800-180-1551' },
  ]

  const filtered = schemes.filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.benefits.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="module-page">
      <PageHeading eyebrow="DISCOVER" title="Farmer Services" description="Agriculture schemes, subsidies and official resources for farmers in Karnataka and across India." />
      <div className="section-title-row"><div><p className="eyebrow">AGRICULTURAL SCHEMES</p><h2>Central & Karnataka farmer programmes</h2></div></div>
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', maxWidth: 400 }}>
          <Search size={16} style={{ color: 'var(--muted)' }} />
          <input className="text-input" placeholder="Search schemes…" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, padding: '0.5rem 0.6rem' }} />
        </span>
      </div>
      {loading && <div className="state-loading"><LoaderCircle size={22} className="spin" /> Loading…</div>}
      {error && <div className="state-error">{error}</div>}
      <div className="agri-scheme-grid">
        {filtered.map(s => (
          <div key={s.id} className="panel" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <strong style={{ fontSize: '0.95rem' }}>{s.name}</strong>
              <span className="job-status-badge">{s.level}</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text)', margin: '0 0 0.5rem' }}>{s.description}</p>
            {s.benefits && <p style={{ fontSize: '0.84rem', color: 'var(--muted)', margin: '0 0 0.75rem' }}><strong>Benefit:</strong> {s.benefits}</p>}
            {s.deadline && <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0 0 0.5rem' }}><Clock3 size={12} /> {s.deadline}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {s.application_url && <a href={s.application_url} target="_blank" rel="noopener noreferrer" className="button-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>Official Portal <ExternalLink size={11} /></a>}
            </div>
            {s.verified_on && <small style={{ display: 'block', color: 'var(--muted)', marginTop: '0.5rem' }}>Verified: {s.verified_on} · Source: {s.source}</small>}
          </div>
        ))}
      </div>
      <div className="section-title-row" style={{ marginTop: '2rem' }}><div><p className="eyebrow">RESOURCES</p><h2>Official agriculture portals</h2></div></div>
      <div className="panel" style={{ padding: '0.5rem 0' }}>
        {resources.map(r => (
          <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" className="quick-row" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="quick-icon green"><Leaf size={15} /></span>
            <span style={{ flex: 1 }}><b>{r.label}</b><small style={{ display: 'block', color: 'var(--muted)' }}>{r.desc}</small></span>
            <ExternalLink size={14} style={{ color: 'var(--muted)' }} />
          </a>
        ))}
      </div>
    </div>
  )
}

// ── Business Hub ──────────────────────────────────────────────────────────────
function BusinessHub({ onNavigate }) {
  const portals = [
    { name: 'Startup India — DPIIT Recognition', desc: 'Get DPIIT recognition for tax benefits, self-certification and government procurement preference.', url: 'https://www.startupindia.gov.in/', color: 'blue', category: 'Startup' },
    { name: 'Udyam Registration (MSME)', desc: 'Free online MSME registration for micro, small and medium enterprises.', url: 'https://udyamregistration.gov.in/', color: 'green', category: 'MSME' },
    { name: 'Government e-Marketplace (GeM)', desc: 'Sell products and services directly to government buyers with no middlemen.', url: 'https://gem.gov.in/', color: 'orange', category: 'Tender / Procurement' },
    { name: 'MUDRA Loan', desc: 'Collateral-free loans for small businesses up to ₹10 lakh via scheduled banks.', url: 'https://www.mudra.org.in/', color: 'violet', category: 'Loan' },
    { name: 'JanSamarth — Credit-Linked Schemes', desc: 'Discover and apply for government credit-linked schemes for agriculture, education and business.', url: 'https://www.jansamarth.in/', color: 'blue', category: 'Loan' },
    { name: 'Central Public Procurement Portal (CPPP)', desc: 'Find central government tenders and e-procurement notices across all ministries.', url: 'https://eprocure.gov.in/', color: 'orange', category: 'Tender / Procurement' },
    { name: 'Karnataka Udyog Mitra', desc: 'Single-window clearance for industries and businesses setting up in Karnataka.', url: 'https://udyogmitra.karnataka.gov.in/', color: 'green', category: 'Karnataka' },
    { name: 'KSIDC — Karnataka Small Industries', desc: 'Financial assistance and infrastructure for small-scale industries in Karnataka.', url: 'https://www.ksidc.org/', color: 'blue', category: 'Karnataka' },
    { name: 'KVIC / PMEGP', desc: 'Prime Minister Employment Generation Programme — grants for village and khadi industries.', url: 'https://www.kviconline.gov.in/pmegpeportal/', color: 'green', category: 'Startup' },
    { name: 'Trade Mark Registry — Apply', desc: 'Register your brand trademark through the official IP India portal.', url: 'https://ipindia.gov.in/', color: 'violet', category: 'Compliance' },
    { name: 'MCA21 — Company / LLP Registration', desc: 'Register a company or LLP through the Ministry of Corporate Affairs portal.', url: 'https://www.mca.gov.in/', color: 'orange', category: 'Compliance' },
    { name: 'GST Registration', desc: 'Register for Goods and Services Tax on the official GST portal.', url: 'https://www.gst.gov.in/', color: 'blue', category: 'Compliance' },
  ]
  const [category, setCategory] = useState('')
  const categories = [...new Set(portals.map(p => p.category))].sort()
  const filtered = category ? portals.filter(p => p.category === category) : portals

  return (
    <div className="module-page">
      <PageHeading eyebrow="DISCOVER" title="Business Hub" description="Official portals for startups, MSMEs, tenders, loans and government procurement in India." />
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button className={`button-secondary${!category ? ' active' : ''}`} onClick={() => setCategory('')} style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem' }}>All</button>
        {categories.map(c => <button key={c} className={`button-secondary${category === c ? ' active' : ''}`} onClick={() => setCategory(c)} style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem' }}>{c}</button>)}
      </div>
      <div className="business-card-grid">
        {filtered.map(p => (
          <div key={p.name} className="panel business-card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
              <span className={`module-icon ${p.color}`} style={{ width: 32, height: 32 }}><TrendingUp size={16} /></span>
              <span className="job-status-badge">{p.category}</span>
            </div>
            <strong style={{ display: 'block', marginBottom: '0.3rem' }}>{p.name}</strong>
            <p style={{ fontSize: '0.88rem', color: 'var(--text)', margin: '0 0 0.75rem' }}>{p.desc}</p>
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="button-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>Open Portal <ExternalLink size={11} /></a>
          </div>
        ))}
      </div>
      <div className="panel" style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'var(--teal-pale)' }}>
        <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>BUSINESS AI GUIDANCE</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text)', margin: 0 }}>Ask <button className="text-button" onClick={() => onNavigate('janavani')}>Janavani AI</button> about MSME eligibility, Startup India registration steps or GeM seller onboarding.</p>
      </div>
    </div>
  )
}

// ── Karnataka Services Directory ──────────────────────────────────────────────
function KarnatakaDir({ onNavigate }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    setLoading(true)
    request('/karnataka-services')
      .then(d => { setServices(d.services || []); setError('') })
      .catch(() => setError('Could not load Karnataka services. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const categories = [...new Set(services.map(s => s.category))].sort()
  const filtered = services.filter(s => {
    const qOk = !q || s.service_name.toLowerCase().includes(q.toLowerCase()) || s.department.toLowerCase().includes(q.toLowerCase())
    const cOk = !category || s.category === category
    return qOk && cOk
  })

  return (
    <div className="module-page">
      <PageHeading eyebrow="CITIZEN SERVICES" title="Karnataka Services Directory" description="Verified Karnataka government services — portals, contacts and procedure guides." />
      <div className="panel" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '180px' }}>
            <Search size={16} style={{ color: 'var(--muted)' }} />
            <input className="text-input" placeholder="Search services or departments…" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, padding: '0.5rem 0.6rem' }} />
          </span>
          <select className="text-input" value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '0.5rem 0.6rem' }}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {loading && <div className="state-loading"><LoaderCircle size={22} className="spin" /> Loading…</div>}
      {error && <div className="state-error">{error}</div>}
      {!loading && !error && filtered.length === 0 && <div className="state-empty">No services match your search.</div>}
      <div className="karnataka-dept-list">
        {filtered.map(svc => (
          <div key={svc.id} className="panel service-card-block">
            <button className="service-card-header" onClick={() => setExpanded(expanded === svc.id ? null : svc.id)}>
              <span className="module-icon blue" style={{ width: 36, height: 36 }}><Landmark size={17} /></span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <strong>{svc.service_name}</strong>
                <small style={{ display: 'block', color: 'var(--muted)' }}>{svc.department} · {svc.category}</small>
              </div>
              <ChevronDown size={16} style={{ color: 'var(--muted)', transform: expanded === svc.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </button>
            {expanded === svc.id && (
              <div style={{ padding: '0.75rem 1rem 1rem', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.9rem', margin: '0 0 0.5rem' }}>{svc.description}</p>
                {svc.fees && <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 0.5rem' }}><strong>Fees:</strong> {svc.fees}</p>}
                {svc.contact && <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 0.75rem' }}><strong>Contact:</strong> {svc.contact}</p>}
                <a href={svc.portal_url} target="_blank" rel="noopener noreferrer" className="button-primary" style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}>Visit Portal <ExternalLink size={12} /></a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Government Application Tracker ────────────────────────────────────────────
const APP_STATUS_OPTIONS = ['Draft', 'Submitted', 'Under Verification', 'Documents Required', 'Pending Approval', 'Approved', 'Rejected', 'Certificate Issued', 'Completed']
const APP_STATUS_COLORS = { Draft: 'var(--muted)', Submitted: '#2563eb', 'Under Verification': '#d97706', 'Documents Required': '#dc2626', 'Pending Approval': '#7c3aed', Approved: '#16a34a', Rejected: '#dc2626', 'Certificate Issued': '#0d9488', Completed: '#16a34a' }

function AppTracker({ sessionToken, backendOnline }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ department: '', application_type: '', reference_number: '', submission_date: '', status: 'Draft', notes: '', official_url: '' })
  const [saving, setSaving] = useState(false)

  function load() {
    if (!sessionToken) return
    setLoading(true)
    request('/app-tracking', { headers: { 'X-Civic-Session': sessionToken } })
      .then(d => { setApps(d.applications || []); setError('') })
      .catch(() => setError('Could not load applications.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [sessionToken])

  async function addApp(e) {
    e.preventDefault()
    if (!form.department || !form.application_type) return
    setSaving(true)
    try {
      await request('/app-tracking', { method: 'POST', headers: { 'X-Civic-Session': sessionToken }, body: form })
      setForm({ department: '', application_type: '', reference_number: '', submission_date: '', status: 'Draft', notes: '', official_url: '' })
      setShowForm(false)
      load()
    } catch {
      setError('Could not save application. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(id, status) {
    try {
      await request(`/app-tracking/${id}`, { method: 'PUT', headers: { 'X-Civic-Session': sessionToken }, body: { status } })
      load()
    } catch { /* silent */ }
  }

  async function deleteApp(id) {
    if (!window.confirm('Remove this application from your tracker?')) return
    try {
      await request(`/app-tracking/${id}`, { method: 'DELETE', headers: { 'X-Civic-Session': sessionToken } })
      load()
    } catch { /* silent */ }
  }

  if (!sessionToken) {
    return (
      <div className="module-page">
        <PageHeading eyebrow="MY SERVICES" title="Application Tracker" description="Track all your government applications in one place." />
        <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Sign in to save and track your government applications.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="module-page">
      <PageHeading eyebrow="MY SERVICES" title="Application Tracker" description="Track your government certificate, scheme and document applications." action={
        <button className="button-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Application'}</button>
      } />
      {showForm && (
        <form className="panel" onSubmit={addApp} style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
              Department *
              <input className="text-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Revenue Dept" required />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
              Application Type *
              <input className="text-input" value={form.application_type} onChange={e => setForm(f => ({ ...f, application_type: e.target.value }))} placeholder="e.g. Income Certificate" required />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
              Reference / Application Number
              <input className="text-input" value={form.reference_number} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))} placeholder="Optional" />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
              Submission Date
              <input className="text-input" type="date" value={form.submission_date} onChange={e => setForm(f => ({ ...f, submission_date: e.target.value }))} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
              Status
              <select className="text-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {APP_STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
              Official Tracking URL
              <input className="text-input" value={form.official_url} onChange={e => setForm(f => ({ ...f, official_url: e.target.value }))} placeholder="Optional" />
            </label>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            Notes
            <textarea className="text-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
          </label>
          <button type="submit" className="button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Application'}</button>
        </form>
      )}
      {loading && <div className="state-loading"><LoaderCircle size={22} className="spin" /> Loading…</div>}
      {error && <div className="state-error">{error}</div>}
      {!loading && apps.length === 0 && !showForm && <div className="state-empty">No applications tracked yet. Click "Add Application" to start.</div>}
      <div className="tracker-list">
        {apps.map(app => (
          <div key={app.id} className="panel tracker-item" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <strong>{app.application_type}</strong>
                <small style={{ display: 'block', color: 'var(--muted)' }}>{app.department}{app.reference_number ? ` · Ref: ${app.reference_number}` : ''}</small>
              </div>
              <span style={{ color: APP_STATUS_COLORS[app.status] || 'var(--text)', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{app.status}</span>
            </div>
            {app.notes && <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0.4rem 0 0' }}>{app.notes}</p>}
            {app.submission_date && <small style={{ color: 'var(--muted)' }}>Submitted: {app.submission_date}</small>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="text-input" value={app.status} onChange={e => updateStatus(app.id, e.target.value)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}>
                {APP_STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
              {app.official_url && <a href={app.official_url} target="_blank" rel="noopener noreferrer" className="button-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>Track <ExternalLink size={11} /></a>}
              <button className="icon-btn" title="Remove" onClick={() => deleteApp(app.id)} style={{ color: '#dc2626', marginLeft: 'auto' }}><X size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Opportunity Dashboard (unified) ───────────────────────────────────────────
function OppDashboard({ sessionToken, profile, onNavigate }) {
  const [tab, setTab] = useState('schemes')
  const [schemes, setSchemes] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([request('/gov-schemes'), request('/gov-jobs')])
      .then(([sd, jd]) => { setSchemes(sd.schemes || []); setJobs(jd.jobs || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const schemeCategories = [...new Set(schemes.map(s => s.category))].sort()
  const jobCategories = [...new Set(jobs.map(j => j.category))].sort()

  const filteredSchemes = schemes.filter(s => {
    const qOk = !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.audience.toLowerCase().includes(q.toLowerCase())
    const lOk = !levelFilter || s.level === levelFilter
    const cOk = !catFilter || s.category === catFilter
    return qOk && lOk && cOk
  })
  const filteredJobs = jobs.filter(j => {
    const qOk = !q || j.title.toLowerCase().includes(q.toLowerCase()) || j.organization.toLowerCase().includes(q.toLowerCase())
    const cOk = !catFilter || j.category === catFilter
    return qOk && cOk
  })

  async function saveScheme(scheme) {
    if (!sessionToken) { onNavigate('janavani'); return }
    try {
      await request('/saved-items', { method: 'POST', headers: { 'X-Civic-Session': sessionToken }, body: { item_type: 'scheme', item_id: scheme.id, item_name: scheme.name } })
    } catch { /* already saved or not signed in */ }
  }

  return (
    <div className="module-page">
      <PageHeading eyebrow="DISCOVER" title="Opportunity Dashboard" description="All government schemes, jobs and opportunities unified in one view." />
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '180px' }}>
          <Search size={16} style={{ color: 'var(--muted)' }} />
          <input className="text-input" placeholder="Search…" value={q} onChange={e => { setQ(e.target.value); setCatFilter('') }} style={{ flex: 1, padding: '0.5rem 0.6rem' }} />
        </span>
        {tab === 'schemes' && (
          <>
            <select className="text-input" value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={{ padding: '0.5rem 0.6rem' }}>
              <option value="">All levels</option>
              <option value="Central">Central</option>
              <option value="Karnataka">Karnataka</option>
            </select>
            <select className="text-input" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '0.5rem 0.6rem' }}>
              <option value="">All categories</option>
              {schemeCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        )}
        {tab === 'jobs' && (
          <select className="text-input" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '0.5rem 0.6rem' }}>
            <option value="">All categories</option>
            {jobCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>
      <div className="opp-dashboard-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[['schemes', 'Government Schemes'], ['jobs', 'Recruitment']].map(([id, label]) => (
          <button key={id} className={`button-secondary${tab === id ? ' active' : ''}`} onClick={() => { setTab(id); setCatFilter(''); setLevelFilter('') }} style={{ fontSize: '0.85rem' }}>{label}</button>
        ))}
      </div>
      {loading && <div className="state-loading"><LoaderCircle size={22} className="spin" /> Loading…</div>}
      {tab === 'schemes' && (
        <div className="unified-feed">
          {filteredSchemes.length === 0 && !loading && <div className="state-empty">No schemes match your search.</div>}
          {filteredSchemes.map(s => (
            <div key={s.id} className="panel" style={{ padding: '1rem 1.1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>{s.name}</strong>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <span className="job-status-badge">{s.level}</span>
                  <span className="job-status-badge">{s.category}</span>
                </div>
              </div>
              {s.audience && <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0.3rem 0 0.4rem' }}>For: {s.audience}</p>}
              <p style={{ fontSize: '0.88rem', color: 'var(--text)', margin: '0 0 0.5rem' }}>{s.description}</p>
              {s.benefits && <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--teal)', margin: '0 0 0.5rem' }}>Benefit: {s.benefits}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {s.application_url && <a href={s.application_url} target="_blank" rel="noopener noreferrer" className="button-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>Apply / Info <ExternalLink size={11} /></a>}
                {sessionToken && <button className="button-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }} onClick={() => saveScheme(s)}><Bookmark size={12} /> Save</button>}
              </div>
              {s.verified_on && <small style={{ display: 'block', color: 'var(--muted)', marginTop: '0.4rem' }}>Verified: {s.verified_on} · {s.source}</small>}
            </div>
          ))}
        </div>
      )}
      {tab === 'jobs' && (
        <div className="unified-feed">
          {filteredJobs.length === 0 && !loading && <div className="state-empty">No jobs match your search.</div>}
          {filteredJobs.map(j => (
            <div key={j.id} className="panel" style={{ padding: '1rem 1.1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>{j.title}</strong>
                <span className="job-status-badge">{j.category}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0.3rem 0 0.4rem' }}>{j.organization}</p>
              {j.qualification && <p style={{ fontSize: '0.84rem', color: 'var(--text)', margin: '0 0 0.3rem' }}><strong>Qualification:</strong> {j.qualification}</p>}
              {j.age_limit && <p style={{ fontSize: '0.84rem', color: 'var(--muted)', margin: '0 0 0.5rem' }}><strong>Age:</strong> {j.age_limit}</p>}
              <p style={{ fontSize: '0.78rem', color: '#dc2626', margin: '0 0 0.5rem' }}>⚠ Verify deadlines and vacancies on the official notification link.</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {j.notification_url && <a href={j.notification_url} target="_blank" rel="noopener noreferrer" className="button-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>Official Notification <ExternalLink size={11} /></a>}
                {j.portal_url && j.portal_url !== j.notification_url && <a href={j.portal_url} target="_blank" rel="noopener noreferrer" className="button-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>Apply Portal <ExternalLink size={11} /></a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AuthScreen({ onAuthenticated }) {
  const resetToken = new URLSearchParams(window.location.search).get('token')
  const [mode, setMode] = useState(resetToken ? 'reset' : 'login')
  const [form, setForm] = useState({ fullName: '', email: '', mobile: '', password: '', confirmPassword: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'forgot') {
        const result = await request('/auth/forgot-password', { method: 'POST', body: { email: form.email } })
        setError(result.email_sent
          ? 'Password-reset email sent. Check your inbox.'
          : 'If the account exists, a reset link will be sent. Email delivery may require SMTP configuration.')
        setBusy(false)
        return
      }
      if (mode === 'reset') {
        await request('/auth/reset-password', { method: 'POST', body: { token: resetToken, password: form.password } })
        window.history.replaceState({}, '', window.location.pathname)
        setMode('login')
        setForm((current) => ({ ...current, password: '' }))
        setError('Password reset successfully. Please log in.')
        setBusy(false)
        return
      }
      if (mode === 'register' && form.password !== form.confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (mode === 'register' && !/^(?:\+91)?[6-9]\d{9}$/.test(form.mobile.replace(/[^\d+]/g, ''))) {
        setError('Please enter a valid Indian mobile number.')
        return
      }
      const body = mode === 'register'
        ? { full_name: form.fullName, email: form.email, mobile: form.mobile, password: form.password }
        : { email: form.email, password: form.password }
      const result = await request(mode === 'register' ? '/auth/register' : '/auth/login', { method: 'POST', body })
      onAuthenticated(result.session_token, result.user)
    } catch (error) {
      setError(error.message || 'Unable to continue. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-screen">
    <section className="auth-card">
      <button className="brand auth-brand" type="button" aria-label="Civic Pulse 360"><span className="brand-mark"><span /><span /><span /><span /></span><span className="brand-copy"><strong>civic<span>pulse</span></strong><small>360 · PUBLIC SERVICES</small></span></button>
      <p className="eyebrow">CITIZEN WORKSPACE</p>
      <h1>{mode === 'login' ? 'Welcome back.' : mode === 'register' ? 'Create your account.' : mode === 'forgot' ? 'Reset your password.' : 'Choose a new password.'}</h1>
      <p className="auth-description">{mode === 'login' ? 'Sign in to access your secure Civic Pulse workspace.' : mode === 'register' ? 'Register to save preferences and keep complaint reports connected to your account.' : mode === 'forgot' ? 'Enter your account email to receive a secure, expiring reset link.' : 'This link is valid once and expires after 30 minutes.'}</p>
      <div className="auth-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>Login</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>Register</button></div>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' && <label>Full name<input required minLength="2" maxLength="80" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Your full name" /></label>}
        {mode !== 'reset' && <label>Email address<input required type="email" maxLength="160" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>}
        {mode === 'register' && <label>Mobile number<input required minLength="10" maxLength="15" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="+91 98765 43210" /></label>}
        {mode !== 'forgot' && <label>Password<div className="password-field"><input required minLength={mode === 'register' || mode === 'reset' ? 8 : 1} maxLength="128" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={mode === 'register' || mode === 'reset' ? 'At least 8 characters' : 'Enter your password'} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></label>}
        {mode === 'register' && <label>Confirm password<input required minLength="8" maxLength="128" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Re-enter your password" /></label>}
        {error && <p className="inline-error">{error}</p>}
        <button className="button-primary full-button" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : null}{mode === 'login' ? 'Login securely' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Reset password'}</button>
        {mode === 'login' && <button type="button" className="text-button" onClick={() => { setMode('forgot'); setError('') }}>Forgot password?</button>}
      </form>
      <p className="auth-security"><ShieldCheck size={13} /> Passwords are hashed. We never ask for OTPs or identity numbers.</p>
    </section>
  </main>
}

function ProfilePopover({ profile, sessionToken, onSave, onClose }) {
  const [draft, setDraft] = useState(profile)
  const [error, setError] = useState('')
  async function saveProfile(event) {
    event.preventDefault()
    setError('')
    try {
      const result = await request('/auth/profile', {
        method: 'PATCH',
        headers: { 'X-Civic-Session': sessionToken },
        body: { full_name: draft.name, location: draft.location, occupation: draft.occupation, language: draft.language },
      })
      const user = result.user
      onSave({ name: user.full_name, location: user.location, occupation: user.occupation, language: user.language })
      onClose()
    } catch (error) {
      setError(error.message || 'Could not save preferences.')
    }
  }
  async function logout() {
    try {
      await request('/auth/logout', { method: 'POST', headers: { 'X-Civic-Session': sessionToken } })
    } finally {
      localStorage.removeItem('civic-session')
      window.location.reload()
    }
  }
  return <form className="profile-popover" onSubmit={saveProfile}>
    <div className="popover-head"><span className="avatar">{draft.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><div><b>Your profile</b><small>Saved with your secure account</small></div><button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button></div>
    <label>Name<input value={draft.name} maxLength="80" onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
    <label>Location<input value={draft.location} maxLength="80" onChange={(e) => setDraft({ ...draft, location: e.target.value })} /></label>
    <label>Occupation<select value={draft.occupation} onChange={(e) => setDraft({ ...draft, occupation: e.target.value })}><option>Student</option><option>Farmer</option><option>Entrepreneur</option><option>Citizen</option><option>Professional</option></select></label>
    <label>Preferred language<select value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })}><option>English</option><option>हिन्दी</option><option>ಕನ್ನಡ</option><option>తెలుగు</option><option>தமிழ್</option></select></label>
    {error && <p className="inline-error">{error}</p>}
    <button className="button-primary full-button">Save preferences <Check size={14} /></button>
    <button type="button" className="button-secondary full-button" onClick={logout}>Logout</button>
  </form>
}

function EmptyState({ icon: Icon, title, text }) {
  return <div className="empty-state"><span><Icon size={20} /></span><b>{title}</b><p>{text}</p></div>
}

export default App
