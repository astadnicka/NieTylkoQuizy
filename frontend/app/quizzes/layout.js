export default function QuizzesLayout({ children }) {
  return (
    <div style={{ border: '2px solid #ccc', padding: '1rem', margin: '1rem' }}>
      <h2>Quizy</h2>
      <p style={{ color: 'gray' }}>Wybierz quiz z listy lub przeglądaj szczegóły</p>
      <hr />
      {children}
    </div>
  );
}
