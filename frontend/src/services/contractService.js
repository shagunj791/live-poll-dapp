// DEMO MODE ONLY

export const TX_STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
}

export const CONTRACT_ERRORS = {
  ALREADY_VOTED: 'ALREADY_VOTED',
  NOT_INITIALIZED: 'NOT_INITIALIZED',
}

// ---- DEMO STATE ----
let results = [0, 0]
let votedMap = {}
let initialized = false

function fakeHash() {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

// ---- METHODS ----

export async function initializePoll(question, options, address) {
  initialized = true
  results = new Array(options.length).fill(0)
  votedMap = {}

  return fakeHash()
}

export async function vote(index, address) {
  if (votedMap[address]) {
    const err = new Error('Already voted')
    err.type = CONTRACT_ERRORS.ALREADY_VOTED
    throw err
  }

  results[index] += 1
  votedMap[address] = true

  return fakeHash()
}

export async function getResults() {
  if (!initialized) {
    const err = new Error('Not initialized')
    err.type = CONTRACT_ERRORS.NOT_INITIALIZED
    throw err
  }
  return results
}

export async function hasVoted(address) {
  return votedMap[address] || false
}