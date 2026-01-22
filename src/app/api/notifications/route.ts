import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch notifications (RLS handles access control)
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching notifications:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Calculate unread count
        const unreadCount = notifications?.filter(n =>
            !n.read_by?.includes(user.id)
        ).length || 0;

        return NextResponse.json({ notifications, unreadCount });
    } catch (err: any) {
        console.error('Notifications API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notificationId } = await request.json();

        // Mark as read by appending user ID
        const { error } = await supabase.rpc('mark_notification_read', {
            notification_id: notificationId,
            user_id: user.id
        });

        if (error) {
            console.error('Error marking notification as read:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Notification mark read error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
