import type {
  DefaultsResponse,
  ScenarioPayload,
  ScenarioRecord,
  SimulationRequestPayload,
  SimulationResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mhkapp.com';
console.log('API_BASE_URL', API_BASE_URL);

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Forecast API error');
  }
  return response.json() as Promise<T>;
};

export const fetchDefaults = async (): Promise<DefaultsResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/forecast/defaults`, {
    cache: 'no-store',
  });
  return handleResponse<DefaultsResponse>(response);
};

export const runSimulation = async (payload: SimulationRequestPayload): Promise<SimulationResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/forecast/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<SimulationResponse>(response);
};

export const fetchScenarios = async (): Promise<ScenarioRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/api/scenarios`, { cache: 'no-store' });
  return handleResponse<ScenarioRecord[]>(response);
};

export const createScenario = async (payload: ScenarioPayload): Promise<ScenarioRecord> => {
  const response = await fetch(`${API_BASE_URL}/api/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<ScenarioRecord>(response);
};

export const updateScenarioRecord = async (
  id: string,
  payload: ScenarioPayload
): Promise<ScenarioRecord> => {
  const response = await fetch(`${API_BASE_URL}/api/scenarios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<ScenarioRecord>(response);
};
