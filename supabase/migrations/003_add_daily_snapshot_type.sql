-- Add 'daily' to snapshot_type enum for auto-captured daily snapshots
ALTER TYPE snapshot_type ADD VALUE IF NOT EXISTS 'daily';
