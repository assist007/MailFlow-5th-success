
export enum UserRole {
  OWNER = 'owner',
  USER = 'user'
}

export enum EmailFolder {
  INBOX = 'inbox',
  SENT = 'sent',
  STARRED = 'starred',
  TRASH = 'trash'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Email {
  id: string;
  from_address: string;
  to_address: string;
  subject: string;
  body_html: string;
  body_text: string;
  is_read: boolean;
  is_starred: boolean;
  folder: EmailFolder;
  thread_id: string;
  user_id: string;
  domain_id: string;
  created_at: string;
  attachments?: EmailAttachment[];
}

export interface EmailDomain {
  id: string;
  owner_id: string;
  domain: string;
  is_verified: boolean;
  mx_record: string;
  txt_record: string;
  webhook_secret: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
  address_count: number;
  address_limit: number;
}

export interface EmailAddress {
  id: string;
  local_part: string;
  domain_id: string;
  user_id: string;
  is_catch_all: boolean;
  is_active: boolean;
  is_deleted: boolean; // Hard delete flag: when true, future inbound emails are rejected
  created_at: string;
}

export interface EmailAttachment {
  id: string;
  email_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
}

export interface Thread {
  id: string;
  subject: string;
  latest_message: Email;
  unread_count: number;
  total_messages: number;
}
