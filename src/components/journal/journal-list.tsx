"use client";

import { JournalCard } from "./journal-card";
import type { Journal } from "./hooks";

interface JournalListProps {
  journals: Journal[];
  onSelect: (journal: Journal) => void;
}

export function JournalList({ journals, onSelect }: JournalListProps) {
  if (journals.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          저널이 없습니다. 새 저널을 작성해보세요.
        </p>
      </div>
    );
  }

  // Sort: pinned first, then by date desc
  const sorted = [...journals].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-2">
      {sorted.map((journal) => (
        <JournalCard
          key={journal.id}
          journal={journal}
          onClick={() => onSelect(journal)}
        />
      ))}
    </div>
  );
}
