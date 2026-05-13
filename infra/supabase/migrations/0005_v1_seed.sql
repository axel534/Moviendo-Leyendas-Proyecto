-- 0005_v1_seed.sql
-- Datos demo para que la plataforma V1 se vea poblada.

-- Talentos extra (ya tenemos 5 de 0003)
insert into talentos (nombre, disciplina, ciudad, edad, bio, foto_url, email, telefono, redes_seguidores, estado, plan, puntuacion) values
  ('Camila Ortega', 'Tenis WTA', 'Monterrey', 21, 'Top 200 ITF, gira sudamericana 2026. Busco marca de raquetas y bebidas.', 'https://i.pravatar.cc/200?img=44', 'camila.ortega@mail.com', '+52 81 7766 5544', 18900, 'aprobado', 'pro', 78),
  ('Joaquín Rivas', 'MMA peso pluma', 'CDMX', 26, 'Récord 12-2. Próxima pelea en UFC contender series.', 'https://i.pravatar.cc/200?img=53', 'joaquin.rivas@mail.com', '+52 55 4433 2211', 32400, 'aprobado', 'premium', 86),
  ('Renata Solano', 'Triatlón', 'Tijuana', 27, 'Clasificada Kona 2025. Busco marcas de nutrición deportiva y wearables.', 'https://i.pravatar.cc/200?img=23', 'renata.solano@mail.com', '+52 664 998 7766', 11500, 'aprobado', 'free', 64);

-- Marcas extra
insert into marcas (nombre, industria, pais, sitio_web, contacto_nombre, contacto_email, presupuesto_mxn, estado, plan, puntuacion) values
  ('Hidra+', 'Bebidas deportivas', 'México', 'https://hidraplus.mx', 'Tania Robles', 't.robles@hidraplus.mx', 350000, 'aprobado', 'pro', 72),
  ('Forge Apparel', 'Ropa deportiva', 'México', 'https://forge.mx', 'Eduardo Cano', 'edu@forge.mx', 220000, 'aprobado', 'pro', 69);

-- Matches mock con razones IA
insert into matches (talento_id, marca_id, porcentaje, razones, estado, iniciado_por)
select
  t.id, m.id, 92,
  '{"razones": ["Misma ciudad: Monterrey", "Atletismo encaja con bebidas deportivas", "Presupuesto cubre expectativas del talento", "Audiencia objetivo similar"]}'::jsonb,
  'solicitado', 'talento'
from talentos t, marcas m
where t.nombre = 'Camila Ortega' and m.nombre = 'Hidra+';

insert into matches (talento_id, marca_id, porcentaje, razones, estado, iniciado_por)
select
  t.id, m.id, 88,
  '{"razones": ["MMA tiene audiencia premium 18-34", "Marca premium busca atletas profesionales", "Presupuesto alto cubre acuerdo anual"]}'::jsonb,
  'conectado', 'marca'
from talentos t, marcas m
where t.nombre = 'Joaquín Rivas' and m.nombre = 'Forge Apparel';

insert into matches (talento_id, marca_id, porcentaje, razones, estado, iniciado_por)
select
  t.id, m.id, 81,
  '{"razones": ["Triatlón y nutrición deportiva alineados", "Audiencia health-conscious", "Atleta con alcance nacional"]}'::jsonb,
  'nuevo', 'marca'
from talentos t, marcas m
where t.nombre = 'Renata Solano' and m.nombre = 'Hidra+';

-- Mensajes mock para el match conectado (Joaquín ↔ Forge)
insert into mensajes (match_id, autor_tipo, texto)
select id, 'marca', 'Hola Joaquín, vimos tu próxima pelea. Nos interesa hacerte propuesta para que uses nuestra ropa en walkout y entrenamientos.'
from matches where porcentaje = 88 limit 1;

insert into mensajes (match_id, autor_tipo, texto)
select id, 'talento', 'Hola Eduardo. Gracias por escribir. Sí me interesa. ¿Qué incluiría la propuesta?'
from matches where porcentaje = 88 limit 1;

insert into mensajes (match_id, autor_tipo, texto)
select id, 'marca', 'Estamos pensando en un acuerdo anual de $180,000 MXN. Incluye ropa de competencia, walkout, entrenamiento y 4 publicaciones mensuales.'
from matches where porcentaje = 88 limit 1;

insert into mensajes (match_id, autor_tipo, texto, tipo_ia)
select id, 'ia', 'Detecté que están cerca de un acuerdo. ¿Quieres que genere un borrador de contrato con los términos discutidos?', 'contrato_sugerido'
from matches where porcentaje = 88 limit 1;

-- Posts vitrina
insert into posts_vitrina (autor_id, texto, imagen_url, tipo, likes, hashtags)
select id, 'Tercer lugar en el campeonato F4. Gracias a todos los que me apoyan. Vamos por más en 2026.', 'https://images.unsplash.com/photo-1541744573515-478c959628a0?w=800', 'logro', 124, '#F4NACAM #karting #moviendoleyendas'
from talentos where nombre = 'Luis Carrasco';

insert into posts_vitrina (autor_id, texto, imagen_url, tipo, likes, hashtags)
select id, 'Cerré acuerdo con Forge Apparel. Empezamos el camino a UFC con todo el respaldo.', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800', 'acuerdo', 312, '#MMA #UFC #patrocinio'
from talentos where nombre = 'Joaquín Rivas';

insert into posts_vitrina (autor_id, texto, imagen_url, tipo, likes, hashtags)
select id, 'Subiendo al podio en Supercross Querétaro. Primera mujer mexicana en este escalón.', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800', 'competencia', 487, '#motocross #mujeresqueinspiran'
from talentos where nombre = 'María del Toro';

insert into posts_vitrina (autor_id, texto, imagen_url, tipo, likes, hashtags)
select id, 'Día de entrenamiento. La constancia gana siempre.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', 'general', 86, '#triathlon #entrenamiento'
from talentos where nombre = 'Renata Solano';

insert into posts_vitrina (autor_id, texto, imagen_url, tipo, likes, hashtags)
select id, 'Surfing Puerto Escondido al amanecer. Selección nacional 2024.', 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800', 'competencia', 203, '#surf #PuertoEscondido'
from talentos where nombre = 'Andrés Vega';

insert into posts_vitrina (autor_id, texto, imagen_url, tipo, likes, hashtags)
select id, 'En el Abierto Mexicano. Apoyo total para llegar al WTA.', 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800', 'competencia', 178, '#tenis #WTA'
from talentos where nombre = 'Camila Ortega';
