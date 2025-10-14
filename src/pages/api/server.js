export async function GET() {
  return new Response(JSON.stringify({ status: 'Server is running' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}