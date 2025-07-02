var client;

fetch('/loco/supabase.config.json')
    .then(response => response.json())  // <- Aquí se extrae el cuerpo
  .then(secrets => {
    client = supabase.createClient(secrets.supabaseUrl, secrets.supabaseKey);

    console.log('Supabase client initialized');
  })
  .catch(error => {
    console.error('Error loading Supabase secrets:', error);
  });
