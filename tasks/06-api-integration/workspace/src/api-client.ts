interface User {
  id: number;
  name: string;
  email: string;
}

const BASE_URL = "https://api.example.com/v1";

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch(`${BASE_URL}/users`);
  const data = await response.json();
  return data as User[];
}

export async function fetchUserById(id: number): Promise<User> {
  const response = await fetch(`${BASE_URL}/users/${id}`);
  const data = await response.json();
  return data as User;
}

export async function createUser(name: string, email: string): Promise<User> {
  const response = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  const data = await response.json();
  return data as User;
}
