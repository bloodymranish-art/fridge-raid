export default function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <p className="error-title">The fridge raid didn't work out.</p>
      <p className="error-message">{message}</p>
      <button type="button" className="retry-button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
