import { User, Queue, Token, AnalyticsData } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('flowqueue_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User & { queues: Queue[] } }> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Queues
  async getQueues(): Promise<{ queues: Queue[] }> {
    const res = await fetch(`${BASE_URL}/queues`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getQueueDetails(id: string): Promise<{ queue: Queue; waiting: Token[]; inService: Token[]; recent: Token[] }> {
    const res = await fetch(`${BASE_URL}/queues/${id}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async createQueue(data: { name: string; description?: string; prefix?: string }): Promise<{ queue: Queue }> {
    const res = await fetch(`${BASE_URL}/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateQueue(id: string, data: Partial<Queue>): Promise<{ queue: Queue }> {
    const res = await fetch(`${BASE_URL}/queues/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteQueue(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/queues/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Tokens
  async createToken(
    queueId: string,
    data: { customerName: string; customerPhone?: string; customerEmail?: string; priority?: string; notes?: string }
  ): Promise<{ token: Token }> {
    const res = await fetch(`${BASE_URL}/tokens/queue/${queueId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getWaitingTokens(queueId: string): Promise<{ tokens: Token[] }> {
    const res = await fetch(`${BASE_URL}/tokens/queue/${queueId}/waiting`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async moveToken(id: string, direction: 'UP' | 'DOWN'): Promise<{ tokens: Token[] }> {
    const res = await fetch(`${BASE_URL}/tokens/${id}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ direction }),
    });
    return handleResponse(res);
  },

  async serveNext(queueId: string, counterName?: string): Promise<{ servedToken: Token }> {
    const res = await fetch(`${BASE_URL}/tokens/queue/${queueId}/serve-next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ counterName }),
    });
    return handleResponse(res);
  },

  async completeToken(id: string): Promise<{ token: Token }> {
    const res = await fetch(`${BASE_URL}/tokens/${id}/complete`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async cancelToken(id: string, reason?: string): Promise<{ token: Token }> {
    const res = await fetch(`${BASE_URL}/tokens/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  // Analytics
  async getAnalytics(queueId?: string): Promise<AnalyticsData> {
    const url = queueId ? `${BASE_URL}/analytics?queueId=${queueId}` : `${BASE_URL}/analytics`;
    const res = await fetch(url, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};
