export enum Application {
  LogaBeauty = 'LogaBeauty',
  GatherPlux = 'GatherPlux',
  TimeSync = 'TimeSync',
  BookMiz = 'BookMiz',
  DocSend = 'DocSend',
  ProFixer = 'ProFixer',
  // Add more applications as needed
}

export enum UserRole {
  Admin = 'admin',
  Support = 'support',
  User = 'user',
  Approver = 'approver',
  Contractor = 'contractor',
  SubContractor = 'subContractor', // NEW ROLE
  Tester = 'tester', // NEW ROLE
 
}


export enum UserStatus {
  Pending = 'Pending',
  Active = 'Active',
  Suspended = 'Suspended',
  PendingDeletion = 'Pending Deletion',
  Inactive = 'Inactive',
  Deleted = 'Deleted',
}

export enum Permission {
  READ_USERS = 'read_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  
  // Manage Roles
  MANAGE_ROLES = 'manage_roles',

  // Manage Settings
  READ_SETTINGS = 'read_settings',
  EDIT_SETTINGS = 'edit_settings',
  // Add other permissions as needed

  // Contractor-specific permissions
  VIEW_CONTRACTS = 'view_contracts',
  SIGN_CONTRACTS = 'sign_contracts',
  VIEW_RESOURCES = 'view_resources',
}

// New OnboardingStep Enum
export enum OnboardingStep {
  WelcomeEmail = 'WelcomeEmail',
  ProfileSetup = 'ProfileSetup',
  SystemTraining = 'SystemTraining',
  ComplianceTraining = 'ComplianceTraining',
  FirstTask = 'FirstTask',
  // Add other onboarding steps as needed
}

export enum OnlineStatus {
  Online = 'online',
  Offline = 'offline',
  Busy = 'busy',
  Away = 'away',
}


export enum ActivityType {
  Created = 'Created',
  Updated = 'Updated',
  Deleted = 'Deleted',
  Commented = 'Commented',
  Moved = 'Moved',
  // Extend as needed
}

export enum CardStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
}

export enum LabelColor {
  Red = '#FF0000',
  Green = '#00FF00',
  Blue = '#0000FF',
  Yellow = '#FFFF00',
  // Add more colors as needed
}

