import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const { data: vagas, error: erroVagas } = await supabase
  .from('vagas')
  .select('id, numero, status')
  .order('numero');

const { data: contratosAtivos, error: erroContratos } = await supabase
  .from('contratos')
  .select('id, vaga_id, status')
  .eq('status', 'ativo');

console.log(JSON.stringify({
  vagas: vagas ?? [],
  contratosAtivos: contratosAtivos ?? [],
  erroVagas,
  erroContratos,
}, null, 2));
