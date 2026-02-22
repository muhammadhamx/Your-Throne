import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const channels = new Map<string, RealtimeChannel>();

export function getChannel(name: string): RealtimeChannel {
  const existing = channels.get(name);
  if (existing) return existing;

  const channel = supabase.channel(name);
  channels.set(name, channel);
  return channel;
}

export function removeChannel(name: string): void {
  const channel = channels.get(name);
  if (channel) {
    supabase.removeChannel(channel);
    channels.delete(name);
  }
}

export function removeAllChannels(): void {
  channels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
  channels.clear();
}
