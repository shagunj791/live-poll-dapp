function VotingPanel({
  options,
  voted,
  submitting,
  canSignTransactions,
  onVote,
}) {
  const isDisabled = voted || submitting || !canSignTransactions

  return (
    <section style={{ marginTop: '16px' }}>
      <h2>Cast Vote</h2>

      {!canSignTransactions && (
        <p role="alert">Freighter wallet required for transactions.</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {options.map((option, index) => (
          <button
            key={`${option}-${index}`}
            onClick={() => onVote(index)}
            disabled={isDisabled}
          >
            {submitting
              ? 'Submitting...'
              : voted
              ? 'Voted'
              : `Vote: ${option}`}
          </button>
        ))}
      </div>
    </section>
  )
}

export default VotingPanel
