import { createClient } from '@supabase/supabase-js';
import { TicketPurchase } from '../types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Clean validation check to prevent premature runtime initialization errors
export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '' &&
  supabaseUrl !== 'MY_SUPABASE_URL' &&
  supabaseAnonKey !== 'MY_SUPABASE_ANON_KEY'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Sync user registration/profile metadata to Supabase
 */
export async function syncUserProfile(user: {
  name: string;
  email: string;
  preferredCity: string;
  preferredDate: string;
}) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          email: user.email.toLowerCase(),
          name: user.name,
          preferred_city: user.preferredCity,
          preferred_date: user.preferredDate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select();

    if (error) {
      console.warn('Supabase profile sync returned a warning:', error.message);
      return null;
    }
    return data?.[0] || null;
  } catch (err) {
    console.error('Failed to sync user profile with Supabase:', err);
    return null;
  }
}

/**
 * Fetch all booked tickets for a logged-in email from Supabase
 */
export async function fetchUserTickets(email: string): Promise<TicketPurchase[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_email', email.toLowerCase())
      .order('booked_at', { ascending: false });

    if (error) {
      console.warn('Supabase tickets fetch returned a warning:', error.message);
      return null;
    }

    if (!data) return [];

    // Map database snake_case representation back into our camelCase TicketPurchase interface definitions
    return data.map((item: any) => ({
      id: item.id || `ticket-${Date.now()}-${Math.random()}`,
      eventId: item.event_id,
      seats: Array.isArray(item.seats) ? item.seats : (item.seats ? JSON.parse(item.seats) : ['Seat A1']),
      quantity: item.quantity || 1,
      totalPrice: item.total_price || 0,
      purchaseDate: item.booked_at ? new Date(item.booked_at).toLocaleDateString() : new Date().toLocaleDateString(),
      status: item.status || 'active',
      qrCode: item.qr_code || `METRO-${item.id || Date.now()}`,
    }));
  } catch (err) {
    console.error('Exception seeking Supabase tickets:', err);
    return null;
  }
}

/**
 * Sync a new ticket booking to Supabase
 */
export async function syncTicketBooking(ticket: TicketPurchase, userEmail: string) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        id: ticket.id,
        event_id: ticket.eventId,
        user_email: userEmail.toLowerCase(),
        seats: ticket.seats,
        quantity: ticket.quantity,
        total_price: ticket.totalPrice,
        status: ticket.status || 'active',
        qr_code: ticket.qrCode,
        booked_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Supabase booking creation returned a database error:', error.message, error.details, error.hint);
      // Let's dispatch a custom window event so that our UI can display this exact error!
      window.dispatchEvent(new CustomEvent('supabase-booking-error', { detail: error.message }));
      return null;
    }
    return data?.[0] || null;
  } catch (err: any) {
    console.error('Failed to push ticket booking to Supabase:', err);
    window.dispatchEvent(new CustomEvent('supabase-booking-error', { detail: err?.message || 'Network transport failed' }));
    return null;
  }
}

/**
 * Cancel a ticket booking from Supabase
 */
export async function deleteTicketBooking(ticketId: string) {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', ticketId);

    if (error) {
      console.warn('Supabase cancellation returned warnings:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete booking from Supabase:', err);
    return false;
  }
}
