import { supabase } from './supabase';

export type ActivityType = 'CREATE' | 'UPDATE' | 'DELETE';
export type ResourceType = 'CLIENT' | 'NETWORK' | 'PRINTER' | 'INBOUND_PACKAGE';

export async function logActivity(
  actionType: ActivityType,
  resourceType: ResourceType,
  resourceId: string,
  details: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: user.id,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      details
    });

  if (error) {
    console.error('Error logging activity:', error);
  }
}