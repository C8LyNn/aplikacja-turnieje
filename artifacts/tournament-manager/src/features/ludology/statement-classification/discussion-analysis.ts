import type {
  ArgumentRelationType,
  DiscussionArgumentLink,
  ResearchArgument,
  ResearchDiscussion,
  ResearchPerson,
  ResearchProjectData,
  ResearchSource,
} from "./model";

export type DiscussionTimelineItem = {
  link: DiscussionArgumentLink;
  argument: ResearchArgument;
  source: ResearchSource;
  person: ResearchPerson | null;
  publishedAt: string | null;
};

export type DiscussionSummary = {
  discussion: ResearchDiscussion;
  arguments: number;
  sources: number;
  people: number;
  firstPublishedAt: string | null;
  lastPublishedAt: string | null;
  undatedArguments: number;
};

function sortKey(item: DiscussionTimelineItem): string {
  const date = item.publishedAt ?? "9999-12-31";
  const time = item.argument.timestampStart ?? Number.MAX_SAFE_INTEGER;
  const order = item.link.order ?? Number.MAX_SAFE_INTEGER;
  return `${date}::${String(time).padStart(12, "0")}::${String(order).padStart(8, "0")}::${item.argument.id}`;
}

export function discussionTimeline(
  data: ResearchProjectData,
  discussionId: string,
): DiscussionTimelineItem[] {
  const links = data.discussionLinks.filter(
    (link) => link.discussionId === discussionId,
  );

  return links
    .map((link) => {
      const argument = data.arguments.find((item) => item.id === link.argumentId);
      if (!argument) return null;
      const source = data.sources.find((item) => item.id === argument.sourceId);
      if (!source) return null;
      const person =
        data.people.find((item) => item.id === source.personId) ?? null;
      return {
        link,
        argument,
        source,
        person,
        publishedAt: source.publishedAt ?? null,
      } satisfies DiscussionTimelineItem;
    })
    .filter((item): item is DiscussionTimelineItem => item !== null)
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

export function discussionSummary(
  data: ResearchProjectData,
  discussionId: string,
): DiscussionSummary | null {
  const discussion = data.discussions.find((item) => item.id === discussionId);
  if (!discussion) return null;

  const timeline = discussionTimeline(data, discussionId);
  const sourceIds = new Set(timeline.map((item) => item.source.id));
  const personIds = new Set(
    timeline.map((item) => item.person?.id).filter((id): id is string => Boolean(id)),
  );
  const dated = timeline
    .map((item) => item.publishedAt)
    .filter((date): date is string => Boolean(date))
    .sort((a, b) => a.localeCompare(b));

  return {
    discussion,
    arguments: timeline.length,
    sources: sourceIds.size,
    people: personIds.size,
    firstPublishedAt: dated[0] ?? null,
    lastPublishedAt: dated[dated.length - 1] ?? null,
    undatedArguments: timeline.filter((item) => !item.publishedAt).length,
  };
}

export function discussionSummaries(
  data: ResearchProjectData,
): DiscussionSummary[] {
  return data.discussions
    .map((discussion) => discussionSummary(data, discussion.id))
    .filter((summary): summary is DiscussionSummary => summary !== null);
}


export type DiscussionGraphSummary = {
  discussionId: string;
  nodes: number;
  edges: number;
  connectedNodes: number;
  isolatedNodes: number;
  relationCounts: Record<ArgumentRelationType, number>;
};

export function discussionGraphSummary(
  data: ResearchProjectData,
  discussionId: string,
): DiscussionGraphSummary {
  const nodeIds = new Set(
    data.discussionLinks
      .filter((link) => link.discussionId === discussionId)
      .map((link) => link.argumentId),
  );
  const relations = data.argumentRelations.filter(
    (relation) =>
      relation.discussionId === discussionId &&
      nodeIds.has(relation.fromArgumentId) &&
      nodeIds.has(relation.toArgumentId),
  );
  const connected = new Set<string>();
  const relationCounts: Record<ArgumentRelationType, number> = {
    responds_to: 0,
    supports: 0,
    challenges: 0,
    clarifies: 0,
    extends: 0,
  };

  for (const relation of relations) {
    connected.add(relation.fromArgumentId);
    connected.add(relation.toArgumentId);
    relationCounts[relation.relation] += 1;
  }

  return {
    discussionId,
    nodes: nodeIds.size,
    edges: relations.length,
    connectedNodes: connected.size,
    isolatedNodes: Math.max(0, nodeIds.size - connected.size),
    relationCounts,
  };
}
