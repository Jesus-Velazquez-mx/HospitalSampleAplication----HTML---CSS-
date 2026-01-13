const sql = require('mssql');

const config = {
  user: 'sa',
  password: '123',
  server: 'ASUS10137',
  database: 'MedFlow3',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: 'NUEVOPUBLICADOR'
  }
};

// Función de conexión
async function connect() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error('Error de conexión:', err);
    throw err;
  }
}

// Función para obtener asistentes
async function getAsistentes() {
  try {
    const pool = await connect();
    const result = await pool.request()
      .query(`
        SELECT 
          A.codigo_asistente,
          P.primer_nombre,
          P.apellido_paterno,
          P.apellido_materno,
          P.telefono,
          P.correo_electronico,
          A.horario_inicio,
          A.horario_fin
        FROM ASISTENTES A
        JOIN PERSONAS P ON A.codigo_asistente = P.codigo_persona
        WHERE P.activo = '1'
      `);
    return result.recordset;
  } catch (err) {
    console.error('Error al obtener asistentes:', err);
    throw err;
  }
}

async function getDoctores() {
  try {
    const pool = await connect();
    const result = await pool.request()
      .query(`
        SELECT 
          M.codigo_medico,
          P.primer_nombre,
          P.apellido_paterno,
          P.apellido_materno,
          M.especialidad,
          P.telefono,
          P.correo_electronico,
          M.hora_inicio AS horario_inicio,
          M.hora_fin AS horario_fin
        FROM MEDICOS M
        JOIN PERSONAS P ON M.codigo_medico = P.codigo_persona
        WHERE P.activo = '1'

      `);
    return result.recordset;
  } catch (err) {
    console.error('Error al obtener doctores:', err);  
    throw err;
  }
}

// Función para obtener citas
async function getCitas() {
  try {
    const pool = await connect();
    const result = await pool.request()
      .query(`
        SELECT 
          C.codigo_cita,
          C.fecha_de_cita,
          C.hora_de_cita,
          C.estado_de_cita,
          P.primer_nombre + ' ' + P.apellido_paterno AS nombre_paciente,
          M.primer_nombre + ' ' + M.apellido_paterno AS nombre_medico,
          CON.nombre AS nombre_consultorio,
          S.nombre AS nombre_sucursal
        FROM CITAS C
        JOIN PACIENTES PA ON C.codigo_paciente = PA.codigo_paciente
        JOIN PERSONAS P ON PA.codigo_paciente = P.codigo_persona
        JOIN MEDICOS ME ON C.codigo_medico = ME.codigo_medico
        JOIN PERSONAS M ON ME.codigo_medico = M.codigo_persona
        JOIN CONSULTORIOS CON ON C.codigo_consultorio = CON.codigo_consultorio
        JOIN SUCURSALES S ON CON.codigo_sucursal = S.codigo_sucursal
        ORDER BY C.fecha_de_cita DESC, C.hora_de_cita DESC
      `);
    return result.recordset;
  } catch (err) {
    console.error('Error al obtener citas:', err);
    throw err;
  }
}


// Función para verificar credenciales de usuario
async function verificarCredenciales(username, password) {
  try {
    const pool = await connect();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password)
      .query(`
        SELECT U.codigo_usuario, U.tipo_usuario, P.codigo_persona
        FROM USUARIOS U
        JOIN PERSONAS P ON U.codigo_usuario = P.codigo_usuario
        WHERE U.nombre_usuario = @username 
        AND U.contrasena = @password
        AND U.activo = '1'
      `);
    
    return result.recordset[0] || null;
  } catch (err) {
    console.error('Error al verificar credenciales:', err);
    throw err;
  }
}

module.exports = {
  sql,
  config,
  connect,
  getAsistentes,
  getDoctores,
  verificarCredenciales,
  getCitas
};