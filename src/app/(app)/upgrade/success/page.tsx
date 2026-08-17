import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/app/motion";
import { EmptyState, IconApproved } from "@/components/field";

export const metadata: Metadata = { title: "Welcome" };

export default function CheckoutSuccessPage() {
  return (
    <Reveal>
      <EmptyState
        icon={<IconApproved width={40} height={40} />}
        title="You're in."
        action={
          <Link href="/dashboard" className="btn btn-signal">
            Take your first quest
          </Link>
        }
      >
        Unlimited quests, worldwide, and the printed sticker sheet in the post. The receipt is on its
        way to your inbox.
      </EmptyState>
    </Reveal>
  );
}
