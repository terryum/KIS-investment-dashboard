-- Login history for security tracking
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  user_agent TEXT,
  device_summary TEXT,     -- 'Chrome on macOS', 'Safari on iPhone' etc.
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_login_history_created ON login_history (created_at DESC);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON login_history FOR ALL USING (false);
