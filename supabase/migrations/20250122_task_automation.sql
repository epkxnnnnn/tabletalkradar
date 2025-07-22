-- Task Automation Table
-- Stores AI-generated prioritized tasks with automation capabilities

CREATE TABLE IF NOT EXISTS task_automation (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Task Details
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('critical', 'high_impact', 'strategic', 'long_term')),
    
    -- Prioritization Scores
    priority_score INTEGER NOT NULL CHECK (priority_score >= 0 AND priority_score <= 100),
    impact_score INTEGER NOT NULL CHECK (impact_score >= 1 AND impact_score <= 10),
    
    -- Task Characteristics
    complexity VARCHAR(20) NOT NULL CHECK (complexity IN ('low', 'medium', 'high')),
    timeline VARCHAR(100) NOT NULL,
    resource_requirements TEXT NOT NULL,
    
    -- Automation Properties
    automation_possible BOOLEAN NOT NULL DEFAULT false,
    requires_human_decision BOOLEAN NOT NULL DEFAULT true,
    
    -- Task Management
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'automated')),
    dependencies TEXT[] DEFAULT '{}',
    success_metrics TEXT[] DEFAULT '{}',
    
    -- Assignment and Scheduling
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_to VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_task_automation_agency_id ON task_automation(agency_id);
CREATE INDEX idx_task_automation_client_id ON task_automation(client_id);
CREATE INDEX idx_task_automation_category ON task_automation(category);
CREATE INDEX idx_task_automation_status ON task_automation(status);
CREATE INDEX idx_task_automation_priority_score ON task_automation(priority_score DESC);
CREATE INDEX idx_task_automation_due_date ON task_automation(due_date);
CREATE INDEX idx_task_automation_created_at ON task_automation(created_at DESC);

-- Enable Row Level Security
ALTER TABLE task_automation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_automation

-- Agency members can view tasks for their agency
CREATE POLICY "Agency members can view tasks" ON task_automation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agency_memberships am 
            WHERE am.agency_id = task_automation.agency_id 
            AND am.user_id = auth.uid()
            AND am.status = 'active'
        )
    );

-- Agency owners and managers can insert tasks
CREATE POLICY "Agency owners and managers can insert tasks" ON task_automation
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM agency_memberships am 
            WHERE am.agency_id = task_automation.agency_id 
            AND am.user_id = auth.uid()
            AND am.role IN ('owner', 'manager')
            AND am.status = 'active'
        )
    );

-- Agency owners and managers can update tasks
CREATE POLICY "Agency owners and managers can update tasks" ON task_automation
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM agency_memberships am 
            WHERE am.agency_id = task_automation.agency_id 
            AND am.user_id = auth.uid()
            AND am.role IN ('owner', 'manager')
            AND am.status = 'active'
        )
    );

-- Team members can update task status (but not other fields)
CREATE POLICY "Team members can update task status" ON task_automation
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM agency_memberships am 
            WHERE am.agency_id = task_automation.agency_id 
            AND am.user_id = auth.uid()
            AND am.role IN ('owner', 'manager', 'analyst', 'specialist')
            AND am.status = 'active'
        )
    );

-- Agency owners can delete tasks
CREATE POLICY "Agency owners can delete tasks" ON task_automation
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM agency_memberships am 
            WHERE am.agency_id = task_automation.agency_id 
            AND am.user_id = auth.uid()
            AND am.role = 'owner'
            AND am.status = 'active'
        )
    );

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_automation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_automation_updated_at
    BEFORE UPDATE ON task_automation
    FOR EACH ROW
    EXECUTE FUNCTION update_task_automation_updated_at();

-- Add helpful comments
COMMENT ON TABLE task_automation IS 'AI-generated prioritized tasks with automation capabilities for agency client management';
COMMENT ON COLUMN task_automation.category IS 'Task urgency category: critical (0-24h), high_impact (1-7d), strategic (1-30d), long_term (30d+)';
COMMENT ON COLUMN task_automation.priority_score IS 'AI-calculated priority score from 0-100 based on impact, urgency, and resources';
COMMENT ON COLUMN task_automation.impact_score IS 'Business impact score from 1-10 rating expected business value';
COMMENT ON COLUMN task_automation.automation_possible IS 'Whether this task can be fully or partially automated';
COMMENT ON COLUMN task_automation.requires_human_decision IS 'Whether human judgment is required for task execution';
COMMENT ON COLUMN task_automation.dependencies IS 'Array of prerequisite conditions or tasks that must be completed first';
COMMENT ON COLUMN task_automation.success_metrics IS 'Array of measurable outcomes that define task completion success';