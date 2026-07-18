const url = 'https://vicujxfzwgxtvzvnulha.supabase.co/rest/v1/?apikey=sb_publishable_Oi4_ocIOTWTPuAQkIVjMIA_pAr5Dfkx';

async function fetchSchema() {
  try {
    const response = await fetch(url);
    const spec = await response.json();
    console.log('Available tables/paths in OpenAPI spec:');
    if (spec.paths) {
      Object.keys(spec.paths).forEach(path => {
        console.log(`Path: ${path}`);
      });
      console.log('Definitions/Tables:');
      if (spec.definitions) {
        Object.keys(spec.definitions).forEach(def => {
          console.log(`Table: ${def}`);
        });
      }
    } else {
      console.log('No paths found in spec:', spec);
    }
  } catch (err) {
    console.error('Error fetching schema:', err);
  }
}

fetchSchema();
