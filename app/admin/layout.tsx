import { requireAdmin } from "@/lib/access";

export const metadata = { title: "Local Admin, ExpatPreneurs Global" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <>
      {children}
    </>
  );
}