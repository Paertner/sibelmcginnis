export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="wrap empty-page">
      <h1>Something went wrong</h1>
      <p>Please try loading this page again.</p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
