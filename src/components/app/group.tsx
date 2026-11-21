"use client";

import { Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { createGroupAction, joinGroupAction, leaveGroupAction } from "@/app/(app)/people/actions";
import { ConfirmButton } from "@/components/app/forms";
import { useT } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, FieldError, FieldStack, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

/** Start a group. Two fields, because a group is two fields and a roster. */
export function GroupStarter() {
  const t = useT();
  const words = t.app.people.starter;
  const id = useId();
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader title={words.title} note={words.body} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          start(() => {
            void createGroupAction(data).then((result) => {
              if (!result.ok) {
                setError(result.message ?? t.app.form.failed);
                return;
              }
              setError(null);
              toast(words.started);
              router.push(`/people/groups/${result.slug}`);
            });
          });
        }}
      >
        <FieldStack>
          <Field label={words.name} htmlFor={`${id}-name`}>
            <Input id={`${id}-name`} name="name" required maxLength={60} placeholder={t.groups.namePlaceholder} />
          </Field>
          <Field label={words.blurb} htmlFor={`${id}-blurb`} optional={t.ui.optional}>
            <Input id={`${id}-blurb`} name="blurb" maxLength={240} placeholder={t.groups.blurbPlaceholder} />
          </Field>
          {error ? <FieldError>{error}</FieldError> : null}
          <Button type="submit" block loading={pending}>
            {pending ? words.starting : words.submit}
          </Button>
        </FieldStack>
      </form>
    </Card>
  );
}

/** Join or leave, and copy the invite link — which is the whole membership UI. */
export function GroupMembership({
  slug,
  joined,
  isOwner,
}: {
  slug: string;
  joined: boolean;
  isOwner?: boolean;
}) {
  const t = useT();
  const words = t.app.people.membership;
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  if (!joined) {
    return (
      <Button
        loading={pending}
        onClick={() =>
          start(() => {
            void joinGroupAction(slug).then((result) => {
              if (!result.ok) return toast(result.message ?? words.joinFailed, "error");
              router.refresh();
            });
          })
        }
      >
        {pending ? words.joining : words.join}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        onClick={() => {
          void navigator.clipboard
            ?.writeText(`${window.location.origin}/people/groups/${slug}`)
            .then(() => toast(words.copied))
            .catch(() => toast(words.copyFailed, "error"));
        }}
      >
        <Link2 aria-hidden="true" />
        {words.copy}
      </Button>
      <ConfirmButton
        tone="danger"
        label={isOwner ? words.leaveOwner : words.leave}
        confirmLabel={words.leaveConfirm}
        action={async () => {
          const result = await leaveGroupAction(slug);
          return { ok: result.ok, message: result.ok ? words.left : (result.message ?? words.leaveFailed) };
        }}
        onDone={() => router.push("/people?tab=groups")}
      />
    </div>
  );
}
