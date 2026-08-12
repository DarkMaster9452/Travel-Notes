"use client";

import * as React from "react";
import { useActionState } from "react";

import type { AdminState } from "@/app/(app)/admin/actions";
import { Button, Marker, Spinner } from "@/components/stopa/ui";
import { CATEGORIES, CATEGORY_IDS, type QuestCategoryId } from "@/lib/gamification";
import type { Dictionary } from "@/lib/i18n/dictionaries/sk";

export type PendingItem = {
  id: string;
  photo: string;
  caption: string | null;
  difficulty: string;
  createdAt: string;
  user: { name: string; email: string };
  quest: { title: string; points: number; category: QuestCategoryId };
};

/**
 * Review queue. Each card carries its own form so approving one submission
 * doesn't disturb the rest, and the reply travels with the decision — the
 * admin never has to send a separate message.
 */
export function ReviewCard({
  item,
  action,
  t,
}: {
  item: PendingItem;
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  t: Dictionary;
}) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(action, undefined);

  if (state?.ok) {
    return (
      <li className="rounded-[12px] border border-olive bg-olive/15 px-4 py-3 text-sm">
        {t.admin.reviewed} — {item.quest.title} · {item.user.name}
      </li>
    );
  }

  return (
    <li className="card-solid overflow-hidden p-0">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <Marker color={CATEGORIES[item.quest.category].marker} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg">{item.quest.title}</p>
          <p className="truncate text-xs text-moss">
            {item.user.name} · {item.user.email}
          </p>
        </div>
        <span className="shrink-0 font-serif tabular-nums text-cream/80">
          +{item.quest.points}
        </span>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.photo}
        alt={`${item.quest.title} — ${item.user.name}`}
        className="aspect-[4/3] w-full bg-forest-deep object-cover"
        loading="lazy"
      />

      <div className="px-4 py-3.5">
        <p className="text-sm text-moss">{t.difficulty[item.difficulty as keyof typeof t.difficulty]}</p>
        {item.caption && <p className="mt-2 font-serif leading-relaxed">{item.caption}</p>}

        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="submissionId" value={item.id} />

          <label className="block">
            <span className="text-xs uppercase tracking-[0.12em] text-moss">{t.admin.reply}</span>
            <input
              name="note"
              maxLength={300}
              placeholder={t.admin.replyPlaceholder}
              className="mt-2 h-11 w-full rounded-[10px] border border-cream/20 bg-transparent px-3 text-sm text-cream placeholder:text-moss/70 focus:border-amber focus:outline-none"
            />
          </label>

          <label className="flex items-center gap-2.5 text-sm text-moss">
            <input
              type="checkbox"
              name="notePublic"
              defaultChecked
              className="size-4 accent-amber"
            />
            {t.admin.replyPublic}
          </label>

          <div className="flex gap-2.5">
            <Button
              type="submit"
              name="decision"
              value="APPROVE"
              className="flex-1"
              disabled={pending}
            >
              {pending && <Spinner />}
              {t.admin.approve}
            </Button>
            <Button
              type="submit"
              name="decision"
              value="REJECT"
              variant="danger"
              className="flex-1"
              disabled={pending}
            >
              {t.admin.reject}
            </Button>
          </div>
        </form>
      </div>
    </li>
  );
}

/** Create next week's challenge. */
export function CreateQuestForm({
  action,
  t,
  defaults,
  suggestions,
}: {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  t: Dictionary;
  defaults: { publishedAt: string; closesAt: string };
  suggestions: Array<{ title: string; location: string; region: string; category: QuestCategoryId }>;
}) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(action, undefined);
  const [category, setCategory] = React.useState<QuestCategoryId>("SUMMIT");
  const [values, setValues] = React.useState({ title: "", location: "", region: "" });

  const suggest = () => {
    const pick = suggestions[Math.floor(Math.random() * suggestions.length)];
    if (!pick) return;
    setValues({ title: pick.title, location: pick.location, region: pick.region });
    setCategory(pick.category);
  };

  return (
    <form action={formAction} className="space-y-4">
      {state?.ok && (
        <p className="rounded-[10px] border border-olive bg-olive/15 px-4 py-3 text-sm">
          {t.admin.created}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {CATEGORY_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setCategory(id)}
            aria-pressed={category === id}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              category === id
                ? "border-amber bg-amber/15 text-cream"
                : "border-cream/20 text-cream/75 hover:border-cream/45"
            }`}
          >
            {t.categories[id]}
          </button>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={suggest}>
          {t.admin.suggest}
        </Button>
      </div>
      <input type="hidden" name="category" value={category} />

      <Field label={t.admin.questTitle} name="title" value={values.title} onChange={(v) => setValues({ ...values, title: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.admin.questLocation} name="location" value={values.location} onChange={(v) => setValues({ ...values, location: v })} />
        <Field label={t.admin.questRegion} name="region" value={values.region} onChange={(v) => setValues({ ...values, region: v })} />
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-[0.12em] text-moss">
          {t.admin.questDescription}
        </span>
        <textarea
          name="description"
          rows={3}
          required
          minLength={10}
          maxLength={600}
          className="mt-2 w-full rounded-[10px] border border-cream/20 bg-transparent px-3 py-2.5 font-serif text-cream focus:border-amber focus:outline-none"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.12em] text-moss">{t.admin.questPoints}</span>
          <input
            type="number"
            name="points"
            min={10}
            max={2000}
            defaultValue={CATEGORIES[category].defaultPoints}
            key={category}
            required
            className="mt-2 h-11 w-full rounded-[10px] border border-cream/20 bg-transparent px-3 text-cream focus:border-amber focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.12em] text-moss">
            {t.admin.questPublishedAt}
          </span>
          <input
            type="datetime-local"
            name="publishedAt"
            defaultValue={defaults.publishedAt}
            required
            className="mt-2 h-11 w-full rounded-[10px] border border-cream/20 bg-transparent px-3 text-cream focus:border-amber focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.12em] text-moss">
            {t.admin.questClosesAt}
          </span>
          <input
            type="datetime-local"
            name="closesAt"
            defaultValue={defaults.closesAt}
            required
            className="mt-2 h-11 w-full rounded-[10px] border border-cream/20 bg-transparent px-3 text-cream focus:border-amber focus:outline-none"
          />
        </label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <Spinner />}
        {pending ? t.admin.creating : t.admin.create}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.12em] text-moss">{label}</span>
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        maxLength={80}
        className="mt-2 h-11 w-full rounded-[10px] border border-cream/20 bg-transparent px-3 font-serif text-cream focus:border-amber focus:outline-none"
      />
    </label>
  );
}
