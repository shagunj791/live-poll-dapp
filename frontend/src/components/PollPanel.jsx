import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CONTRACT_ERRORS,
  TX_STATUS,
  getResults,
  hasVoted,
  initializePoll,
  vote,
} from '../services/contractService'
import PollSetup from './PollSetup'
import VotingPanel from './VotingPanel'
import ResultsPanel from './ResultsPanel'

function PollPanel({ address, canSignTransactions }) {
  const [question, setQuestion] = useState('Ship this release?')
  const [optionsInput, setOptionsInput] = useState('Yes,No')
  const [results, setResults] = useState([])
  const [voted, setVoted] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [txStatus, setTxStatus] = useState(TX_STATUS.IDLE)
  const [txMessage, setTxMessage] = useState('')
  const [loadingPoll, setLoadingPoll] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const parsedOptions = useMemo(
    () =>
      optionsInput
        .split(',')
        .map((option) => option.trim())
        .filter(Boolean),
    [optionsInput]
  )

  const options = parsedOptions.length ? parsedOptions : ['Yes', 'No']

  const refreshPollState = useCallback(async () => {
    if (!address) return

    setLoadingPoll(true)

    try {
      const [nextResults, alreadyVoted] = await Promise.all([
        getResults(),
        hasVoted(address),
      ])

      setResults(nextResults)
      setVoted(alreadyVoted)

      if (nextResults.length > 0) {
        setInitialized(true)
      }

      setTxStatus(TX_STATUS.IDLE)
      setTxMessage('')
    } catch (error) {
      if (error.type === CONTRACT_ERRORS.NOT_INITIALIZED) {
        setResults([])
        setVoted(false)
        setInitialized(false)
      } else {
        setTxStatus(TX_STATUS.ERROR)
        setTxMessage(error.message)
      }
    } finally {
      setLoadingPoll(false)
    }
  }, [address])

  useEffect(() => {
    if (!address) return

    refreshPollState()

    const interval = setInterval(refreshPollState, 5000)
    return () => clearInterval(interval)
  }, [address, refreshPollState])

  const handleInitializePoll = async () => {
    if (!address || !canSignTransactions) return

    if (parsedOptions.length === 0) {
      setTxStatus(TX_STATUS.ERROR)
      setTxMessage('Add at least one option.')
      return
    }

    setSubmitting(true)
    setTxStatus(TX_STATUS.PENDING)
    setTxMessage('Initializing poll...')

    try {
      const txHash = await initializePoll(question, parsedOptions, address)

      setInitialized(true)
      setTxStatus(TX_STATUS.SUCCESS)
      setTxMessage(`Poll initialized. TX: ${txHash}`)

      await refreshPollState()
    } catch (error) {
      if (error.message.includes('#1')) {
        setInitialized(true)
        setTxStatus(TX_STATUS.SUCCESS)
        setTxMessage('Poll already initialized.')
      } else {
        setTxStatus(TX_STATUS.ERROR)
        setTxMessage(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (index) => {
    if (!address || voted || !canSignTransactions) return

    setSubmitting(true)
    setTxStatus(TX_STATUS.PENDING)
    setTxMessage('Submitting vote...')

    try {
      const txHash = await vote(index, address)

      setTxStatus(TX_STATUS.SUCCESS)
      setTxMessage(`Vote submitted. TX: ${txHash}`)
      setVoted(true)

      await refreshPollState()
    } catch (error) {
      if (error.type === CONTRACT_ERRORS.ALREADY_VOTED) {
        setVoted(true)
        setTxStatus(TX_STATUS.SUCCESS)
        setTxMessage('Already voted.')
      } else {
        setTxStatus(TX_STATUS.ERROR)
        setTxMessage(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section style={{ marginTop: '16px' }}>
      <PollSetup
        question={question}
        setQuestion={setQuestion}
        optionsInput={optionsInput}
        setOptionsInput={setOptionsInput}
        onInitialize={handleInitializePoll}
        initialized={initialized}
        submitting={submitting}
      />

      <VotingPanel
        options={options}
        voted={voted}
        submitting={submitting}
        canSignTransactions={canSignTransactions}
        onVote={handleVote}
      />

      <ResultsPanel results={results} options={options} loading={loadingPoll} />

      <p>
        Transaction status: {txStatus === TX_STATUS.IDLE ? 'idle' : txStatus}
      </p>

      {txMessage && <p>{txMessage}</p>}
    </section>
  )
}

export default PollPanel
