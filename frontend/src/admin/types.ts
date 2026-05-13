export type Estado = 'pendiente' | 'aprobado' | 'rechazado';

export interface Talento {
  id: string;
  nombre: string;
  disciplina: string;
  ciudad: string | null;
  edad: number | null;
  bio: string | null;
  foto_url: string | null;
  email: string;
  telefono: string | null;
  redes_seguidores: number;
  estado: Estado;
  created_at: string;
  decidido_at: string | null;
}

export interface Marca {
  id: string;
  nombre: string;
  industria: string;
  pais: string | null;
  sitio_web: string | null;
  contacto_nombre: string;
  contacto_email: string;
  presupuesto_mxn: number | null;
  estado: Estado;
  created_at: string;
  decidido_at: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type Decision = 'aprobado' | 'rechazado';
export type FiltroEstado = Estado | 'todos';
