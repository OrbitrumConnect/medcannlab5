-- Fix search_path warning on book_appointment_atomic
ALTER FUNCTION public.book_appointment_atomic(uuid, uuid, timestamptz, text, text) SET search_path = public;