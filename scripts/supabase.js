// Configuration Supabase
const supabaseUrl = 'https://aibrhuoxwqwqbkhjhote.supabase.co'; // Remplacez par votre URL Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYnJodW94d3F3cWJraGpob3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MTUxNzIsImV4cCI6MjA1NjA5MTE3Mn0.Lz_P5ZIUwL5mqIuMjJn3pxWnYV8SwprKUuDEnSOHii0'; // Remplacez par votre clé Supabase
window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

