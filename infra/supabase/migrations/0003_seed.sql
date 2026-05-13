-- 0003_seed.sql
-- Datos de prueba para que el panel admin se vea poblado.
-- Borrar/limpiar antes de producción.

insert into talentos (nombre, disciplina, ciudad, edad, bio, foto_url, email, telefono, redes_seguidores, estado) values
  ('Diego Hernández', 'Karting - Categoría Junior', 'Querétaro', 16, 'Piloto de karting, 3 años compitiendo en NACAM. Busco patrocinio para temporada 2026.', 'https://i.pravatar.cc/200?img=12', 'diego.hernandez@mail.com', '+52 442 111 2233', 3200, 'pendiente'),
  ('Sofía Ramírez', 'Atletismo - 400m vallas', 'CDMX', 22, 'Atleta universitaria, top 5 nacional. Universidad Anáhuac.', 'https://i.pravatar.cc/200?img=47', 'sofia.ramirez@mail.com', '+52 55 9988 7766', 8400, 'pendiente'),
  ('Luis Carrasco', 'F4 NACAM', 'Monterrey', 19, 'Tercer lugar campeonato F4 2025. Salto a F3 en 2026 si consigo respaldo.', 'https://i.pravatar.cc/200?img=33', 'luis.carrasco@mail.com', '+52 81 5544 3322', 14200, 'pendiente'),
  ('María del Toro', 'Motocross', 'Guadalajara', 24, 'Primera mujer mexicana en podio AMA Supercross categoría amateur.', 'https://i.pravatar.cc/200?img=49', 'maria.deltoro@mail.com', '+52 33 1122 3344', 22500, 'aprobado'),
  ('Andrés Vega', 'Surf', 'Puerto Escondido', 20, 'Selección nacional 2024. Busco marcas de bebidas y ropa.', 'https://i.pravatar.cc/200?img=15', 'andres.vega@mail.com', '+52 954 778 8899', 5600, 'pendiente');

insert into marcas (nombre, industria, pais, sitio_web, contacto_nombre, contacto_email, presupuesto_mxn, estado) values
  ('Bebidas Salinas', 'Bebidas energéticas', 'México', 'https://bebidassalinas.mx', 'Carolina Ponce', 'carolina@bebidassalinas.mx', 250000, 'pendiente'),
  ('TaqueríasMX', 'Restaurantes', 'México', 'https://taqueriasmx.com', 'Roberto Linares', 'roberto@taqueriasmx.com', 80000, 'pendiente'),
  ('Aceros del Norte', 'Industrial / Construcción', 'México', 'https://acerosdelnorte.com', 'Patricia Olmos', 'p.olmos@acerosdelnorte.com', 500000, 'pendiente'),
  ('Banco Vértice', 'Servicios financieros', 'México', 'https://bancovertice.mx', 'Diego Ferrer', 'diego.ferrer@bancovertice.mx', 1200000, 'aprobado'),
  ('Llantas RC', 'Automotriz', 'México', 'https://llantasrc.mx', 'Karla Méndez', 'karla@llantasrc.mx', 180000, 'pendiente');
