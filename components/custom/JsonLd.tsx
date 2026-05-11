// biome-ignore lint/security/noDangerouslySetInnerHtml: compile-time JSON-LD only, no user input
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: compile-time JSON-LD only
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
