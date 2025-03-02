-- Service Metrics table
CREATE TABLE IF NOT EXISTS service_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service TEXT NOT NULL,
  operation TEXT NOT NULL,
  duration INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Error Logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service TEXT NOT NULL,
  error TEXT NOT NULL,
  stack TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_metrics_service ON service_metrics(service);
CREATE INDEX IF NOT EXISTS idx_service_metrics_timestamp ON service_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_service ON error_logs(service);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);

-- RLS Policies
ALTER TABLE service_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to service metrics"
  ON service_metrics FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access to error logs"
  ON error_logs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow insert access to the monitoring service
CREATE POLICY "Allow insert to service metrics"
  ON service_metrics FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow insert to error logs"
  ON error_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role'); 