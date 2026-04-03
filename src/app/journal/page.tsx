"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JournalSearchBar } from "@/components/journal/journal-search-bar";
import { JournalList } from "@/components/journal/journal-list";
import { JournalDetailModal } from "@/components/journal/journal-detail-modal";
import { JournalEditModal } from "@/components/journal/journal-edit-modal";
import { useJournals, type Journal, type JournalFilters } from "@/components/journal/hooks";

export default function JournalPage() {
  const [filters, setFilters] = useState<JournalFilters>({});
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);

  const { data } = useJournals(filters);
  const journals = data?.data ?? [];

  const handleSelect = (journal: Journal) => {
    setSelectedJournal(journal);
    setDetailOpen(true);
  };

  const handleEdit = (journal: Journal) => {
    setDetailOpen(false);
    setEditingJournal(journal);
    setEditOpen(true);
  };

  const handleCreate = () => {
    setEditingJournal(null);
    setEditOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">투자 저널</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          새 저널
        </Button>
      </div>

      <JournalSearchBar filters={filters} onFilterChange={setFilters} />
      <JournalList journals={journals} onSelect={handleSelect} />

      <JournalDetailModal
        journal={selectedJournal}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
      />

      <JournalEditModal
        journal={editingJournal}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
