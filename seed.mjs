import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const autor_id = '529e2b5a-f0e4-4a4d-9b0c-3538d4e7f922'; // Existing user ID

const articulos = [
  {
    titulo: 'The Architecture of Silence: Finding Meaning in the Void',
    contenido: 'An exploration into how modern spaces construct the absence of sound, and whether true silence is an objective reality or a psychological projection within contemporary society.\n\nHistorically, silence was the default state of the human environment, punctuated by events: wind, a voice, a tool striking stone. Today, the inverse is true. We must actively construct barriers to carve out quietude. This shift fundamentally alters human cognition and the capacity for deep, philosophical interiority.',
    imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7FADb8L81KTsimkAtTv_ZHrmPpnz2ihXFsZRjHHLRDWD_brbO0B2kqn5fLW4t-ub_WvKvOg81TOaH4XVkJ-VTH3Y0wB6YtelzQwpH4brNLVfPNHoDkKorsyoEtdeDDUrc0N5DgE1rcca9hpAgWjO-PYdi5-Lt799e7-BGZSVEPHg-PFvaiBFXuCTAkfMvQDI64Tb6WrBjF6Gv7STD1U2Ue3ogU14aH9szSbmmytcEnTkqPBbnocNuu7TTaUrrPlG0RX0Jwv4a_xw',
    autor_id
  },
  {
    titulo: 'The End of Consensus: How Fractured Narratives Shape Policy',
    contenido: 'As centralized information crumbles, governance struggles to find a common grounding. A look into the disparate realities forming modern political discourse.',
    imagen_url: null,
    autor_id
  },
  {
    titulo: 'Re-reading Proust in the Age of Constant Interruption',
    contenido: 'Attempting long-form reading when the mind has been rewired by digital immediacy. Can we still access the depth of involuntary memory?',
    imagen_url: null,
    autor_id
  },
  {
    titulo: 'The Illusion of Infinite Growth in Finite Systems',
    contenido: 'Challenging the foundational myth of modern capitalism. When biological constraints meet economic theory.',
    imagen_url: null,
    autor_id
  },
  {
    titulo: 'On Walking: The Pace of Thought and the Rhythm of the Suburbs',
    contenido: 'There is a specific cadence to the mind when moving at three miles an hour. Observing the mundane architecture of residential streets to understand the architecture of our own anxieties.',
    imagen_url: null,
    autor_id
  },
  {
    titulo: 'The Stoic Revival: Comfort in Control',
    contenido: 'Why an ancient philosophy of endurance is suddenly appealing to a generation facing overwhelming systemic uncertainty.',
    imagen_url: null,
    autor_id
  }
];

async function seed() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@gmail.com',
    password: '123456'
  });
  
  if (authError) {
    console.error("Auth failed:", authError);
    return;
  }

  const { data, error } = await supabase.from('articulos').insert(articulos);
  console.log("Seed complete:", error || "Success");
}

seed();
