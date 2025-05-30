export default function QuizDetailLayout({ children }) {
  return (
    <div style={{ padding: '1rem', backgroundColor: '#fefefe' }}>
      <h3>Szczegóły quizu</h3>
      <div style={{ marginTop: '1rem' }}>
        {children}
      </div>
    </div>
  );
}
