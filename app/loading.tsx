import { Skeleton } from "@/components/skeleton";

// Shown the moment a link is clicked, under the header, until the page
// itself arrives.
export default function Loading() {
  return (
    <div className="pub">
      <section className="pubsec">
        <Skeleton rows={3} />
      </section>
    </div>
  );
}