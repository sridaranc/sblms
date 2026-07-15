export const API_BASE_URL = '';

export const LEAD_STATUSES = [
  'New', 'Contacted', 'Follow-Up', 'Interested', 'Meeting Scheduled',
  'Proposal Sent', 'Negotiation', 'Converted', 'Lost', 'Closed'
] as const;

export const LEAD_SOURCES = [
  'Website', 'Referral', 'Social Media', 'Cold Call',
  'Advertisement', 'Email', 'Other'
] as const;

export const FOLLOW_UP_STATUSES = ['Pending', 'Completed', 'Cancelled', 'Rescheduled'] as const;
export const MEETING_STATUSES = ['Scheduled', 'Completed', 'Cancelled'] as const;

export const USER_ROLES = ['SuperAdmin', 'Admin', 'Manager', 'Employee'] as const;
