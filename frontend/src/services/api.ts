export const API_URL = "http://localhost:3333";

export async function api(path: string, options?: RequestInit) {
  const token = localStorage.getItem("barberflow_token");

  const headers: HeadersInit = {
    Authorization: token ? `Bearer ${token}` : "",
    ...(options?.headers || {}),
  };

  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("barberflow_token");
    localStorage.removeItem("barberflow_user");

    window.location.href = "/login";
  }

  return response;
}