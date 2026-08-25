import { redirect } from "next/navigation";

/** `/settings` is not a pane of its own — it is the first one. */
export default function SettingsIndex() {
  redirect("/settings/general");
}
