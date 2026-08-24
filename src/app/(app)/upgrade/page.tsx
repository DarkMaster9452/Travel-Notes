import { redirect } from "next/navigation";

/**
 * Plans and billing moved into the settings shell, at `/profile/plan`. This
 * route stays because it is still what half the product links to — the plan
 * mark's default href, the dashboard's upgrade prompts, the achievements
 * page's locked stickers — and a redirect costs nothing next to updating
 * every one of those call sites for a page that still exists, just one level
 * deeper.
 */
export default function UpgradeRedirect() {
  redirect("/profile/plan");
}
