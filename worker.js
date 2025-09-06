// Cloudflare Worker version of the Energy Calculator
// This can be deployed directly as a Worker if Pages deployment fails

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Import the compiled worker
    const worker = await import('./dist/_worker.js');
    return worker.default.fetch(request, env, ctx);
  }
};