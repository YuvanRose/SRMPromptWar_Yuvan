-- ============================================================
-- FairShift Database Schema — Supabase Migration
-- Run this in the Supabase SQL Editor or as a migration file.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sector TEXT NOT NULL CHECK (sector IN ('construction', 'college')),
  overtime_daily_hours NUMERIC(4,1) NOT NULL DEFAULT 8,
  overtime_weekly_hours NUMERIC(4,1) NOT NULL DEFAULT 45,
  overtime_multiplier NUMERIC(3,1) NOT NULL DEFAULT 1.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SITES (construction sites, departments, etc.)
-- ============================================================
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sites_org ON sites(org_id);

-- ============================================================
-- PROFILES (linked to Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('worker', 'employer')),
  language TEXT NOT NULL DEFAULT 'en',
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_org ON profiles(org_id);
CREATE INDEX idx_profiles_site ON profiles(site_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- SHIFTS (scheduled shifts)
-- ============================================================
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  pattern_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(worker_id, shift_date)
);

CREATE INDEX idx_shifts_worker_date ON shifts(worker_id, shift_date);
CREATE INDEX idx_shifts_org ON shifts(org_id);
CREATE INDEX idx_shifts_site ON shifts(site_id);

-- ============================================================
-- CHECK-INS (with offline-first client_uuid for idempotency)
-- ============================================================
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_uuid UUID NOT NULL UNIQUE, -- idempotency key from client
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN ('in', 'out')),
  method TEXT NOT NULL CHECK (method IN ('qr', 'location', 'manual')),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  device_time TIMESTAMPTZ NOT NULL, -- time on the worker's device
  server_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  manual_reason TEXT,
  manual_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkins_worker ON checkins(worker_id, device_time);
CREATE INDEX idx_checkins_org ON checkins(org_id);
CREATE INDEX idx_checkins_client ON checkins(client_uuid);

-- ============================================================
-- PAYSLIPS
-- ============================================================
CREATE TABLE payslips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  lines JSONB NOT NULL, -- array of { key, label, amount, type: 'earning'|'deduction', explanation }
  net_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(worker_id, period_start, period_end)
);

CREATE INDEX idx_payslips_worker ON payslips(worker_id);
CREATE INDEX idx_payslips_org ON payslips(org_id);

-- ============================================================
-- HAZARD REPORTS
-- ============================================================
CREATE TABLE hazard_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_uuid UUID NOT NULL UNIQUE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  hazard_type TEXT NOT NULL,
  description TEXT NOT NULL,
  audio_url TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in_review', 'in_progress', 'fixed', 'dismissed')),
  assignee_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hazards_org ON hazard_reports(org_id);
CREATE INDEX idx_hazards_reporter ON hazard_reports(reporter_id);
CREATE INDEX idx_hazards_status ON hazard_reports(status);

-- ============================================================
-- REPORT EVENTS (status history + employer replies)
-- ============================================================
CREATE TABLE report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES hazard_reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('status_change', 'reply', 'assignment')),
  from_status TEXT,
  to_status TEXT,
  reply_text TEXT,
  actor_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_report ON report_events(report_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Organizations: everyone in the org can read
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own org"
  ON organizations FOR SELECT
  USING (id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Sites: everyone in the org can read
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read sites in their org"
  ON sites FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Profiles: workers see own profile, employers see org profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Employers read org profiles"
  ON profiles FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid() AND role = 'employer'
    )
  );

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Shifts: workers see own, employers see org
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers read own shifts"
  ON shifts FOR SELECT
  USING (worker_id = auth.uid());

CREATE POLICY "Employers read org shifts"
  ON shifts FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid() AND role = 'employer'
    )
  );

-- Checkins: workers insert own, read own; employers read org
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers insert own checkins"
  ON checkins FOR INSERT
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Workers read own checkins"
  ON checkins FOR SELECT
  USING (worker_id = auth.uid());

CREATE POLICY "Employers read org checkins"
  ON checkins FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid() AND role = 'employer'
    )
  );

CREATE POLICY "Employers update org checkins"
  ON checkins FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid() AND role = 'employer'
    )
  );

-- Payslips: workers read own; employers read org
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers read own payslips"
  ON payslips FOR SELECT
  USING (worker_id = auth.uid());

CREATE POLICY "Employers read org payslips"
  ON payslips FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid() AND role = 'employer'
    )
  );

-- Hazard reports: workers insert own, read own; employers read/update org
ALTER TABLE hazard_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers insert own reports"
  ON hazard_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Workers read own reports"
  ON hazard_reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Employers read org reports"
  ON hazard_reports FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid() AND role = 'employer'
    )
  );

CREATE POLICY "Employers update org reports"
  ON hazard_reports FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid() AND role = 'employer'
    )
  );

-- Report events: workers read on own reports; employers read/insert on org reports
ALTER TABLE report_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers read events on own reports"
  ON report_events FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM hazard_reports WHERE reporter_id = auth.uid()
    )
  );

CREATE POLICY "Employers read events on org reports"
  ON report_events FOR SELECT
  USING (
    report_id IN (
      SELECT hr.id FROM hazard_reports hr
      JOIN profiles p ON p.id = auth.uid()
      WHERE hr.org_id = p.org_id AND p.role = 'employer'
    )
  );

CREATE POLICY "Employers insert events on org reports"
  ON report_events FOR INSERT
  WITH CHECK (
    report_id IN (
      SELECT hr.id FROM hazard_reports hr
      JOIN profiles p ON p.id = auth.uid()
      WHERE hr.org_id = p.org_id AND p.role = 'employer'
    )
  );

-- ============================================================
-- GRANT access to anon and authenticated roles
-- (required for new Supabase projects)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
