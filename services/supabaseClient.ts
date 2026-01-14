import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'mailflow_supabase_url';
const STORAGE_KEY_KEY = 'mailflow_supabase_key';
const STORAGE_KEY_SCHEMA = 'mailflow_master_schema';

// Default values (fallback if nothing in localStorage)
const defaultUrl = 'https://irmxzvuzbacyqkmsiudp.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybXh6dnV6YmFjeXFrbXNpdWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTY5ODIsImV4cCI6MjA4Mzg5Mjk4Mn0.L99pAWinTeDYoFqMyhbOsjepXxjba-l2whqit47Nlcc';

export const getSupabaseConfig = () => {
  const url = localStorage.getItem(STORAGE_KEY_URL) || defaultUrl;
  const key = localStorage.getItem(STORAGE_KEY_KEY) || defaultKey;
  return { url, key };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  window.location.reload(); 
};

export const getStoredSchema = (defaultSchema: string) => {
  return localStorage.getItem(STORAGE_KEY_SCHEMA) || defaultSchema;
};

export const saveStoredSchema = (schema: string) => {
  localStorage.setItem(STORAGE_KEY_SCHEMA, schema);
};

const { url, key } = getSupabaseConfig();

export const isSupabaseConfigured = !!url && !!key;

export const supabase = createClient(url, key);