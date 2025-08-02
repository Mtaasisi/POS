import { supabase } from './supabaseClient';
import { CustomerNote, PromoMessage, Rating } from '../types';
import { SoundManager } from './soundUtils';

export async function addCustomerNote(note: CustomerNote, customerId: string) {
  // Assumes a 'customer_notes' table with a customer_id foreign key
  const { data, error } = await supabase.from('customer_notes').insert([{ ...note, customer_id: customerId }]).select();
  if (error) throw error;
  
  // Play sound when customer note is added
  try {
    await SoundManager.playRemarkSound();
  } catch (error) {
    console.warn('Could not play remark sound:', error);
  }
  
  return data && data[0] ? data[0] : null;
}

export async function addPromoMessage(promo: PromoMessage, customerId: string) {
  // Assumes a 'promo_messages' table with a customer_id foreign key
  const { data, error } = await supabase.from('promo_messages').insert([{ ...promo, customer_id: customerId }]).select();
  if (error) throw error;
  return data && data[0] ? data[0] : null;
}

export async function addDeviceRating(rating: Rating) {
  // Assumes a 'device_ratings' table
  const { data, error } = await supabase.from('device_ratings').insert([rating]).select();
  if (error) throw error;
  return data && data[0] ? data[0] : null;
} 