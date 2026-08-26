/**
 * Most routes have nothing worth standing beside the content.
 *
 * Returning null here is what makes the third column optional without any
 * page needing to declare it: the slot renders empty, the CSS sees an empty
 * aside and gives the column back to the content.
 */
export default function RailDefault() {
  return null;
}
