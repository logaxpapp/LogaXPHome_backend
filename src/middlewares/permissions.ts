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
    // Add roles as needed
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
    // Add more permissions as needed
  }
  