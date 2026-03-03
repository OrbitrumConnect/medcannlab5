-- =====================================================
-- P0-2: FIX chat_messages - Remove conflicting INSERT policy
-- and ensure participant-based access works correctly
-- =====================================================

-- 1. Drop the conflicting INSERT policy on 'public' role
-- (authenticated users should only match 'authenticated' role policies)
DROP POLICY IF EXISTS "Users can insert messages" ON public.chat_messages;

-- The remaining policies are correct:
-- messages_select_room_member_or_admin: SELECT for room members or admins
-- messages_insert_sender_is_member: INSERT if sender_id = uid AND is_chat_room_member
-- messages_update_sender_or_admin: UPDATE if sender or admin  
-- messages_delete_sender_or_admin: DELETE if sender or admin

-- 2. Fix the 32 orphaned rooms that have 0 participants
-- These rooms were created by create_chat_room_for_patient but participants weren't inserted
-- We need to populate them from the room metadata

-- 2a. For rooms created_by a user, add that user as participant
INSERT INTO chat_participants (room_id, user_id, role)
SELECT cr.id, cr.created_by, 
  CASE WHEN public.is_admin_user(cr.created_by) THEN 'professional' ELSE 'patient' END
FROM chat_rooms cr
WHERE cr.created_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM chat_participants cp WHERE cp.room_id = cr.id AND cp.user_id = cr.created_by
)
ON CONFLICT (room_id, user_id) DO NOTHING;

-- 2b. Ensure the create_chat_room_for_patient function is robust
-- (it already inserts participants correctly, the orphans are legacy data)

-- 3. Add realtime publication for chat_messages if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;