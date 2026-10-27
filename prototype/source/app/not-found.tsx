import Link from "next/link";
export default function NotFound() {
  return (
    <div className="wrap empty-page">
      <h1>Page not found</h1>
      <p>That page may have moved or is not available.</p>
      <Link className="btn" href="/">
        Back to home
      </Link>
    </div>
  );
}
