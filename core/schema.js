// Database schema shared by every storage adapter.
// Each table lists its columns (SQLite types), which columns hold JSON,
// and whether rows belong to a tenant. Column names double as the whitelist
// for query filters, so nothing outside this file can reach the SQL layer.

export const TABLES = {
  tenants: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      name: 'TEXT NOT NULL',
      slug: 'TEXT NOT NULL UNIQUE',
      industry: 'TEXT',
      plan: 'TEXT NOT NULL',            // essentials | professional | premium
      status: 'TEXT NOT NULL',          // active | paused
      program_start: 'TEXT NOT NULL',   // ISO date the 12-month program began
      contact_name: 'TEXT',
      contact_email: 'TEXT',
      settings: 'TEXT',                 // JSON: pass_mark, due_days, departments
      created_at: 'TEXT NOT NULL',
    },
    json: ['settings'],
    tenantScoped: false,
    indexes: [],
  },
  users: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      tenant_id: 'TEXT',                // null for provider (platform) staff
      email: 'TEXT NOT NULL UNIQUE',
      name: 'TEXT NOT NULL',
      password_hash: 'TEXT',
      role: 'TEXT NOT NULL',            // platform_admin | company_admin | manager | employee
      department: 'TEXT',
      job_title: 'TEXT',
      tracks: 'TEXT',                   // JSON array of role-track keys
      hire_date: 'TEXT',
      status: 'TEXT NOT NULL',          // active | inactive
      must_change_password: 'INTEGER',
      last_login: 'TEXT',
      created_at: 'TEXT NOT NULL',
    },
    json: ['tracks'],
    tenantScoped: true,
    indexes: [['tenant_id'], ['email']],
  },
  courses: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      tenant_id: 'TEXT',                // null = provider catalog shared by all clients
      code: 'TEXT NOT NULL',
      title: 'TEXT NOT NULL',
      category: 'TEXT NOT NULL',        // core | refresher | onboarding | role
      track: 'TEXT',
      summary: 'TEXT',
      duration_min: 'INTEGER',
      schedule: 'TEXT',                 // JSON: {months:[..]} | {onboarding:true}
      min_plan: 'TEXT',
      lessons: 'TEXT',                  // JSON array
      quiz: 'TEXT',                     // JSON array
      pass_mark: 'INTEGER',
      version: 'INTEGER',
      active: 'INTEGER',
      sort: 'INTEGER',
      created_at: 'TEXT NOT NULL',
    },
    json: ['schedule', 'lessons', 'quiz'],
    tenantScoped: true,
    indexes: [['tenant_id'], ['code']],
  },
  assignments: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      tenant_id: 'TEXT NOT NULL',
      user_id: 'TEXT NOT NULL',
      course_id: 'TEXT NOT NULL',
      cycle: 'INTEGER NOT NULL',        // program year (1, 2, ...); 0 = onboarding
      source: 'TEXT NOT NULL',          // schedule | onboarding | manual
      released_at: 'TEXT NOT NULL',
      due_at: 'TEXT NOT NULL',
      status: 'TEXT NOT NULL',          // assigned | in_progress | completed
      started_at: 'TEXT',
      completed_at: 'TEXT',
      score: 'INTEGER',
      attempts: 'INTEGER NOT NULL',
    },
    json: [],
    tenantScoped: true,
    indexes: [['tenant_id'], ['user_id'], ['tenant_id', 'course_id']],
  },
  quiz_attempts: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      tenant_id: 'TEXT NOT NULL',
      user_id: 'TEXT NOT NULL',
      assignment_id: 'TEXT NOT NULL',
      course_id: 'TEXT NOT NULL',
      score: 'INTEGER NOT NULL',
      passed: 'INTEGER NOT NULL',
      answers: 'TEXT',
      created_at: 'TEXT NOT NULL',
    },
    json: ['answers'],
    tenantScoped: true,
    indexes: [['tenant_id'], ['user_id'], ['assignment_id']],
  },
  phishing_campaigns: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      tenant_id: 'TEXT NOT NULL',
      name: 'TEXT NOT NULL',
      template: 'TEXT',
      channel: 'TEXT NOT NULL',         // email | sms | voice | qr
      difficulty: 'TEXT NOT NULL',      // easy | medium | hard
      sent_at: 'TEXT NOT NULL',
      status: 'TEXT NOT NULL',          // scheduled | running | closed
      created_at: 'TEXT NOT NULL',
    },
    json: [],
    tenantScoped: true,
    indexes: [['tenant_id']],
  },
  phishing_results: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      tenant_id: 'TEXT NOT NULL',
      campaign_id: 'TEXT NOT NULL',
      user_id: 'TEXT NOT NULL',
      outcome: 'TEXT NOT NULL',         // pending | ignored | clicked | submitted | reported
      event_at: 'TEXT',
    },
    json: [],
    tenantScoped: true,
    indexes: [['tenant_id'], ['campaign_id'], ['user_id']],
  },
  audit_log: {
    columns: {
      id: 'TEXT PRIMARY KEY',
      tenant_id: 'TEXT',
      actor_id: 'TEXT',
      actor_name: 'TEXT',
      action: 'TEXT NOT NULL',
      detail: 'TEXT',
      created_at: 'TEXT NOT NULL',
    },
    json: [],
    tenantScoped: true,
    indexes: [['tenant_id', 'created_at']],
  },
};

export const ROLES = ['platform_admin', 'company_admin', 'manager', 'employee'];
export const PLANS = ['essentials', 'professional', 'premium'];
export const PLAN_RANK = { essentials: 1, professional: 2, premium: 3 };
export const TRACKS = {
  leadership: 'Leadership & owners',
  it: 'IT & system admins',
  finance: 'Finance & accounting',
  hr: 'HR & recruiting',
  remote: 'Remote & field staff',
  customer: 'Customer-facing staff',
};
export const OUTCOMES = ['pending', 'ignored', 'clicked', 'submitted', 'reported'];
