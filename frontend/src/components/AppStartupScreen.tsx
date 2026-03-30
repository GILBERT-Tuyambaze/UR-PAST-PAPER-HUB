import BrandMark from './BrandMark';

interface AppStartupScreenProps {
  status: 'loading' | 'ready';
}

export default function AppStartupScreen({
  status,
}: AppStartupScreenProps) {
  return (
    <div
      className={`startup-shell ${status === 'ready' ? 'startup-shell--exit' : ''}`}
      aria-hidden={status === 'ready'}
    >
      <div className="startup-orbit startup-orbit--one" />
      <div className="startup-orbit startup-orbit--two" />
      <div className="startup-card">
        <BrandMark
          label
          className="justify-center"
          imageClassName="h-16 w-16"
          labelClassName="startup-wordmark"
        />
        <p className="startup-copy">
          Preparing your library, syncing runtime settings, and getting the first screen ready.
        </p>
        <div className="startup-meter" role="progressbar" aria-label="Loading application">
          <span className="startup-meter__bar" />
        </div>
      </div>
    </div>
  );
}
