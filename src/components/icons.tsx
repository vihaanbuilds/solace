// A small hand-drawn icon set (line-art, currentColor) that replaces every
// platform emoji glyph in the app so the UI reads consistently across OSes,
// matching how Gemini/ChatGPT use their own icon language instead of emoji.
import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    viewBox: '0 0 24 24',
    width: '1.15em',
    height: '1.15em',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
    ...props,
  };
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.4" y2="16.4" />
    </svg>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 16v4Z" />
      <line x1="14.5" y1="7" x2="17" y2="9.5" />
    </svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="18" cy="5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="19" r="2.6" />
      <line x1="8.3" y1="10.7" x2="15.7" y2="6.3" />
      <line x1="8.3" y1="13.3" x2="15.7" y2="17.7" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6.5 7l1 12.2A2 2 0 0 0 9.5 21h5a2 2 0 0 0 2-1.8L17.5 7" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="11" width="14" height="9" rx="2.2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </svg>
  );
}

export function UnlockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="11" width="14" height="9" rx="2.2" />
      <path d="M8 11V7.5a4 4 0 0 1 7.4-2.2" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4.2" />
      <line x1="12" y1="19.8" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.2" y2="12" />
      <line x1="19.8" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="6.4" y2="6.4" />
      <line x1="17.6" y1="17.6" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="6.4" y2="17.6" />
      <line x1="17.6" y1="6.4" x2="19.1" y2="4.9" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 14.3A8.4 8.4 0 1 1 9.7 4a7 7 0 0 0 10.3 10.3Z" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="4" y1="6.5" x2="20" y2="6.5" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17.5" x2="20" y2="17.5" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polyline points="14.5 5 8 12 14.5 19" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
      <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="8 7 17 7 17 16" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9.5 14.5l5-5" />
      <path d="M11.5 5.5l1-1a3.7 3.7 0 0 1 5.2 5.2l-2 2" />
      <path d="M12.5 18.5l-1 1a3.7 3.7 0 0 1-5.2-5.2l2-2" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 4.2h3.3l1.6 4-2 1.6a11.4 11.4 0 0 0 5.3 5.3l1.6-2 4 1.6V18a1.8 1.8 0 0 1-1.9 1.8A15.6 15.6 0 0 1 3.2 6.1 1.8 1.8 0 0 1 5 4.2Z" />
    </svg>
  );
}

export function ChatBubbleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5.5h16v10.5H9l-4 3.5V16H4Z" />
    </svg>
  );
}
