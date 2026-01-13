
import { User, UserRole, Email, EmailFolder, EmailDomain, EmailAddress } from '../types';

export const mockCurrentUser: User = {
  id: 'user_1',
  email: 'john@example.com',
  role: UserRole.OWNER, // Changed from USER to OWNER
  created_at: new Date().toISOString()
};

export const mockOwnerUser: User = {
  id: 'owner_1',
  email: 'admin@mycompany.com',
  role: UserRole.OWNER,
  created_at: new Date().toISOString()
};

export const mockDomains: EmailDomain[] = [
  {
    id: 'dom_1',
    owner_id: 'owner_1',
    domain: 'mycompany.com',
    is_verified: true,
    mx_record: 'mx.brevo.com',
    txt_record: 'brevo-code-123',
    webhook_secret: 'sec_xyz123',
    is_active: true,
    created_at: new Date().toISOString(),
    user_count: 5,
    address_count: 12,
    address_limit: 50
  }
];

export const mockAddresses: EmailAddress[] = [
  {
    id: 'addr_1',
    local_part: 'john',
    domain_id: 'dom_1',
    user_id: 'user_1',
    is_catch_all: false,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

export const mockEmails: Email[] = [
  {
    id: 'msg_1',
    from_address: 'hr@partner.com',
    to_address: 'john@mycompany.com',
    subject: 'Interview Schedule for Q3',
    body_html: '<p>Hello John, we would like to schedule an interview.</p>',
    body_text: 'Hello John, we would like to schedule an interview.',
    is_read: false,
    is_starred: false,
    folder: EmailFolder.INBOX,
    thread_id: 'thread_1',
    user_id: 'user_1',
    domain_id: 'dom_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    attachments: []
  },
  {
    id: 'msg_2',
    from_address: 'support@service.com',
    to_address: 'john@mycompany.com',
    subject: 'Your Ticket #4521',
    body_html: '<p>Your ticket has been resolved. Thank you for using our service.</p>',
    body_text: 'Your ticket has been resolved. Thank you for using our service.',
    is_read: true,
    is_starred: true,
    folder: EmailFolder.INBOX,
    thread_id: 'thread_2',
    user_id: 'user_1',
    domain_id: 'dom_1',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    attachments: []
  },
  {
    id: 'msg_3',
    from_address: 'john@mycompany.com',
    to_address: 'hr@partner.com',
    subject: 'Re: Interview Schedule for Q3',
    body_html: '<p>Sounds great! I am free on Monday.</p>',
    body_text: 'Sounds great! I am free on Monday.',
    is_read: true,
    is_starred: false,
    folder: EmailFolder.SENT,
    thread_id: 'thread_1',
    user_id: 'user_1',
    domain_id: 'dom_1',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    attachments: []
  }
];
