
// Enums for Priority, Category, Status
export enum TicketPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    Urgent = 'Urgent',
  }
  
  export enum TicketCategory {
    TechnicalIssue = 'Technical Issue',
    AccessRequest = 'Access Request',
    BugReport = 'Bug Report',
    FeatureRequest = 'Feature Request',
    GeneralInquiry = 'General Inquiry',
  }
  
  export enum TicketStatus {
    Pending = 'Pending',
    InProgress = 'In Progress',
    Resolved = 'Resolved',
    Closed = 'Closed',
    Open = 'Open',
    Critical = 'Critical',
  }