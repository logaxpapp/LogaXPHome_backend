// src/types/employmentReference.ts




export interface IEmploymentReferenceFormData {
    refereeId?: string;
    refereeDetails?: {
      name: string;
      email: string;
      companyName: string;
      relationship: string;
      dateStarted: string; // Should align with ICreateReferenceData
      address: string;
      positionHeld: string;
    };
    relationship: string;
    positionHeld: string;
    startDate: string;
    endDate: string;
    reasonForLeaving: string;
    salary: string;
    performance: string;
    conduct: string;
    integrity: string;
    additionalComments?: string;
    signature: string;
  }
  