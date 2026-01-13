const { connect } = require('./db');

async function initializeDatabase() {
  try {
    const pool = await connect();
    
    // Creación de tablas
    await pool.query(`
      -- Creación de la base de datos
CREATE DATABASE MedFlow2;
GO
USE MedFlow2;

CREATE TABLE USUARIOS (
    codigo_usuario NVARCHAR(5) PRIMARY KEY,
    nombre_usuario NVARCHAR(50) UNIQUE NOT NULL,
    contrasena NVARCHAR(100) NOT NULL,
    tipo_usuario NVARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('admin', 'medico', 'asistente', 'paciente')),
    activo CHAR(1) DEFAULT '1' CHECK (activo IN ('0', '1')),
    CONSTRAINT CHK_codigo_usuario_format CHECK (codigo_usuario LIKE 'US[0-9][0-9][0-9]')
);

-- Tabla PERSONAS
CREATE TABLE PERSONAS (
    codigo_persona NVARCHAR(5) PRIMARY KEY,
    codigo_usuario NVARCHAR(5) UNIQUE NOT NULL,
    primer_nombre NVARCHAR(50) NOT NULL,
    apellido_paterno NVARCHAR(50) NOT NULL,
    apellido_materno NVARCHAR(50),
    telefono NVARCHAR(20),
    calle NVARCHAR(100),
    colonia NVARCHAR(50),
    numero NVARCHAR(10),
    correo_electronico NVARCHAR(50),
    activo CHAR(1) DEFAULT '1' CHECK (activo IN ('0', '1')),
    FOREIGN KEY (codigo_usuario) REFERENCES USUARIOS(codigo_usuario),
    CONSTRAINT CHK_codigo_persona_format CHECK (codigo_persona LIKE '[A-Z][A-Z][0-9][0-9][0-9]'),
    CONSTRAINT CHK_correo_electronico_valido CHECK (correo_electronico LIKE '%_@__%.__%')
);


-- Tabla PACIENTES
CREATE TABLE PACIENTES (
    codigo_paciente NVARCHAR(5) PRIMARY KEY,
    sexo CHAR(1) NOT NULL CHECK (sexo IN ('H', 'M')),
    documento_de_identidad NVARCHAR(20) UNIQUE,
    fecha_de_nacimiento DATE NOT NULL,
    FOREIGN KEY (codigo_paciente) REFERENCES PERSONAS(codigo_persona),
    CONSTRAINT CHK_edad_valida CHECK (DATEDIFF(YEAR, fecha_de_nacimiento, GETDATE()) BETWEEN 0 AND 120),
    CONSTRAINT CHK_codigo_paciente_format CHECK (codigo_paciente LIKE 'PA[0-9][0-9][0-9]')
);

-- Tabla MÉDICOS
CREATE TABLE MEDICOS (
    codigo_medico NVARCHAR(5) PRIMARY KEY,
    cedula_profesional NVARCHAR(20) UNIQUE NOT NULL,
    especialidad NVARCHAR(50),
    hora_inicio TIME,
    hora_fin TIME,
    FOREIGN KEY (codigo_medico) REFERENCES PERSONAS(codigo_persona),
    CONSTRAINT CHK_codigo_medico_format CHECK (codigo_medico LIKE 'ME[0-9][0-9][0-9]'),
);

-- Tabla ASISTENTES 
CREATE TABLE ASISTENTES (
    codigo_asistente NVARCHAR(5) PRIMARY KEY,
    horario_inicio TIME,
    horario_fin TIME,
    FOREIGN KEY (codigo_asistente) REFERENCES PERSONAS(codigo_persona),
    CONSTRAINT CHK_codigo_asistente_format CHECK (codigo_asistente LIKE 'AS[0-9][0-9][0-9]')
);

-- Tabla ADMINISTRADORES 
CREATE TABLE ADMINISTRADORES (
    codigo_administrador NVARCHAR(5) PRIMARY KEY,
    FOREIGN KEY (codigo_administrador) REFERENCES PERSONAS(codigo_persona),
    CONSTRAINT CHK_codigo_admin_format CHECK (codigo_administrador LIKE 'AD[0-9][0-9][0-9]')
);

-- Tabla SUCURSALES
CREATE TABLE SUCURSALES (
    codigo_sucursal NVARCHAR(5) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    calle NVARCHAR(100),
    colonia NVARCHAR(50),
    numero NVARCHAR(10),
    telefono NVARCHAR(20),
    email NVARCHAR(50),
	hora_inicio TIME, 
	hora_fin TIME,
    activo CHAR(1) DEFAULT '1' CHECK (activo IN ('0', '1')),
    CONSTRAINT CHK_codigo_sucursal_format CHECK (codigo_sucursal LIKE 'SU[0-9][0-9][0-9]')
);

-- Tabla CONSULTORIOS
CREATE TABLE CONSULTORIOS (
    codigo_consultorio NVARCHAR(5) PRIMARY KEY,
    nombre NVARCHAR(100),
    rentado CHAR(1) DEFAULT '0' CHECK (rentado IN ('0', '1')),
    activo CHAR(1) DEFAULT '1' CHECK (activo IN ('0', '1')),
    codigo_sucursal NVARCHAR(5) NOT NULL,
    FOREIGN KEY (codigo_sucursal) REFERENCES SUCURSALES(codigo_sucursal),
    CONSTRAINT CHK_codigo_consultorio_format CHECK (codigo_consultorio LIKE 'CO[0-9][0-9][0-9]')
);

-- Tabla ADMINISTRADORES_SUCURSALES (
CREATE TABLE ADMINISTRADORES_SUCURSALES (
    codigo_administrador NVARCHAR(5) NOT NULL,
    codigo_sucursal NVARCHAR(5) NOT NULL,
    PRIMARY KEY (codigo_administrador, codigo_sucursal),
    FOREIGN KEY (codigo_administrador) REFERENCES ADMINISTRADORES(codigo_administrador),
    FOREIGN KEY (codigo_sucursal) REFERENCES SUCURSALES(codigo_sucursal)
);

-- Tabla ASISTENTES_SUCURSALES (
CREATE TABLE ASISTENTES_SUCURSALES (
    codigo_asistente NVARCHAR(5) NOT NULL,
    codigo_sucursal NVARCHAR(5) NOT NULL,
    PRIMARY KEY (codigo_asistente, codigo_sucursal),
    FOREIGN KEY (codigo_asistente) REFERENCES ASISTENTES (codigo_asistente),
    FOREIGN KEY (codigo_sucursal) REFERENCES SUCURSALES(codigo_sucursal)
);

-- Tabla MEDICOS_CONSULTORIOS (relación muchos a muchos)
CREATE TABLE MEDICOS_CONSULTORIOS (
    codigo_medico NVARCHAR(5) NOT NULL,
    codigo_consultorio NVARCHAR(5) NOT NULL,
    fecha DATE ,
    hora_inicio TIME ,
    hora_fin TIME ,
    detalles_uso NVARCHAR(255),
    PRIMARY KEY (codigo_medico, codigo_consultorio, fecha, hora_inicio),
    FOREIGN KEY (codigo_medico) REFERENCES MEDICOS(codigo_medico),
    FOREIGN KEY (codigo_consultorio) REFERENCES CONSULTORIOS(codigo_consultorio),
    CONSTRAINT CHK_horario_valido CHECK (hora_fin > hora_inicio)
);

-- Tabla EXPEDIENTES
CREATE TABLE EXPEDIENTES (
    codigo_expediente NVARCHAR(5) PRIMARY KEY,
    codigo_paciente NVARCHAR(5) NOT NULL,
    fecha_creacion DATE DEFAULT GETDATE(),
    ultima_actualizacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (codigo_paciente) REFERENCES PACIENTES(codigo_paciente),
    CONSTRAINT CHK_codigo_expediente_format CHECK (codigo_expediente LIKE 'EX[0-9][0-9][0-9]')
);

-- Tabla CITAS
CREATE TABLE CITAS (
    codigo_cita NVARCHAR(5) PRIMARY KEY,
    fecha_de_cita DATE NOT NULL,
    hora_de_cita TIME NOT NULL,
    estado_de_cita NVARCHAR(20) DEFAULT 'programada' CHECK (estado_de_cita IN ('programada', 'confirmada', 'completada', 'cancelada', 'no_asistio')),
    codigo_paciente NVARCHAR(5) NOT NULL,
    codigo_asistente NVARCHAR(5),
    codigo_medico NVARCHAR(5) NOT NULL,
    codigo_consultorio NVARCHAR(5) NOT NULL,
    FOREIGN KEY (codigo_paciente) REFERENCES PACIENTES(codigo_paciente),
    FOREIGN KEY (codigo_asistente) REFERENCES ASISTENTES(codigo_asistente),
    FOREIGN KEY (codigo_medico) REFERENCES MEDICOS(codigo_medico),
    FOREIGN KEY (codigo_consultorio) REFERENCES CONSULTORIOS(codigo_consultorio),
    CONSTRAINT CHK_codigo_cita_format CHECK (codigo_cita LIKE 'CI[0-9][0-9][0-9]'),
    CONSTRAINT CHK_fecha_cita_futura CHECK (CAST(fecha_de_cita AS DATETIME) + CAST(hora_de_cita AS DATETIME) >= GETDATE())
);

-- Tabla CONSULTAS
CREATE TABLE CONSULTAS (
    codigo_consulta NVARCHAR(5) PRIMARY KEY,
    sintomas_actuales NVARCHAR(500),
    observaciones NVARCHAR(500),
    tratamiento NVARCHAR(500),
    codigo_cita NVARCHAR(5) NOT NULL,
    codigo_medico NVARCHAR(5) NOT NULL,
    codigo_consultorio NVARCHAR(5) NOT NULL,
    FOREIGN KEY (codigo_cita) REFERENCES CITAS(codigo_cita),
    FOREIGN KEY (codigo_medico) REFERENCES MEDICOS(codigo_medico),
    FOREIGN KEY (codigo_consultorio) REFERENCES CONSULTORIOS(codigo_consultorio),
    CONSTRAINT CHK_codigo_consulta_format CHECK (codigo_consulta LIKE 'CN[0-9][0-9][0-9]')
);

-- Tabla HISTORIALES_MEDICOS
CREATE TABLE HISTORIALES_MEDICOS (
    codigo_historial NVARCHAR(5) PRIMARY KEY,
    codigo_expediente NVARCHAR(5) NOT NULL,
    codigo_consulta NVARCHAR(5),
    fecha_creacion DATETIME DEFAULT GETDATE(),
    medicamentos_actuales NVARCHAR(500),
    enfermedades_pasadas NVARCHAR(500),
    alergias NVARCHAR(500),
    cirugias NVARCHAR(500),
    antecedentes_medicos NVARCHAR(500),
    antecedentes_familiares NVARCHAR(500),
    antecedentes_sociales NVARCHAR(500),
    observaciones NVARCHAR(1000),
    FOREIGN KEY (codigo_expediente) REFERENCES EXPEDIENTES(codigo_expediente),
    FOREIGN KEY (codigo_consulta) REFERENCES CONSULTAS(codigo_consulta),
    CONSTRAINT CHK_codigo_historial_format CHECK (codigo_historial LIKE 'HM[0-9][0-9][0-9]')
);

-- Tabla RECETAS
CREATE TABLE RECETAS (
    codigo_receta NVARCHAR(5) PRIMARY KEY,
    detalles NVARCHAR(500),
    fecha DATE DEFAULT GETDATE(),
    medicamentos NVARCHAR(500),
    codigo_consulta NVARCHAR(5) NOT NULL,
    codigo_medico NVARCHAR(5) NOT NULL,
    FOREIGN KEY (codigo_consulta) REFERENCES CONSULTAS(codigo_consulta),
    FOREIGN KEY (codigo_medico) REFERENCES MEDICOS(codigo_medico),
    CONSTRAINT CHK_codigo_receta_format CHECK (codigo_receta LIKE 'RE[0-9][0-9][0-9]'),
    CONSTRAINT CHK_fecha_receta_valida CHECK (fecha <= GETDATE())
);

-- Tabla PAGOS
CREATE TABLE PAGOS (
    codigo_pago NVARCHAR(5) PRIMARY KEY,
    metodo_pago NVARCHAR(50) NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Tarjeta crédito', 'Tarjeta débito', 'Transferencia', 'Cheque')),
    monto_total MONEY NOT NULL CHECK (monto_total > 0),
    fecha_pago DATETIME DEFAULT GETDATE(),
    estado NVARCHAR(20) DEFAULT 'completado' CHECK (estado IN ('pendiente', 'completado', 'reembolsado', 'cancelado')),
    codigo_cita NVARCHAR(5) NOT NULL,
    FOREIGN KEY (codigo_cita) REFERENCES CITAS(codigo_cita),
    CONSTRAINT CHK_codigo_pago_format CHECK (codigo_pago LIKE 'PG[0-9][0-9][0-9]')
);

-- Tabla CANCELACIONES
CREATE TABLE CANCELACIONES (
    codigo_cancelacion NVARCHAR(5) PRIMARY KEY,
    fecha_cancelacion DATETIME DEFAULT GETDATE(),
    motivo NVARCHAR(500),
    codigo_pago NVARCHAR(5) NOT NULL,
    FOREIGN KEY (codigo_pago) REFERENCES PAGOS(codigo_pago),
    CONSTRAINT CHK_codigo_cancelacion_format CHECK (codigo_cancelacion LIKE 'CA[0-9][0-9][0-9]'),
    CONSTRAINT CHK_fecha_cancelacion_valida CHECK (fecha_cancelacion <= GETDATE())
);

-- Tabla REEMBOLSOS
CREATE TABLE REEMBOLSOS (
    codigo_reembolso NVARCHAR(5) PRIMARY KEY,
    fecha_reembolso DATETIME DEFAULT GETDATE(),
    monto MONEY NOT NULL CHECK (monto > 0),
    codigo_cancelacion NVARCHAR(5) NOT NULL,
    FOREIGN KEY (codigo_cancelacion) REFERENCES CANCELACIONES(codigo_cancelacion),
    CONSTRAINT CHK_codigo_reembolso_format CHECK (codigo_reembolso LIKE 'RB[0-9][0-9][0-9]'),
    CONSTRAINT CHK_fecha_reembolso_valida CHECK (fecha_reembolso <= GETDATE())
);

    `);
    
    // Continúa con el resto de tus tablas...
    
    console.log('Base de datos inicializada correctamente');
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
  } finally {
    sql.close();
  }
}

initializeDatabase();