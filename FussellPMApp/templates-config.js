// PMBOK Template Definitions
// Field types: 'text', 'textarea', 'list', 'table'
// table columns: { id, label, type: 'text'|'textarea'|'select', options: [...] }

const t = (id, label, opts = {}) => ({ id, label, type: 'text', ...opts });
const ta = (id, label, opts = {}) => ({ id, label, type: 'textarea', rows: 3, ...opts });
const ls = (id, label, opts = {}) => ({ id, label, type: 'list', ...opts });
const tb = (id, label, columns) => ({ id, label, type: 'table', columns });
const sel = (id, label, options) => ({ id, label, type: 'select', options });

// ---------- PREDICTIVE TEMPLATES ----------

const projectCharter = {
    id: 'project-charter',
    name: 'Project Charter',
    icon: '📜',
    description: 'Authorizes the project, defines purpose, objectives, and high-level scope',
    types: ['predictive', 'hybrid'],
    sections: [
        { id: 'overview', title: 'Project Overview', fields: [
            ta('purpose', 'Project Purpose / Justification', { rows: 3, hint: 'Why is this project being undertaken?' }),
            ta('description', 'High-Level Description', { rows: 4 }),
            t('sponsor', 'Project Sponsor'),
            t('manager', 'Project Manager'),
            t('startDate', 'Target Start Date'),
            t('endDate', 'Target End Date')
        ]},
        { id: 'objectives', title: 'Objectives & Success Criteria', fields: [
            ta('businessCase', 'Business Case', { rows: 3 }),
            ls('objectives', 'Project Objectives', { itemPlaceholder: 'e.g., Deliver X by Q3' }),
            ls('successCriteria', 'Success Criteria', { itemPlaceholder: 'Measurable criteria for success' })
        ]},
        { id: 'scope', title: 'High-Level Scope', fields: [
            ls('requirements', 'High-Level Requirements'),
            ls('deliverables', 'Key Deliverables'),
            ta('exclusions', 'Out of Scope / Exclusions', { rows: 3 })
        ]},
        { id: 'constraints', title: 'Assumptions & Constraints', fields: [
            ls('assumptions', 'Assumptions'),
            ls('constraints', 'Constraints')
        ]},
        { id: 'risks', title: 'High-Level Risks', fields: [
            ls('risks', 'Identified High-Level Risks')
        ]},
        { id: 'milestones', title: 'High-Level Milestones', fields: [
            tb('milestones', 'Milestones', [
                t('name', 'Milestone'),
                t('targetDate', 'Target Date'),
                ta('description', 'Description')
            ])
        ]},
        { id: 'budget', title: 'Budget', fields: [
            t('estimatedBudget', 'Estimated Budget'),
            t('fundingSource', 'Funding Source')
        ]},
        { id: 'approvals', title: 'Approvals', fields: [
            tb('approvers', 'Approvers', [
                t('name', 'Name'),
                t('role', 'Role'),
                t('signature', 'Signature / Date')
            ])
        ]}
    ]
};

const stakeholderRegister = {
    id: 'stakeholder-register',
    name: 'Stakeholder Register',
    icon: '👥',
    description: 'Identifies all stakeholders and their interests, influence, and engagement',
    types: ['predictive', 'hybrid'],
    sections: [
        { id: 'stakeholders', title: 'Stakeholders', fields: [
            tb('stakeholders', 'Stakeholders', [
                t('name', 'Name'),
                t('role', 'Role / Title'),
                t('organization', 'Organization'),
                sel('influence', 'Influence', ['Low', 'Medium', 'High']),
                sel('interest', 'Interest', ['Low', 'Medium', 'High']),
                ta('expectations', 'Expectations / Concerns'),
                ta('strategy', 'Engagement Strategy')
            ])
        ]}
    ]
};

const scopeStatement = {
    id: 'scope-statement',
    name: 'Scope Statement',
    icon: '🎯',
    description: 'Detailed product and project scope, deliverables, and acceptance criteria',
    types: ['predictive'],
    sections: [
        { id: 'product', title: 'Product Scope', fields: [
            ta('productScope', 'Product Scope Description', { rows: 5 }),
            ta('acceptanceCriteria', 'Acceptance Criteria', { rows: 4 })
        ]},
        { id: 'project', title: 'Project Scope', fields: [
            ta('projectScope', 'Project Scope Description', { rows: 5 }),
            ls('deliverables', 'Deliverables'),
            ls('exclusions', 'Exclusions'),
            ls('constraints', 'Constraints'),
            ls('assumptions', 'Assumptions')
        ]}
    ]
};

const wbs = {
    id: 'wbs',
    name: 'Work Breakdown Structure (WBS)',
    icon: '🗂️',
    description: 'Hierarchical decomposition of the total scope of work',
    types: ['predictive'],
    sections: [
        { id: 'wbs', title: 'WBS Items', fields: [
            tb('items', 'Work Packages', [
                t('code', 'WBS Code', { hint: 'e.g., 1.1.2' }),
                t('name', 'Name'),
                ta('description', 'Description'),
                t('owner', 'Owner'),
                t('parentCode', 'Parent Code')
            ])
        ]}
    ]
};

const schedule = {
    id: 'schedule',
    name: 'Schedule & Milestones',
    icon: '📅',
    description: 'Project timeline, milestones, and key dates',
    types: ['predictive'],
    sections: [
        { id: 'milestones', title: 'Milestones', fields: [
            tb('milestones', 'Milestones', [
                t('name', 'Milestone'),
                t('targetDate', 'Target Date'),
                t('actualDate', 'Actual Date'),
                sel('status', 'Status', ['Not Started', 'In Progress', 'Complete', 'Delayed']),
                ta('deliverables', 'Deliverables'),
                ta('notes', 'Notes')
            ])
        ]},
        { id: 'criticalPath', title: 'Critical Path Notes', fields: [
            ta('notes', 'Critical Path / Dependencies', { rows: 5 })
        ]}
    ]
};

const riskRegister = {
    id: 'risk-register',
    name: 'Risk Register',
    icon: '⚠️',
    description: 'Identifies, analyzes, and tracks responses to project risks',
    types: ['predictive', 'hybrid'],
    sections: [
        { id: 'risks', title: 'Risks', fields: [
            tb('risks', 'Risks', [
                t('id', 'ID'),
                ta('description', 'Risk Description'),
                sel('category', 'Category', ['Technical', 'External', 'Organizational', 'Project Management', 'Other']),
                sel('probability', 'Probability', ['Low', 'Medium', 'High']),
                sel('impact', 'Impact', ['Low', 'Medium', 'High']),
                sel('strategy', 'Response Strategy', ['Avoid', 'Mitigate', 'Transfer', 'Accept', 'Escalate']),
                ta('response', 'Response Plan'),
                t('owner', 'Owner'),
                sel('status', 'Status', ['Identified', 'Active', 'Mitigated', 'Closed'])
            ])
        ]}
    ]
};

const communicationsPlan = {
    id: 'communications-plan',
    name: 'Communications Plan',
    icon: '📡',
    description: 'How information will be distributed throughout the project',
    types: ['predictive', 'hybrid'],
    sections: [
        { id: 'comms', title: 'Communications Matrix', fields: [
            tb('comms', 'Communications', [
                t('infoType', 'Information / Report'),
                t('audience', 'Audience'),
                t('frequency', 'Frequency'),
                sel('format', 'Format', ['Email', 'Meeting', 'Report', 'Dashboard', 'Other']),
                t('owner', 'Owner'),
                ta('purpose', 'Purpose')
            ])
        ]}
    ]
};

const changeLog = {
    id: 'change-log',
    name: 'Change Log',
    icon: '🔄',
    description: 'Tracks all change requests and decisions',
    types: ['predictive', 'hybrid'],
    sections: [
        { id: 'changes', title: 'Change Requests', fields: [
            tb('changes', 'Changes', [
                t('id', 'ID'),
                t('date', 'Date'),
                t('requestedBy', 'Requested By'),
                ta('description', 'Description'),
                ta('impact', 'Impact (Scope/Schedule/Cost)'),
                sel('status', 'Status', ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Implemented']),
                t('decidedBy', 'Decided By'),
                ta('decision', 'Decision Notes')
            ])
        ]}
    ]
};

const lessonsLearned = {
    id: 'lessons-learned',
    name: 'Lessons Learned',
    icon: '🎓',
    description: 'Captures successes, challenges, and improvements for future projects',
    types: ['predictive', 'hybrid', 'agile'],
    sections: [
        { id: 'summary', title: 'Summary', fields: [
            ls('successes', 'What Went Well'),
            ls('challenges', 'Challenges Faced'),
            ls('improvements', 'Recommendations for Improvement')
        ]},
        { id: 'detail', title: 'Detailed Lessons', fields: [
            tb('lessons', 'Lessons', [
                sel('area', 'Area', ['Scope', 'Schedule', 'Cost', 'Quality', 'Risk', 'Communications', 'Team', 'Stakeholders', 'Other']),
                ta('whatHappened', 'What Happened'),
                ta('lesson', 'Lesson Learned'),
                ta('recommendation', 'Recommendation')
            ])
        ]}
    ]
};

// ---------- AGILE TEMPLATES ----------

const productVision = {
    id: 'product-vision',
    name: 'Product Vision',
    icon: '🌟',
    description: 'Geoffrey Moore-style elevator pitch for the product',
    types: ['agile', 'hybrid'],
    sections: [
        { id: 'vision', title: 'Vision Statement', fields: [
            t('forCustomer', 'FOR (target customer)'),
            ta('whoNeed', 'WHO (statement of need or opportunity)', { rows: 2 }),
            t('productName', 'THE (product name)'),
            t('category', 'IS A (product category)'),
            ta('keyBenefit', 'THAT (key benefit, compelling reason to buy)', { rows: 2 }),
            ta('competitor', 'UNLIKE (primary competitive alternative)', { rows: 2 }),
            ta('differentiator', 'OUR PRODUCT (statement of primary differentiation)', { rows: 2 })
        ]},
        { id: 'context', title: 'Vision Context', fields: [
            ta('problemStatement', 'Problem Statement', { rows: 3 }),
            ls('successMetrics', 'Success Metrics'),
            ls('assumptions', 'Key Assumptions')
        ]}
    ]
};

const teamCharter = {
    id: 'team-charter',
    name: 'Team Charter',
    icon: '🤝',
    description: 'Defines team purpose, roles, working agreements, and norms',
    types: ['agile', 'hybrid', 'predictive'],
    sections: [
        { id: 'purpose', title: 'Team Purpose', fields: [
            ta('purpose', 'Team Purpose / Mission', { rows: 3 }),
            ls('goals', 'Team Goals')
        ]},
        { id: 'roles', title: 'Members & Roles', fields: [
            tb('members', 'Members', [
                t('name', 'Name'),
                t('role', 'Role'),
                ta('responsibilities', 'Responsibilities'),
                t('contact', 'Contact')
            ])
        ]},
        { id: 'agreements', title: 'Working Agreements', fields: [
            ls('workingAgreements', 'Working Agreements', { itemPlaceholder: 'e.g., Stand-up at 9am daily' }),
            ls('communicationNorms', 'Communication Norms'),
            ta('decisionMaking', 'Decision-Making Process', { rows: 3 }),
            ta('conflictResolution', 'Conflict Resolution', { rows: 3 })
        ]}
    ]
};

const productBacklog = {
    id: 'product-backlog',
    name: 'Product Backlog',
    icon: '📋',
    description: 'Prioritized list of features, stories, and work items',
    types: ['agile', 'hybrid'],
    sections: [
        { id: 'backlog', title: 'Backlog Items', fields: [
            tb('items', 'Backlog Items', [
                t('id', 'ID'),
                t('title', 'Title'),
                ta('description', 'Description / User Story'),
                sel('type', 'Type', ['Story', 'Bug', 'Spike', 'Task', 'Epic']),
                sel('priority', 'Priority', ['Must Have', 'Should Have', 'Could Have', 'Won\'t Have']),
                t('points', 'Story Points'),
                sel('status', 'Status', ['New', 'Ready', 'In Progress', 'In Review', 'Done']),
                ta('acceptance', 'Acceptance Criteria')
            ])
        ]}
    ]
};

const sprintBacklog = {
    id: 'sprint-backlog',
    name: 'Sprint / Iteration Backlogs',
    icon: '🏃',
    description: 'Tracks sprints/iterations and their goals and outcomes',
    types: ['agile', 'hybrid'],
    sections: [
        { id: 'sprints', title: 'Sprints', fields: [
            tb('sprints', 'Sprints', [
                t('number', 'Sprint #'),
                t('startDate', 'Start Date'),
                t('endDate', 'End Date'),
                ta('goal', 'Sprint Goal'),
                t('committedPoints', 'Committed Points'),
                t('completedPoints', 'Completed Points'),
                sel('status', 'Status', ['Planned', 'Active', 'Complete']),
                ta('notes', 'Notes / Outcome')
            ])
        ]}
    ]
};

const definitionOfDone = {
    id: 'definition-of-done',
    name: 'Definition of Done',
    icon: '✅',
    description: 'Shared understanding of when work is complete',
    types: ['agile', 'hybrid'],
    sections: [
        { id: 'criteria', title: 'Done Criteria', fields: [
            ls('criteria', 'General Criteria', { itemPlaceholder: 'e.g., Code reviewed and merged' }),
            ls('quality', 'Quality Standards'),
            ls('testing', 'Testing Requirements'),
            ls('documentation', 'Documentation Requirements')
        ]}
    ]
};

const retrospectives = {
    id: 'retrospectives',
    name: 'Retrospectives',
    icon: '🔁',
    description: 'Sprint retrospective notes and action items',
    types: ['agile', 'hybrid'],
    sections: [
        { id: 'retros', title: 'Retrospectives', fields: [
            tb('retros', 'Retrospectives', [
                t('sprint', 'Sprint #'),
                t('date', 'Date'),
                ta('wentWell', 'What Went Well'),
                ta('didntGoWell', 'What Didn\'t Go Well'),
                ta('actionItems', 'Action Items'),
                t('owner', 'Action Owner')
            ])
        ]}
    ]
};

const impedimentLog = {
    id: 'impediment-log',
    name: 'Risk / Impediment Log',
    icon: '🚧',
    description: 'Tracks blockers and risks impacting team velocity',
    types: ['agile'],
    sections: [
        { id: 'impediments', title: 'Impediments & Risks', fields: [
            tb('items', 'Items', [
                t('id', 'ID'),
                sel('type', 'Type', ['Impediment', 'Risk']),
                ta('description', 'Description'),
                t('raisedBy', 'Raised By'),
                t('raisedDate', 'Raised Date'),
                sel('severity', 'Severity', ['Low', 'Medium', 'High', 'Critical']),
                t('owner', 'Owner'),
                sel('status', 'Status', ['Open', 'In Progress', 'Resolved', 'Escalated']),
                ta('resolution', 'Resolution')
            ])
        ]}
    ]
};

// ---------- HYBRID-SPECIFIC TEMPLATES ----------

const roadmap = {
    id: 'roadmap',
    name: 'Roadmap',
    icon: '🗺️',
    description: 'High-level timeline of themes, objectives, and deliverables',
    types: ['hybrid', 'agile'],
    sections: [
        { id: 'roadmap', title: 'Roadmap Items', fields: [
            tb('items', 'Roadmap', [
                t('period', 'Period (Q1, Q2, etc.)'),
                t('theme', 'Theme'),
                ta('objectives', 'Objectives'),
                ta('deliverables', 'Key Deliverables'),
                sel('status', 'Status', ['Planned', 'In Progress', 'Complete', 'Deferred'])
            ])
        ]}
    ]
};

// ---------- TYPE -> TEMPLATE MAPPING ----------

const ALL_TEMPLATES = [
    projectCharter,
    stakeholderRegister,
    scopeStatement,
    wbs,
    schedule,
    riskRegister,
    communicationsPlan,
    changeLog,
    lessonsLearned,
    productVision,
    teamCharter,
    productBacklog,
    sprintBacklog,
    definitionOfDone,
    retrospectives,
    impedimentLog,
    roadmap
];

export const PROJECT_TYPES = {
    predictive: {
        id: 'predictive',
        name: 'Predictive (Waterfall)',
        description: 'Plan-driven approach with detailed upfront planning. Best for projects with well-understood requirements and stable scope.',
        icon: '📐'
    },
    hybrid: {
        id: 'hybrid',
        name: 'Hybrid',
        description: 'Combines predictive planning with agile execution. Best for projects with some stable requirements and evolving aspects.',
        icon: '⚖️'
    },
    agile: {
        id: 'agile',
        name: 'Agile',
        description: 'Iterative, adaptive approach. Best for projects with evolving requirements and the need for rapid feedback.',
        icon: '🌀'
    }
};

export function getTemplatesForType(type) {
    return ALL_TEMPLATES.filter(t => t.types.includes(type));
}

export function getTemplate(id) {
    return ALL_TEMPLATES.find(t => t.id === id);
}

export default ALL_TEMPLATES;
