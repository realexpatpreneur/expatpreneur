import { redirect } from "next/navigation";

// Editing happens in Settings, where the rest of the account lives.
export default function EditProfilePage() {
  redirect("/settings");
}