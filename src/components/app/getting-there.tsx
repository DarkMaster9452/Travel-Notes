import { ApproachMap, Panel, PanelHead, Tag } from "@/components/field";
import type { QuestSummary } from "@/types/quest";

/**
 * Where to leave the car.
 *
 * Renders nothing at all unless an admin has actually filled it in. A quest
 * with an empty parking panel is worse than a quest with none: it reads as a
 * missing answer rather than as a start with no car park, and plenty of starts
 * are a bus stop or a village square.
 *
 * Generated quests never have one. Nobody has walked them to find out where to
 * park, and coordinates invented for a car park are the worst kind of made-up
 * detail — the sort somebody would drive to.
 */
export function GettingThere({ quest }: { quest: QuestSummary }) {
  if (quest.parkingLat == null || quest.parkingLng == null) return null;

  return (
    <Panel flush>
      <PanelHead
        title="Getting there"
        aside={
          quest.approachTime ? (
            <Tag tone="ghost">{quest.approachTime} min to the start</Tag>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-4 px-5 py-5">
        {quest.parkingName && (
          <p className="text-[15px] font-semibold tracking-[-0.01em]">{quest.parkingName}</p>
        )}
        <ApproachMap
          parking={{ lat: quest.parkingLat, lng: quest.parkingLng }}
          start={{ lat: quest.latitude, lng: quest.longitude }}
        />
        {quest.parkingNote && <p className="quest-note">{quest.parkingNote}</p>}
        {quest.transitNote && (
          <p className="quest-note">
            <b>Without a car — </b>
            {quest.transitNote}
          </p>
        )}
      </div>
    </Panel>
  );
}
