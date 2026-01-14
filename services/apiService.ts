import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Email, EmailDomain, EmailFolder, User, UserRole, EmailAddress } from '../types';

class ApiService {
  private checkConfig() {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured properly in environment variables.");
    }
  }

  private handleError(err: any, context: string) {
    console.error(`Supabase Error [${context}]:`, err);
    const message = err.message || err.details || (typeof err === 'string' ? err : JSON.stringify(err));
    return new Error(`${context} failed: ${message}`);
  }

  async fetchEmails(folder: EmailFolder, userId: string): Promise<Email[]> {
    this.checkConfig();
    try {
      let query = supabase.from('emails').select('*').eq('user_id', userId);
      if (folder === EmailFolder.STARRED) query = query.eq('is_starred', true);
      else query = query.eq('folder', folder);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err: any) { throw this.handleError(err, 'fetching emails'); }
  }

  async toggleStar(emailId: string, isStarred: boolean) {
    this.checkConfig();
    const { error } = await supabase.from('emails').update({ is_starred: !isStarred }).eq('id', emailId);
    if (error) throw this.handleError(error, 'toggling star');
  }

  async getStats(userId: string) {
    this.checkConfig();
    const { count: domainCount } = await supabase.from('email_domains').select('*', { count: 'exact', head: true }).eq('owner_id', userId);
    const { count: addressCount } = await supabase.from('email_addresses').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: emailCount } = await supabase.from('emails').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    return { domains: domainCount || 0, addresses: addressCount || 0, emails: emailCount || 0 };
  }

  async sendEmail(emailData: Partial<Email>): Promise<Email> {
    this.checkConfig();
    try {
      const { data, error } = await supabase.from('emails').insert([{
        ...emailData,
        folder: EmailFolder.SENT,
        is_read: true,
        created_at: new Date().toISOString()
      }]).select().single();
      if (error) throw error;
      return data;
    } catch (err: any) { throw this.handleError(err, 'sending email'); }
  }

  async markAsRead(threadId: string) {
    this.checkConfig();
    await supabase.from('emails').update({ is_read: true }).eq('thread_id', threadId);
  }

  async moveThreadsToTrash(threadIds: string[], userId: string) {
    this.checkConfig();
    const { error } = await supabase
      .from('emails')
      .update({ folder: EmailFolder.TRASH })
      .in('thread_id', threadIds)
      .eq('user_id', userId);
    if (error) throw this.handleError(error, 'moving threads to trash');
  }

  async hardDeleteThreads(threadIds: string[], userId: string) {
    this.checkConfig();
    const { error } = await supabase
      .from('emails')
      .delete()
      .in('thread_id', threadIds)
      .eq('user_id', userId);
    if (error) throw this.handleError(error, 'hard deleting threads');
  }

  async fetchDomains(ownerId: string): Promise<EmailDomain[]> {
    this.checkConfig();
    try {
      const { data, error } = await supabase.from('email_domains').select('*').eq('owner_id', ownerId);
      if (error) throw error;
      return data || [];
    } catch (err: any) { throw this.handleError(err, 'fetching domains'); }
  }

  async addDomain(domainName: string, ownerId: string): Promise<boolean> {
    this.checkConfig();
    try {
      const { error } = await supabase.from('email_domains').insert([{
        owner_id: ownerId, 
        domain: domainName.toLowerCase().trim(), 
        is_verified: false, 
        is_active: true,
        mx_record: 'cloudflare-managed',
        txt_record: `verify-mailflow-${Math.random().toString(36).substring(2, 10)}`
      }]);
      if (error) throw error;
      return true;
    } catch (err: any) { throw this.handleError(err, 'adding domain'); }
  }

  async deleteDomain(domainId: string): Promise<void> {
    this.checkConfig();
    try {
      await supabase.from('emails').delete().eq('domain_id', domainId);
      await supabase.from('email_addresses').delete().eq('domain_id', domainId);
      const { error } = await supabase.from('email_domains').delete().eq('id', domainId);
      if (error) throw error;
    } catch (err: any) { throw this.handleError(err, 'deleting domain'); }
  }

  async fetchAddresses(domainId: string): Promise<EmailAddress[]> {
    this.checkConfig();
    const { data, error } = await supabase.from('email_addresses').select('*').eq('domain_id', domainId);
    if (error) throw error;
    return data || [];
  }

  async addAddress(domainId: string, localPart: string, userId: string): Promise<EmailAddress> {
    this.checkConfig();
    const { data, error } = await supabase.from('email_addresses').insert([{
      domain_id: domainId, 
      local_part: localPart, 
      user_id: userId, 
      is_active: false 
    }]).select().single();
    if (error) throw error;
    return data;
  }

  async deleteAddress(addressId: string): Promise<void> {
    this.checkConfig();
    try {
      const { data: addr } = await supabase.from('email_addresses').select('local_part, domain_id').eq('id', addressId).single();
      if (addr) {
        const { data: dom } = await supabase.from('email_domains').select('domain').eq('id', addr.domain_id).single();
        if (dom) {
          const fullEmail = `${addr.local_part}@${dom.domain}`;
          // Hard delete emails associated with this address
          await supabase.from('emails').delete().or(`to_address.eq.${fullEmail},from_address.eq.${fullEmail}`);
        }
      }
      // Hard delete the address (remove completely from allowlist)
      const { error } = await supabase.from('email_addresses').delete().eq('id', addressId);
      if (error) throw error;
    } catch (err: any) { throw this.handleError(err, 'deleting address'); }
  }

  /**
   * SECURITY: Verify if an email address is in the allowlist
   * Only explicitly created addresses can receive emails
   * Returns null if address is NOT allowed (unauthorized)
   */
  private async isAddressAllowed(toAddress: string): Promise<{ allowed: boolean; address: EmailAddress | null; domain: EmailDomain | null }> {
    try {
      const [localPart, domainPart] = toAddress.split('@');
      if (!localPart || !domainPart) {
        return { allowed: false, address: null, domain: null };
      }

      // 1. Check if domain exists
      const { data: domain } = await supabase
        .from('email_domains')
        .select('*')
        .eq('domain', domainPart.toLowerCase())
        .eq('is_active', true)
        .single();

      if (!domain) {
        // Domain doesn't exist - REJECT
        console.warn(`[SECURITY] Rejected email to ${toAddress}: Domain not registered`);
        return { allowed: false, address: null, domain: null };
      }

      // 2. Check if address is in allowlist (NOT hard-deleted, is_active, and exists)
      const { data: address } = await supabase
        .from('email_addresses')
        .select('*')
        .eq('domain_id', domain.id)
        .eq('local_part', localPart.toLowerCase())
        .eq('is_active', true)
        .eq('is_deleted', false)
        .single();

      if (!address) {
        // Address not in allowlist or is deleted - REJECT (NO processing at all)
        console.warn(`[SECURITY] Rejected email to ${toAddress}: Address not in allowlist`);
        return { allowed: false, address: null, domain };
      }

      return { allowed: true, address, domain };
    } catch (err: any) {
      console.error('[SECURITY] Error checking address allowlist:', err);
      // Fail-safe: reject if any error occurs
      return { allowed: false, address: null, domain: null };
    }
  }

  /**
   * SECURITY: Log rejected emails for monitoring
   * Prevents anonymous storage of attempted unauthorized access
   */
  private async logRejectedEmail(toAddress: string, fromAddress: string, reason: string): Promise<void> {
    try {
      // Optional: Log to a system audit table if you want to track attempts
      // For now, just log to console for security monitoring
      console.log(`[REJECTED_EMAIL] To: ${toAddress} | From: ${fromAddress} | Reason: ${reason}`);
    } catch (err: any) {
      console.error('[AUDIT_LOG_ERROR]:', err);
    }
  }

  async simulateIncomingEmail(toAddress: string): Promise<void> {
    this.checkConfig();
    try {
      const [localPart, domainPart] = toAddress.split('@');
      const { data: domain } = await supabase.from('email_domains').select('*').eq('domain', domainPart).single();
      if (!domain) return;
      const { data: addr } = await supabase.from('email_addresses').select('*').eq('local_part', localPart).eq('domain_id', domain.id).single();
      if (!addr) return;
      if (!addr.is_active) await supabase.from('email_addresses').update({ is_active: true }).eq('id', addr.id);
      if (!domain.is_verified) await supabase.from('email_domains').update({ is_verified: true }).eq('id', domain.id);

      await supabase.from('emails').insert([{
        from_address: 'bridge@secure.io',
        to_address: toAddress,
        subject: `Security Check: ${localPart}`,
        body_html: `<p>Security bridge connected for address: <b>${toAddress}</b></p>`,
        body_text: `Security bridge connected for address: ${toAddress}`,
        folder: EmailFolder.INBOX,
        is_read: false,
        thread_id: `thread_${Date.now()}`,
        user_id: addr.user_id,
        domain_id: domain.id
      }]);
    } catch (err: any) { console.error("Simulation failed:", err.message); }
  }

  /**
   * SECURITY: Handle inbound webhook emails with strict allowlist validation
   * 
   * PROCESS:
   * 1. Check if to_address is in the allowlist (explicitly created in app)
   * 2. If NOT allowed: IMMEDIATELY REJECT/DROP - NO processing, NO DB insert
   * 3. If allowed: Process normally and store email
   */
  async handleWebhookEmail(webhookData: any): Promise<{ success: boolean; rejected: boolean; reason?: string }> {
    this.checkConfig();
    try {
      const { from_address, to_address, subject, body_text, body_html, domain_id, user_id } = webhookData;

      // SECURITY: Validate that to_address is in allowlist
      const validation = await this.isAddressAllowed(to_address);

      if (!validation.allowed) {
        // REJECT: Do NOT process, do NOT store, do NOT create mailbox
        await this.logRejectedEmail(to_address, from_address, 'Address not in allowlist (unauthorized)');
        
        // Return rejection response for webhook caller
        return {
          success: false,
          rejected: true,
          reason: 'Address not authorized to receive emails'
        };
      }

      // Address is allowed - process the email
      const { data: createdEmail, error } = await supabase.from('emails').insert([{
        from_address,
        to_address,
        subject,
        body_text,
        body_html,
        folder: EmailFolder.INBOX,
        is_read: false,
        thread_id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: validation.address!.user_id, // Use address owner, not external provided user_id
        domain_id: validation.domain!.id // Use validated domain, not external provided domain_id
      }]).select().single();

      if (error) throw error;

      // Auto-activate address on first successful email
      if (!validation.address!.is_active) {
        await supabase.from('email_addresses').update({ is_active: true }).eq('id', validation.address!.id);
      }

      console.log(`[EMAIL_RECEIVED] ${from_address} → ${to_address}`);
      return { success: true, rejected: false };
    } catch (err: any) { 
      throw this.handleError(err, 'handling webhook email'); 
    }
  }
}

export const api = new ApiService();