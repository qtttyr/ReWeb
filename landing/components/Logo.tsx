// ReWeb mark — "the extraction".
// An open frame (a page, missing its top-right corner) with a node being
// pulled out of it along the diagonal: an element extracted from the DOM.
// Our own geometry, not from any reference.

export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* the open frame */}
      <path
        d="M12 5H8a3 3 0 0 0-3 3v16a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3v-4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* the extraction stroke */}
      <path
        d="M13.5 18.5 20 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* the extracted node */}
      <circle cx="23.75" cy="8.25" r="3.4" fill="currentColor" />
    </svg>
  );
}
