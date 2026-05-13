/**
 * Datos seed para el modo demo.
 * Refleja el seed de las migraciones 0003 y 0005 (mismas filas, mismos IDs estables).
 * Cuando se conecte al backend real, este archivo deja de usarse.
 */

import type {
  MatchRow,
  MensajeRow,
  PostVitrinaRow,
  SessionUserApi,
} from './mlApi';

export interface MockTalento {
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
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  plan: 'free' | 'pro' | 'premium';
  puntuacion: number;
  created_at: string;
  decidido_at: string | null;
}

export interface MockMarca {
  id: string;
  nombre: string;
  industria: string;
  pais: string | null;
  sitio_web: string | null;
  contacto_nombre: string;
  contacto_email: string;
  presupuesto_mxn: number | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  plan: 'free' | 'pro' | 'premium';
  puntuacion: number;
  created_at: string;
  decidido_at: string | null;
}

export interface MockMatch {
  id: string;
  talento_id: string;
  marca_id: string;
  porcentaje: number;
  razones: { razones: string[] };
  estado: 'nuevo' | 'solicitado' | 'conectado' | 'rechazado';
  iniciado_por: 'talento' | 'marca';
  created_at: string;
}

export interface MockMensaje {
  id: string;
  match_id: string;
  autor_tipo: 'talento' | 'marca' | 'ia';
  texto: string;
  tipo_ia: string | null;
  created_at: string;
}

export interface MockPost {
  id: string;
  autor_id: string;
  texto: string;
  imagen_url: string;
  tipo: 'logro' | 'acuerdo' | 'competencia' | 'general';
  likes: number;
  hashtags: string | null;
  created_at: string;
}

export interface MockStaff {
  id: string;
  email: string;
  password: string; // plaintext para el mock (NO hace bcrypt en cliente)
  nombre: string;
  rol: 'owner' | 'admin';
  activo: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface MockIntegracion {
  slug: 'railway' | 'secureshell' | 'whapi';
  nombre: string;
  config: Record<string, unknown>;
  activa: boolean;
  last_test_at: string | null;
  last_test_ok: boolean | null;
  last_test_error: string | null;
  updated_at: string;
}

// IDs estables para que los matches puedan referenciar
const ID = {
  t_diego:    'mt-001',
  t_sofia:    'mt-002',
  t_luis:     'mt-003',
  t_maria:    'mt-004',
  t_andres:   'mt-005',
  t_camila:   'mt-006',
  t_joaquin:  'mt-007',
  t_renata:   'mt-008',
  m_salinas:  'mm-001',
  m_tacomx:   'mm-002',
  m_aceros:   'mm-003',
  m_vertice:  'mm-004',
  m_llantas:  'mm-005',
  m_hidra:    'mm-006',
  m_forge:    'mm-007',
} as const;

const NOW = new Date().toISOString();
const HOUR_AGO = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const SEED_TALENTOS: MockTalento[] = [
  { id: ID.t_diego, nombre: 'Diego Hernández', disciplina: 'Karting - Categoría Junior', ciudad: 'Querétaro', edad: 16,
    bio: 'Piloto de karting, 3 años compitiendo en NACAM. Busco patrocinio para temporada 2026.',
    foto_url: 'https://i.pravatar.cc/200?img=12', email: 'diego.hernandez@mail.com', telefono: '+52 442 111 2233',
    redes_seguidores: 3200, estado: 'pendiente', plan: 'free', puntuacion: 50, created_at: NOW, decidido_at: null },
  { id: ID.t_sofia, nombre: 'Sofía Ramírez', disciplina: 'Atletismo - 400m vallas', ciudad: 'CDMX', edad: 22,
    bio: 'Atleta universitaria, top 5 nacional. Universidad Anáhuac.',
    foto_url: 'https://i.pravatar.cc/200?img=47', email: 'sofia.ramirez@mail.com', telefono: '+52 55 9988 7766',
    redes_seguidores: 8400, estado: 'aprobado', plan: 'free', puntuacion: 62, created_at: NOW, decidido_at: NOW },
  { id: ID.t_luis, nombre: 'Luis Carrasco', disciplina: 'F4 NACAM', ciudad: 'Monterrey', edad: 19,
    bio: 'Tercer lugar campeonato F4 2025. Salto a F3 en 2026 si consigo respaldo.',
    foto_url: 'https://i.pravatar.cc/200?img=33', email: 'luis.carrasco@mail.com', telefono: '+52 81 5544 3322',
    redes_seguidores: 14200, estado: 'aprobado', plan: 'pro', puntuacion: 78, created_at: NOW, decidido_at: NOW },
  { id: ID.t_maria, nombre: 'María del Toro', disciplina: 'Motocross', ciudad: 'Guadalajara', edad: 24,
    bio: 'Primera mujer mexicana en podio AMA Supercross categoría amateur.',
    foto_url: 'https://i.pravatar.cc/200?img=49', email: 'maria.deltoro@mail.com', telefono: '+52 33 1122 3344',
    redes_seguidores: 22500, estado: 'aprobado', plan: 'premium', puntuacion: 82, created_at: NOW, decidido_at: NOW },
  { id: ID.t_andres, nombre: 'Andrés Vega', disciplina: 'Surf', ciudad: 'Puerto Escondido', edad: 20,
    bio: 'Selección nacional 2024. Busco marcas de bebidas y ropa.',
    foto_url: 'https://i.pravatar.cc/200?img=15', email: 'andres.vega@mail.com', telefono: '+52 954 778 8899',
    redes_seguidores: 5600, estado: 'pendiente', plan: 'free', puntuacion: 50, created_at: NOW, decidido_at: null },
  { id: ID.t_camila, nombre: 'Camila Ortega', disciplina: 'Tenis WTA', ciudad: 'Monterrey', edad: 21,
    bio: 'Top 200 ITF, gira sudamericana 2026. Busco marca de raquetas y bebidas.',
    foto_url: 'https://i.pravatar.cc/200?img=44', email: 'camila.ortega@mail.com', telefono: '+52 81 7766 5544',
    redes_seguidores: 18900, estado: 'aprobado', plan: 'pro', puntuacion: 78, created_at: NOW, decidido_at: NOW },
  { id: ID.t_joaquin, nombre: 'Joaquín Rivas', disciplina: 'MMA peso pluma', ciudad: 'CDMX', edad: 26,
    bio: 'Récord 12-2. Próxima pelea en UFC contender series.',
    foto_url: 'https://i.pravatar.cc/200?img=53', email: 'joaquin.rivas@mail.com', telefono: '+52 55 4433 2211',
    redes_seguidores: 32400, estado: 'aprobado', plan: 'premium', puntuacion: 86, created_at: NOW, decidido_at: NOW },
  { id: ID.t_renata, nombre: 'Renata Solano', disciplina: 'Triatlón', ciudad: 'Tijuana', edad: 27,
    bio: 'Clasificada Kona 2025. Busco marcas de nutrición deportiva y wearables.',
    foto_url: 'https://i.pravatar.cc/200?img=23', email: 'renata.solano@mail.com', telefono: '+52 664 998 7766',
    redes_seguidores: 11500, estado: 'aprobado', plan: 'free', puntuacion: 64, created_at: NOW, decidido_at: NOW },
];

export const SEED_MARCAS: MockMarca[] = [
  { id: ID.m_salinas, nombre: 'Bebidas Salinas', industria: 'Bebidas energéticas', pais: 'México', sitio_web: 'https://bebidassalinas.mx',
    contacto_nombre: 'Carolina Ponce', contacto_email: 'carolina@bebidassalinas.mx', presupuesto_mxn: 250000,
    estado: 'pendiente', plan: 'free', puntuacion: 50, created_at: NOW, decidido_at: null },
  { id: ID.m_tacomx, nombre: 'TaqueríasMX', industria: 'Restaurantes', pais: 'México', sitio_web: 'https://taqueriasmx.com',
    contacto_nombre: 'Roberto Linares', contacto_email: 'roberto@taqueriasmx.com', presupuesto_mxn: 80000,
    estado: 'pendiente', plan: 'free', puntuacion: 50, created_at: NOW, decidido_at: null },
  { id: ID.m_aceros, nombre: 'Aceros del Norte', industria: 'Industrial / Construcción', pais: 'México', sitio_web: 'https://acerosdelnorte.com',
    contacto_nombre: 'Patricia Olmos', contacto_email: 'p.olmos@acerosdelnorte.com', presupuesto_mxn: 500000,
    estado: 'pendiente', plan: 'free', puntuacion: 50, created_at: NOW, decidido_at: null },
  { id: ID.m_vertice, nombre: 'Banco Vértice', industria: 'Servicios financieros', pais: 'México', sitio_web: 'https://bancovertice.mx',
    contacto_nombre: 'Diego Ferrer', contacto_email: 'diego.ferrer@bancovertice.mx', presupuesto_mxn: 1200000,
    estado: 'aprobado', plan: 'premium', puntuacion: 78, created_at: NOW, decidido_at: NOW },
  { id: ID.m_llantas, nombre: 'Llantas RC', industria: 'Automotriz', pais: 'México', sitio_web: 'https://llantasrc.mx',
    contacto_nombre: 'Karla Méndez', contacto_email: 'karla@llantasrc.mx', presupuesto_mxn: 180000,
    estado: 'pendiente', plan: 'free', puntuacion: 50, created_at: NOW, decidido_at: null },
  { id: ID.m_hidra, nombre: 'Hidra+', industria: 'Bebidas deportivas', pais: 'México', sitio_web: 'https://hidraplus.mx',
    contacto_nombre: 'Tania Robles', contacto_email: 't.robles@hidraplus.mx', presupuesto_mxn: 350000,
    estado: 'aprobado', plan: 'pro', puntuacion: 72, created_at: NOW, decidido_at: NOW },
  { id: ID.m_forge, nombre: 'Forge Apparel', industria: 'Ropa deportiva', pais: 'México', sitio_web: 'https://forge.mx',
    contacto_nombre: 'Eduardo Cano', contacto_email: 'edu@forge.mx', presupuesto_mxn: 220000,
    estado: 'aprobado', plan: 'pro', puntuacion: 69, created_at: NOW, decidido_at: NOW },
];

export const SEED_MATCHES: MockMatch[] = [
  { id: 'mx-001', talento_id: ID.t_luis, marca_id: ID.m_forge, porcentaje: 92,
    razones: { razones: ['Misma ciudad: Monterrey', 'Marca busca atleta de motor', 'Presupuesto cubre acuerdo anual'] },
    estado: 'conectado', iniciado_por: 'marca', created_at: HOUR_AGO(2) },
  { id: 'mx-002', talento_id: ID.t_luis, marca_id: ID.m_hidra, porcentaje: 87,
    razones: { razones: ['Hidratación encaja con deportes de motor', 'Marca activa con atletas similares', 'Presupuesto medio-alto'] },
    estado: 'solicitado', iniciado_por: 'talento', created_at: HOUR_AGO(24) },
  { id: 'mx-003', talento_id: ID.t_luis, marca_id: ID.m_llantas, porcentaje: 85,
    razones: { razones: ['Encaja con deportes de motor', 'Acepta atletas amateurs', 'Audiencia local fuerte'] },
    estado: 'nuevo', iniciado_por: 'talento', created_at: HOUR_AGO(48) },
  { id: 'mx-004', talento_id: ID.t_camila, marca_id: ID.m_hidra, porcentaje: 88,
    razones: { razones: ['Tenis profesional alineado con bebidas deportivas', 'Mismo mercado: Monterrey'] },
    estado: 'conectado', iniciado_por: 'marca', created_at: HOUR_AGO(72) },
  { id: 'mx-005', talento_id: ID.t_joaquin, marca_id: ID.m_forge, porcentaje: 84,
    razones: { razones: ['MMA con marca de ropa deportiva', 'Audiencia premium'] },
    estado: 'nuevo', iniciado_por: 'marca', created_at: HOUR_AGO(96) },
];

export const SEED_MENSAJES: MockMensaje[] = [
  { id: 'msg-001', match_id: 'mx-001', autor_tipo: 'marca', texto: 'Hola Luis, vimos tu próxima carrera. Nos interesa proponerte un acuerdo para que uses nuestra ropa.', tipo_ia: null, created_at: HOUR_AGO(1) },
  { id: 'msg-002', match_id: 'mx-001', autor_tipo: 'talento', texto: 'Hola Eduardo, gracias por escribir. Cuéntame qué tienen en mente.', tipo_ia: null, created_at: HOUR_AGO(0.9) },
  { id: 'msg-003', match_id: 'mx-001', autor_tipo: 'marca', texto: 'Pensamos en un acuerdo anual de $180,000 MXN. Incluye ropa de competencia, walkout, entrenamiento y 4 publicaciones mensuales.', tipo_ia: null, created_at: HOUR_AGO(0.7) },
  { id: 'msg-004', match_id: 'mx-001', autor_tipo: 'talento', texto: 'Suena bien. ¿Cuándo empezaríamos?', tipo_ia: null, created_at: HOUR_AGO(0.6) },
  { id: 'msg-005', match_id: 'mx-001', autor_tipo: 'marca', texto: 'Si te late, podemos arrancar el 1 de junio. Trato hecho de tu lado?', tipo_ia: null, created_at: HOUR_AGO(0.5) },
  { id: 'msg-006', match_id: 'mx-001', autor_tipo: 'ia', texto: 'Detecté que están cerca de cerrar. Puedo armar un borrador de contrato con los términos: $180,000 MXN anuales, inicio 1 de junio, 4 publicaciones mensuales. ¿Lo genero?', tipo_ia: 'cierre', created_at: HOUR_AGO(0.4) },
];

export const SEED_POSTS: MockPost[] = [
  { id: 'p-001', autor_id: ID.t_luis, texto: 'Tercer lugar en el campeonato F4. Gracias a todos los que me apoyan.',
    imagen_url: 'https://images.unsplash.com/photo-1541744573515-478c959628a0?w=800', tipo: 'logro', likes: 124,
    hashtags: '#F4NACAM #karting', created_at: HOUR_AGO(24) },
  { id: 'p-002', autor_id: ID.t_joaquin, texto: 'Cerré acuerdo con Forge Apparel. Vamos por más.',
    imagen_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800', tipo: 'acuerdo', likes: 312,
    hashtags: '#MMA #UFC', created_at: HOUR_AGO(48) },
  { id: 'p-003', autor_id: ID.t_maria, texto: 'Subiendo al podio en Supercross Querétaro.',
    imagen_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800', tipo: 'competencia', likes: 487,
    hashtags: '#motocross', created_at: HOUR_AGO(2) },
  { id: 'p-004', autor_id: ID.t_andres, texto: 'Surfing Puerto Escondido al amanecer.',
    imagen_url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800', tipo: 'competencia', likes: 203,
    hashtags: '#surf', created_at: HOUR_AGO(24) },
  { id: 'p-005', autor_id: ID.t_camila, texto: 'En el Abierto Mexicano.',
    imagen_url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800', tipo: 'competencia', likes: 178,
    hashtags: '#tenis', created_at: HOUR_AGO(72) },
  { id: 'p-006', autor_id: ID.t_renata, texto: 'Día de entrenamiento.',
    imagen_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', tipo: 'general', likes: 86,
    hashtags: '#triathlon', created_at: HOUR_AGO(72) },
];

export const SEED_STAFF: MockStaff[] = [
  { id: 'staff-001', email: 'torres.rivera.axel@gmail.com', password: 'moviendo2026', nombre: 'Carlos Axel Torres',
    rol: 'owner', activo: true, created_at: NOW, last_login_at: null },
  { id: 'staff-002', email: 'marco@moviendoleyendas.com', password: 'admin2026', nombre: 'Marco',
    rol: 'admin', activo: true, created_at: NOW, last_login_at: null },
];

export const SEED_INTEGRACIONES: MockIntegracion[] = [
  { slug: 'railway',     nombre: 'Railway',           config: { api_token: '', project_id: '' },
    activa: false, last_test_at: null, last_test_ok: null, last_test_error: null, updated_at: NOW },
  { slug: 'secureshell', nombre: 'SecureShell (SSH)', config: { host: '', port: 22, user: '', auth_type: 'key', private_key: '', password: '' },
    activa: false, last_test_at: null, last_test_ok: null, last_test_error: null, updated_at: NOW },
  { slug: 'whapi',       nombre: 'Whapi (WhatsApp)',  config: { api_token: '', channel_id: '', base_url: 'https://gate.whapi.cloud' },
    activa: false, last_test_at: null, last_test_ok: null, last_test_error: null, updated_at: NOW },
];

// Re-export tipos para que mockApi pueda construir respuestas equivalentes
export type { MatchRow, MensajeRow, PostVitrinaRow, SessionUserApi };
