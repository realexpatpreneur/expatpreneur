import { requireGlobal } from "@/lib/access";

export const metadata = { title: "Global team, ExpatPreneurs Global" };

export default async function GlobalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireGlobal();

  return (
    <>
      {children}
    </>
  );
}