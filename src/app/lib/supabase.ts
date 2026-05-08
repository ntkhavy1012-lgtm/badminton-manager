import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rmigqxswrqxhxtsaxqhg.supabase.co";
const supabaseKey = "sb_publishable_SttftUbs0z-sWTpEEGhfVw__80r3zG6";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
