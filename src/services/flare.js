import axios from 'axios';

const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL || 'http://localhost:8191/v1';
let activeSessionId = null;

/**
 * Ensures a FlareSolverr session exists and returns its ID
 */
async function getOrCreateSession() {
  if (activeSessionId) {
    try {
      // Check if session still exists
      const listResponse = await axios.post(FLARESOLVERR_URL, { cmd: 'sessions.list' });
      if (listResponse.data.sessions.includes(activeSessionId)) {
        return activeSessionId;
      }
    } catch (error) {
      console.warn('[Flare] Failed to verify session, attempting to create new one.');
    }
  }

  try {
    console.log('[Flare] Creating new persistent session...');
    const response = await axios.post(FLARESOLVERR_URL, { cmd: 'sessions.create' });
    if (response.data.status === 'ok') {
      activeSessionId = response.data.session;
      console.log(`[Flare] Session created: ${activeSessionId}`);
      return activeSessionId;
    }
    throw new Error(`Failed to create session: ${response.data.message}`);
  } catch (error) {
    console.error('[Flare] Session creation failed:', error.message);
    return null; // Fallback to transient session if creation fails
  }
}

/**
 * Solves a URL using FlareSolverr, preferably using a persistent session.
 */
export async function solveWithFlare(url) {
  const sessionId = await getOrCreateSession();
  
  try {
    const payload = {
      cmd: 'request.get',
      url,
      maxTimeout: 60000,
    };

    if (sessionId) {
      payload.session = sessionId;
    }

    const response = await axios.post(FLARESOLVERR_URL, payload);
    const { status, solution, message } = response.data;

    if (status !== 'ok') {
      // If session is invalid, clear it and retry once without session
      if (message && message.includes('session not found')) {
        console.warn(`[Flare] Session ${sessionId} lost. Clearing and retrying...`);
        activeSessionId = null;
        return solveWithFlare(url);
      }
      throw new Error(`FlareSolverr error: ${status} - ${message}`);
    }

    return {
      html: solution.response,
      cookies: solution.cookies,
      userAgent: solution.userAgent
    };
  } catch (error) {
    console.error(`[Flare] Request failed for ${url}:`, error.message);
    throw error;
  }
}

/**
 * Destroys the active session if it exists
 */
export async function destroySession() {
  if (!activeSessionId) return;

  try {
    await axios.post(FLARESOLVERR_URL, {
      cmd: 'sessions.destroy',
      session: activeSessionId
    });
    console.log(`[Flare] Session ${activeSessionId} destroyed.`);
    activeSessionId = null;
  } catch (error) {
    console.error('[Flare] Failed to destroy session:', error.message);
  }
}
