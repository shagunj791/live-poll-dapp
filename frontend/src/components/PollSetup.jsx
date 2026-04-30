function PollSetup({
  question,
  setQuestion,
  optionsInput,
  setOptionsInput,
  onInitialize,
  initialized,
  submitting,
}) {
  const isDisabled = initialized || submitting

  return (
    <section style={{ marginTop: '16px' }}>
      <h2>Poll Setup</h2>

      <div style={{ display: 'grid', gap: '8px', maxWidth: '480px' }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isDisabled}
          placeholder="Enter poll question"
        />

        <input
          value={optionsInput}
          onChange={(e) => setOptionsInput(e.target.value)}
          disabled={isDisabled}
          placeholder="Option A, Option B"
        />

        <button onClick={onInitialize} disabled={initialized || submitting}>
          {initialized ? 'Poll Initialized' : 'Initialize Poll'}
        </button>
      </div>
    </section>
  )
}

export default PollSetup
