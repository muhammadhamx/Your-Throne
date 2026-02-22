import { supabase } from './supabase';

export async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data;
}

export async function linkEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.updateUser({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function deleteAccount() {
  // User deletion requires a server-side function (Edge Function)
  // For now, sign out and let the Edge Function handle actual deletion
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;
  await signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
