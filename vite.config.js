import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [apiProxies()],
  server: { port: 5173 },
  root: '.',
  publicDir: 'public',
});

function apiProxies() {
  return {
    name: 'api-proxies',
    configureServer(server) {
      // --- Supabase REST proxy ---
      server.middlewares.use('/api/supabase', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        try {
          const url = new URL(req.url, 'http://localhost');
          const table = url.searchParams.get('table');
          if (!table) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'table parameter required' }));
            return;
          }

          const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
          if (!supabaseKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'SUPABASE_SERVICE_KEY not set' }));
            return;
          }

          const supabaseUrl = 'https://mvuslmfjkkuizixjpkgl.supabase.co/rest/v1/' + encodeURIComponent(table);
          const params = new URLSearchParams();
          const select = url.searchParams.get('select');
          if (select) params.set('select', select);
          const limit = url.searchParams.get('limit');
          if (limit) params.set('limit', limit);
          const order = url.searchParams.get('order');
          if (order) params.set('order', order);
          const filter = url.searchParams.get('filter');
          if (filter) {
            // filter format: column.operator.value
            const parts = filter.split('.');
            if (parts.length >= 3) {
              const col = parts[0];
              const op = parts[1];
              const val = parts.slice(2).join('.');
              params.set(col, `${op}.${val}`);
            }
          }

          const fetchUrl = supabaseUrl + '?' + params.toString();
          const response = await fetch(fetchUrl, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': 'Bearer ' + supabaseKey,
            },
          });

          const data = await response.text();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = response.status;
          res.end(data);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // --- Anthropic chat proxy ---
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { message } = JSON.parse(body);

            const apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }));
              return;
            }

            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 150,
                system: "You are JARVIS, the AI Chief of Staff for Conduit AI, a company founded by Luis Garcia. You manage 35 AI employees across 8 departments (Sales, Marketing, Engineering, Content, Intelligence, Operations, Monitoring, and CEO Suite). Current stats: MRR $0, Pipeline $89,895, 505 prospects, 8 engines running. Be concise, professional, and proactive. Address Luis as Mr. Garcia or CEO. Keep responses under 3 sentences.",
                messages: [{ role: 'user', content: message }],
              }),
            });

            const data = await response.json();
            res.setHeader('Content-Type', 'application/json');

            if (data.content && data.content[0]) {
              res.end(JSON.stringify({ reply: data.content[0].text }));
            } else {
              res.end(JSON.stringify({ error: 'No response', raw: data }));
            }
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };
}
