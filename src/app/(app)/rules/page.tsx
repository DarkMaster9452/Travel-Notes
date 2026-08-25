import { redirect } from "next/navigation";

/**
 * The rules moved into the settings shell, at `/profile/rules`. This route
 * stays as a plain redirect for whatever still points at it unqualified.
 *
 * It does *not* preserve a `#anchor` — a server redirect drops the fragment,
 * since a browser never sends it to the server in the first place. Anything
 * that links to a specific rule group links straight to `/profile/rules#…`
 * instead of through here.
 */
export default function RulesRedirect() {
  redirect("/profile/rules");
}
