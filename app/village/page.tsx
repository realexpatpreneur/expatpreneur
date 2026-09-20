import { redirect } from "next/navigation";

// Ask & Offer now lives in the Village space, as the first of its tabs.
export default function VillageRedirect() {
  redirect("/my-village");
}