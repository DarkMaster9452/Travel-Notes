/**
 * Client-safe formatting helpers.
 *
 * Kept out of `@/lib/i18n` because that module reaches for `next/headers`,
 * which a client component may not import — even transitively.
 */

/**
 * Fill `{placeholders}` in a dictionary string.
 *
 * Deliberately tiny: the alternative is an ICU message library, which this
 * product's copy doesn't need — there is no pluralisation or gender agreement
 * in the interpolated values.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
