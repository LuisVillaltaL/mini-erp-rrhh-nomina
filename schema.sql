-- ============================================================
--  Mini ERP: RRHH + Nómina
--  Base de datos: mini_erp_db
--  Motor: PostgreSQL
--  Autor: Luis Villalta
-- ============================================================

-- Ejecutar desde terminal:
--   psql -U postgres -c "CREATE DATABASE mini_erp_db;"
--   psql -U postgres -d mini_erp_db -f schema.sql

-- ============================================================
-- MÓDULO 1: RECURSOS HUMANOS
-- ============================================================

CREATE TABLE departamentos (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  descripcion   VARCHAR(255),
  presupuesto   NUMERIC(12,2) DEFAULT 0.00,
  activo        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cargos (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  nivel           VARCHAR(20) CHECK (nivel IN ('operativo','administrativo','gerencial')) NOT NULL,
  salario_base    NUMERIC(10,2) NOT NULL,
  departamento_id INT NOT NULL REFERENCES departamentos(id),
  activo          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE empleados (
  id                SERIAL PRIMARY KEY,
  codigo            VARCHAR(20) UNIQUE NOT NULL,
  nombres           VARCHAR(100) NOT NULL,
  apellidos         VARCHAR(100) NOT NULL,
  dpi               VARCHAR(20) UNIQUE,
  fecha_nacimiento  DATE,
  genero            VARCHAR(10) CHECK (genero IN ('M','F','Otro')),
  email             VARCHAR(150) UNIQUE,
  telefono          VARCHAR(20),
  direccion         TEXT,
  departamento_id   INT NOT NULL REFERENCES departamentos(id),
  cargo_id          INT NOT NULL REFERENCES cargos(id),
  fecha_ingreso     DATE NOT NULL,
  tipo_contrato     VARCHAR(20) CHECK (tipo_contrato IN ('indefinido','temporal','por_proyecto')) DEFAULT 'indefinido',
  estado            VARCHAR(20) CHECK (estado IN ('activo','inactivo','suspendido')) DEFAULT 'activo',
  foto_url          VARCHAR(255),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asistencia (
  id               SERIAL PRIMARY KEY,
  empleado_id      INT NOT NULL REFERENCES empleados(id),
  fecha            DATE NOT NULL,
  hora_entrada     TIME,
  hora_salida      TIME,
  tipo             VARCHAR(20) CHECK (tipo IN ('normal','ausencia','permiso','vacacion','feriado')) DEFAULT 'normal',
  observacion      VARCHAR(255),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (empleado_id, fecha)
);

CREATE TABLE evaluaciones_desempeno (
  id            SERIAL PRIMARY KEY,
  empleado_id   INT NOT NULL REFERENCES empleados(id),
  periodo       VARCHAR(7) NOT NULL,
  puntaje       NUMERIC(5,2) NOT NULL CHECK (puntaje BETWEEN 0 AND 100),
  categoria     VARCHAR(20) CHECK (categoria IN ('excelente','bueno','regular','deficiente')) NOT NULL,
  observaciones TEXT,
  evaluador_id  INT REFERENCES empleados(id),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- MÓDULO 2: NÓMINA
-- ============================================================

CREATE TABLE conceptos_nomina (
  id          SERIAL PRIMARY KEY,
  codigo      VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  tipo        VARCHAR(20) CHECK (tipo IN ('ingreso','deduccion')) NOT NULL,
  es_fijo     BOOLEAN DEFAULT FALSE,
  descripcion VARCHAR(255),
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE nominas (
  id                SERIAL PRIMARY KEY,
  periodo           VARCHAR(7) UNIQUE NOT NULL,
  fecha_inicio      DATE NOT NULL,
  fecha_fin         DATE NOT NULL,
  estado            VARCHAR(20) CHECK (estado IN ('borrador','procesada','pagada','anulada')) DEFAULT 'borrador',
  total_ingresos    NUMERIC(14,2) DEFAULT 0.00,
  total_deducciones NUMERIC(14,2) DEFAULT 0.00,
  total_neto        NUMERIC(14,2) DEFAULT 0.00,
  procesado_por     VARCHAR(100),
  fecha_proceso     TIMESTAMP,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_nomina (
  id                SERIAL PRIMARY KEY,
  nomina_id         INT NOT NULL REFERENCES nominas(id),
  empleado_id       INT NOT NULL REFERENCES empleados(id),
  salario_base      NUMERIC(10,2) NOT NULL,
  dias_trabajados   INT DEFAULT 30,
  horas_extra       NUMERIC(5,2) DEFAULT 0,
  total_ingresos    NUMERIC(12,2) DEFAULT 0.00,
  total_deducciones NUMERIC(12,2) DEFAULT 0.00,
  salario_neto      NUMERIC(12,2) DEFAULT 0.00,
  estado            VARCHAR(20) CHECK (estado IN ('pendiente','pagado')) DEFAULT 'pendiente',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (nomina_id, empleado_id)
);

CREATE TABLE movimientos_nomina (
  id                SERIAL PRIMARY KEY,
  detalle_nomina_id INT NOT NULL REFERENCES detalle_nomina(id),
  concepto_id       INT NOT NULL REFERENCES conceptos_nomina(id),
  descripcion       VARCHAR(255),
  monto             NUMERIC(10,2) NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

