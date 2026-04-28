function ResultsPanel({ results, options, loading }) {
  return (
    <section style={{ marginTop: '16px' }}>
      <h2>Live Results</h2>

      {loading ? (
        <p>Loading...</p>
      ) : results.length > 0 ? (
        results.map((count, index) => (
          <p key={`${options[index] || 'option'}-${index}`}>
            {options[index] || `Option ${index + 1}`}: {count}
          </p>
        ))
      ) : (
        <p>No results yet</p>
      )}
    </section>
  )
}

export default ResultsPanel
