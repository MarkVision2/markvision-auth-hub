// Instagram Webhook Proxy for Meta verification + n8n forwarding
// GET  -> returns hub.challenge (Meta verification)
// POST -> forwards to n8n webhook

const N8N_WEBHOOK_URL = 'https://n8n.zapoinov.com/webhook/ig-comment';
const VERIFY_TOKEN = 'markvision_ig_2026';

export default async function handler(req, res) {
  // GET: Meta webhook verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Forbidden');
  }

  // POST: Forward to n8n
  if (req.method === 'POST') {
    const payload = JSON.stringify(req.body);
    console.log('IG WEBHOOK BODY:', payload.substring(0, 1000));
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

      return res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('Forward error:', error.message);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  return res.status(405).send('Method not allowed');
}
