import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveVoiceNavigation } from './voiceNavigation.js'

const navigationItems = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'janavani', label: 'Janavani AI' },
  { id: 'civic-eye', label: 'Civic Eye' },
  { id: 'seva-agent', label: 'Seva Agent' },
  { id: 'satya-check', label: 'Satya Check' },
  { id: 'opportunity-hub', label: 'Opportunity Hub' },
  { id: 'loan-connect', label: 'Loan Connect' },
  { id: 'opportunity-radar', label: 'Opportunity Radar' },
  { id: 'civic-brain', label: 'Civic Brain' },
  { id: 'civic-docs', label: 'Civic Docs AI' },
  { id: 'civic-alert', label: 'Civic Alert' },
  { id: 'bengaluru', label: 'Bengaluru 360' },
  { id: 'travel-hub', label: 'Travel & Booking' },
  { id: 'regional-status', label: 'Regional Status' },
]

const navigationCases = [
  ['Open Janavani AI.', 'janavani'],
  ['Take me to Civic Docs AI.', 'civic-docs'],
  ['Open Bengaluru 360.', 'bengaluru'],
  ['Show Civic Eye.', 'civic-eye'],
  ['Open Seva Agent.', 'seva-agent'],
  ['Show Satya Check.', 'satya-check'],
  ['Go to Loan Connect AI.', 'loan-connect'],
  ['Open my dashboard.', 'dashboard'],
  ['Take me to Regional Status.', 'regional-status'],
  ['Open the travel booking section.', 'travel-hub'],
  ['Open Opportunity Radar.', 'opportunity-radar'],
  ['Show Civic Brain.', 'civic-brain'],
  ['Open Civic Alert.', 'civic-alert'],
  ['Go to complaint registration.', 'civic-eye'],
  ['Show me government services.', 'janavani'],
  ['Open scholarship portal.', 'scholarship-portal'],
  ['ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ', 'opportunity-hub'],
  ['दस्तावेज़ चेकलिस्ट खोलो', 'civic-docs'],
  ['புகார் பதிவு', 'civic-eye'],
  ['పత్రాల సేవలు తెరవండి', 'civic-docs'],
  ['പ്രാദേശിക നില കാണിക്കുക', 'regional-status'],
  ['दस्तावेज़ सेवा उघडा', 'civic-docs'],
  ['বৃত্তি পোর্টাল খুলুন', 'opportunity-hub'],
  ['શિષ્યવૃત્તિ પોર્ટલ ખોલો', 'opportunity-hub'],
  ['ਵਜ਼ੀਫ਼ਾ ਪੋਰਟਲ ਖੋਲ੍ਹੋ', 'opportunity-hub'],
  ['اسکالرشپ پورٹل کھولیں', 'opportunity-hub'],
]

test('routes explicit English and localized navigation commands to the matching module', () => {
  for (const [command, expectedId] of navigationCases) {
    const result = resolveVoiceNavigation(command, navigationItems)
    if (expectedId === 'scholarship-portal') {
      assert.deepEqual(result, {
        type: 'portal',
        id: 'scholarship-portal',
        label: 'National Scholarship Portal',
        href: 'https://scholarships.gov.in/',
      }, command)
    } else {
      assert.deepEqual(result, {
        type: 'navigate',
        id: expectedId,
        label: navigationItems.find((item) => item.id === expectedId).label,
      }, command)
    }
  }
})

test('does not send unrelated document or civic requests to the scholarship hub', () => {
  for (const text of [
    'What documents do I need for a scholarship?',
    'How do I report a civic issue?',
    'I need help finding a service',
  ]) {
    assert.deepEqual(resolveVoiceNavigation(text, navigationItems), { type: 'none' }, text)
  }
})

test('asks for clarification on an unknown requested page', () => {
  assert.equal(resolveVoiceNavigation('Open the benefits page', navigationItems).type, 'clarify')
})

test('recognizes account destinations in supported regional languages', () => {
  for (const [command, mode] of [
    ['Open account settings', 'profile'],
    ['ನೋಂದಣಿ ತೆರೆಯಿರಿ', 'register'],
    ['लॉगिन खोलो', 'login'],
    ['নিবন্ধন করুন খুলুন', 'register'],
    ['લૉગિન ખોલો', 'login'],
    ['رجسٹر کریں کھولیں', 'register'],
  ]) {
    const result = resolveVoiceNavigation(command, navigationItems)
    if (mode === 'profile') assert.equal(result.type, mode, command)
    else assert.deepEqual(result, { type: 'auth', mode }, command)
  }
})
