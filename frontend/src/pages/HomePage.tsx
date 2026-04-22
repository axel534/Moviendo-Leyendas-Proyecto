import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface HelloResponse {
  message: string;
  timestamp: string;
}

export default function HomePage() {
  const [hello, setHello] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<HelloResponse>('/api/v1/hello')
      .then(setHello)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <h1>Cowork Project 🚀</h1>
      <p>Ambiente de desarrollo compartido entre los tres.</p>

      <h2>Estado del backend</h2>
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {hello && (
        <pre>
          {JSON.stringify(hello, null, 2)}
        </pre>
      )}
      {!hello && !error && <p>Cargando…</p>}
    </section>
  );
}
