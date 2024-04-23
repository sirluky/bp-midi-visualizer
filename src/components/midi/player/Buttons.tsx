import { cn } from "~/lib/utils";

export function PlayPauseButton({
  isPlaying,
  onClick,
}: {
  isPlaying: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-full p-3 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
      onClick={onClick}
    >
      {isPlaying ? (
        <PauseIcon className="h-16 w-16 light:fill-gray-700" />
      ) : (
        <PlayIcon className="h-16 w-16 light:fill-gray-700" />
      )}
    </button>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function StopButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      className={cn(
        disabled && "opacity-50",
        "rounded-full p-3 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none",
      )}
      onClick={onClick}
    >
      <StopIcon className="h-16 w-16" />
    </button>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={cn(className)} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
        clipRule="evenodd"
      />
    </svg>
  );
}
