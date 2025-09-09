-- Simple migration to add whatsapp column
-- This is the minimal fix for the shipping agent creation error

ALTER TABLE lats_shipping_agents ADD COLUMN whatsapp TEXT;
