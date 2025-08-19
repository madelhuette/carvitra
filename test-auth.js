const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://kigcdrahcvyddxrkaeog.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZ2NkcmFoY3Z5ZGR4cmthZW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjc1NDYsImV4cCI6MjA3MDc0MzU0Nn0.6GmrEKHnxRLeCMsO6_gnLsvwsaKbljOIpWhsBetGzM4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignUp() {
  const { data, error } = await supabase.auth.signUp({
    email: 'testuser123@gmail.com',
    password: 'SuperStrong#2025!Password',
    options: {
      data: {
        first_name: 'Test',
        last_name: 'User',
        company_name: 'Test GmbH'
      }
    }
  })
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success:', data)
  }
}

testSignUp()
