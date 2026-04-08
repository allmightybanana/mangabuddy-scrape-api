import axios from 'axios';

const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL || 'http://localhost:8191/v1';

export async function solveWithFlare(url) {
  try {
    const response = await axios.post(FLARESOLVERR_URL, {
      cmd: 'request.get',
      url,
      maxTimeout: 60000,
    });

    const { status, solution } = response.data;

    if (status !== 'ok') {
      throw new Error(`FlareSolverr error: ${status}`);
    }

    return solution.response; // returns raw HTML
  } catch (error) {
    console.error(`FlareSolverr request failed for ${url}:`, error.message);
    throw error;
  }
}
