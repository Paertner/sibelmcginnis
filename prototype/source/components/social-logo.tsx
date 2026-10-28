/** White brand marks for the Social links block, drawn on a 24px grid. */
export function SocialLogo({
  network,
  size = 20,
}: {
  network: "facebook" | "instagram" | "linkedin";
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="#fff"
    >
      {network === "facebook" ? (
        <path d="M13.6 21.5v-8.2h2.8l.4-3.3h-3.2V7.9c0-.9.3-1.6 1.6-1.6h1.7V3.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2V10H7.5v3.3h2.8v8.2z" />
      ) : network === "instagram" ? (
        <>
          <path
            d="M7.6 2.8h8.8a4.8 4.8 0 0 1 4.8 4.8v8.8a4.8 4.8 0 0 1-4.8 4.8H7.6a4.8 4.8 0 0 1-4.8-4.8V7.6a4.8 4.8 0 0 1 4.8-4.8z"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
          />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="17.4" cy="6.6" r="1.25" />
        </>
      ) : (
        <>
          <path d="M3.6 9h3.7v11.5H3.6z" />
          <circle cx="5.45" cy="5.2" r="2.15" />
          <path d="M9.7 9h3.5v1.6c.5-.9 1.7-1.9 3.6-1.9 3.8 0 4.5 2.5 4.5 5.7v6.1h-3.7v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.5H9.7z" />
        </>
      )}
    </svg>
  );
}
