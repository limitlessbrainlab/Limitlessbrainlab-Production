import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Subscribe to Supabase Realtime postgres_changes for one or more tables and
 * call `onChange` (debounced) whenever a matching row changes. Realtime is used
 * purely as a trigger to re-run a screen's EXISTING load function — it does not
 * hand-merge rows, so it reuses the screen's normal query + normalization.
 *
 * @param {Array<{table:string, filter?:string, event?:string}>} specs
 *        e.g. [{ table: 'patients', filter: `org_id=eq.${clinicId}` }]
 * @param {Function} onChange  called on any matching change (debounced ~300ms)
 * @param {Array} deps  re-subscribe when these change (ids that appear in filters)
 *
 * Requires the table(s) to be in the `supabase_realtime` publication and the
 * anon role to be allowed to read them (RLS), otherwise no events are delivered.
 */
export default function useRealtimeRefetch(specs, onChange, deps = []) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    const valid = (specs || []).filter((s) => s && s.table);
    if (valid.length === 0) return undefined;

    let timer = null;
    const fire = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        try { cbRef.current?.(); } catch (e) { /* swallow — load fn handles its own errors */ }
      }, 300);
    };

    // Unique channel name per mount avoids collisions with other subscribers.
    const channelName = `rt-${valid.map((s) => s.table).join('-')}-${Math.random().toString(36).slice(2)}`;
    let channel = supabase.channel(channelName);
    valid.forEach(({ table, filter, event = '*' }) => {
      channel = channel.on(
        'postgres_changes',
        { event, schema: 'public', table, ...(filter ? { filter } : {}) },
        fire
      );
    });
    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
