import { supabase } from './supabaseClient';

// Upload a file to Supabase Storage and create a device_attachments record
export async function uploadAttachment(deviceId: string, file: File, userId: string, type: string = 'other') {
  const filePath = `${deviceId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('device-attachments')
    .upload(filePath, file);
  if (error) throw error;

  const publicUrl = supabase.storage.from('device-attachments').getPublicUrl(filePath).data.publicUrl;

  // Insert metadata into device_attachments table
  const { data: row, error: rowError } = await supabase.from('device_attachments').insert({
    device_id: deviceId,
    file_url: publicUrl,
    file_name: file.name,
    uploaded_by: userId,
    type,
  }).select().single();
  if (rowError) throw rowError;
  return row;
}

// List attachments for a device
export async function listAttachments(deviceId: string) {
  const { data, error } = await supabase
    .from('device_attachments')
    .select('*')
    .eq('device_id', deviceId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Delete an attachment (from storage and table)
export async function deleteAttachment(attachmentId: string, fileUrl: string) {
  // Extract file path from URL
  const urlParts = fileUrl.split('/');
  const filePath = urlParts.slice(urlParts.indexOf('device-attachments') + 1).join('/');
  await supabase.storage.from('device-attachments').remove([filePath]);
  await supabase.from('device_attachments').delete().eq('id', attachmentId);
} 