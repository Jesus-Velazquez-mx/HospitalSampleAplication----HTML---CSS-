const express = require('express');
const cors = require('cors');
const { getAsistentes, getDoctores, getCitas, verificarCredenciales, connect, sql } = require('./database'); 
const altaController = require('./altaController');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas para altas
app.post('/api/alta/sucursal', altaController.altaSucursal);
app.post('/api/alta/consultorio', altaController.altaConsultorio);
app.post('/api/alta/asistente', altaController.altaAsistente);
app.post('/api/alta/doctor', altaController.altaDoctor);

// Ruta para registro de pacientes
app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, apellidos, correo, telefono, password } = req.body;
    const pool = await connect();

    // Iniciar transacción
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Obtener el último código de usuario
      const lastUser = await transaction.request()
        .query("SELECT TOP 1 codigo_usuario FROM USUARIOS ORDER BY codigo_usuario DESC");
      
      let nextUserCode = 'US001'; // Código por defecto si no hay usuarios
      if (lastUser.recordset.length > 0) {
        const lastCode = lastUser.recordset[0].codigo_usuario;
        const num = parseInt(lastCode.substring(2)) + 1;
        nextUserCode = 'US' + num.toString().padStart(3, '0');
      }

      // 2. Obtener el último código de persona (paciente)
      const lastPerson = await transaction.request()
        .query("SELECT TOP 1 codigo_persona FROM PERSONAS ORDER BY codigo_persona DESC");
      
      let nextPersonCode = 'PA001'; // Código por defecto si no hay pacientes
      if (lastPerson.recordset.length > 0) {
        const lastCode = lastPerson.recordset[0].codigo_persona;
        const num = parseInt(lastCode.substring(2)) + 1;
        nextPersonCode = 'PA' + num.toString().padStart(3, '0');
      }

      // 3. Insertar en USUARIOS
      await transaction.request()
        .input('codigo', sql.NVarChar, nextUserCode)
        .input('username', sql.NVarChar, correo)
        .input('password', sql.NVarChar, password)
        .input('tipo', sql.NVarChar, 'paciente')
        .query(`
          INSERT INTO USUARIOS (codigo_usuario, nombre_usuario, contrasena, tipo_usuario, activo)
          VALUES (@codigo, @username, @password, @tipo, '1')
        `);

      // 4. Insertar en PERSONAS
      const apellidosArray = apellidos.split(' ');
      const apellidoPaterno = apellidosArray[0] || '';
      const apellidoMaterno = apellidosArray[1] || '';

      await transaction.request()
        .input('codigo_persona', sql.NVarChar, nextPersonCode)
        .input('codigo_usuario', sql.NVarChar, nextUserCode)
        .input('nombre', sql.NVarChar, nombre)
        .input('apellidoPaterno', sql.NVarChar, apellidoPaterno)
        .input('apellidoMaterno', sql.NVarChar, apellidoMaterno)
        .input('telefono', sql.NVarChar, telefono)
        .input('correo', sql.NVarChar, correo)
        .query(`
          INSERT INTO PERSONAS (
            codigo_persona, codigo_usuario, primer_nombre, 
            apellido_paterno, apellido_materno, telefono, correo_electronico, activo
          )
          VALUES (
            @codigo_persona, @codigo_usuario, @nombre, 
            @apellidoPaterno, @apellidoMaterno, @telefono, @correo, '1'
          )
        `);

      // 5. Insertar en PACIENTES (con datos básicos)
      await transaction.request()
        .input('codigo_paciente', sql.NVarChar, nextPersonCode)
        .input('sexo', sql.Char, 'M') // Por defecto, podría pedirlo en el formulario
        .input('documento', sql.NVarChar, 'POR DEFINIR')
        .input('fecha_nac', sql.Date, new Date('1990-01-01')) // Por defecto, podría pedirlo en el formulario
        .query(`
          INSERT INTO PACIENTES (codigo_paciente, sexo, documento_de_identidad, fecha_de_nacimiento)
          VALUES (@codigo_paciente, @sexo, @documento, @fecha_nac)
        `);

      // 6. Crear expediente para el paciente
      const lastExpediente = await transaction.request()
        .query("SELECT TOP 1 codigo_expediente FROM EXPEDIENTES ORDER BY codigo_expediente DESC");
      
      let nextExpedienteCode = 'EX001';
      if (lastExpediente.recordset.length > 0) {
        const lastCode = lastExpediente.recordset[0].codigo_expediente;
        const num = parseInt(lastCode.substring(2)) + 1;
        nextExpedienteCode = 'EX' + num.toString().padStart(3, '0');
      }

      await transaction.request()
        .input('codigo_expediente', sql.NVarChar, nextExpedienteCode)
        .input('codigo_paciente', sql.NVarChar, nextPersonCode)
        .query(`
          INSERT INTO EXPEDIENTES (codigo_expediente, codigo_paciente)
          VALUES (@codigo_expediente, @codigo_paciente)
        `);

      await transaction.commit();

      res.json({ 
        success: true,
        message: 'Registro exitoso',
        user: {
          codigo: nextUserCode,
          tipo: 'paciente'
        }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: error.message || 'Error en el registro' });
  }
});


// Nueva ruta para login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { verificarCredenciales } = require('./database');
    
    const usuario = await verificarCredenciales(username, password);
    
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    
    res.json({ 
      success: true,
      user: {
        codigo: usuario.codigo_usuario,
        tipo: usuario.tipo_usuario,
        codigo_persona: usuario.codigo_persona
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

  // Modificar rutas existentes para verificar autenticación
const verificarAutenticacion = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  // Aquí iría la lógica para verificar el token JWT en producción
  next();
};

// Ruta para obtener asistentes
app.get('/api/asistentes', async (req, res) => {
    try {
        const asistentes = await getAsistentes();
        res.json(asistentes);
    } catch (error) {
        console.error('Error al obtener asistentes:', error);
        res.status(500).json({ error: 'Error al obtener asistentes' });
    }
});

// Ruta para eliminar asistentes
app.delete('/api/asistentes/:codigo', async (req, res) => {
  try {
    const pool = await connect();
    const result = await pool.request()
      .input('codigo', sql.NVarChar, req.params.codigo)
      .query('UPDATE PERSONAS SET activo = \'0\' WHERE codigo_persona = @codigo');
    
    res.json({ success: true, message: 'Asistente desactivado correctamente' });
  } catch (error) {
    console.error('Error al desactivar asistente:', error);
    res.status(500).json({ error: 'Error interno al desactivar el asistente' });
  }
});


// Ruta para obtener doctores
app.get('/api/doctores', async (req, res) => {
    try {
        const doctores = await getDoctores();
        res.json(doctores);
    } catch (error) {
        console.error('Error al obtener doctores:', error);
        res.status(500).json({ error: 'Error al obtener doctores' });
    }
});

// Ruta para eliminar doctores
app.delete('/api/doctores/:codigo', async (req, res) => {
  try {
    const pool = await connect();
    const result = await pool.request()
      .input('codigo', sql.NVarChar, req.params.codigo)
      .query('UPDATE PERSONAS SET activo = \'0\' WHERE codigo_persona = @codigo');

    res.json({ success: true, message: 'Doctor desactivado correctamente' });
  } catch (error) {
    console.error('Error al desactivar doctor:', error);
    res.status(500).json({ error: 'Error interno al desactivar el doctor' });
  }
});


// Ruta para obtener citas de un paciente específico
app.get('/api/citas/:codigoAsistente', async (req, res) => {
  try {
    const pool = await connect();
    const result = await pool.request()
      .input('codigoAsistente', sql.NVarChar, req.params.codigoAsistente)
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
        WHERE PA.codigo_paciente = @codigoAsistente
        ORDER BY C.fecha_de_cita DESC, C.hora_de_cita DESC
      `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// Ruta para cancelar citas
app.post('/api/citas/cancelar', async (req, res) => {
    try {
        const { citaId, razon, password } = req.body;
        
        // Verificar contraseña (puedes implementar tu propia lógica)
        if (password !== '123') { // Cambia esto por tu validación real
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }
        
        const pool = await connect();
        
        // Actualizar estado de la cita
        await pool.request()
            .input('codigoCita', sql.NVarChar, citaId)
            .query(`
                UPDATE CITAS 
                SET estado_de_cita = 'cancelada' 
                WHERE codigo_cita = @codigoCita
            `, { razon });
        
        res.json({ success: true, message: 'Cita cancelada exitosamente' });
    } catch (error) {
        console.error('Error al cancelar cita:', error);
        res.status(500).json({ error: 'Error al cancelar la cita' });
    }
});

// Ruta para obtener el expediente de un paciente específico
app.get('/api/expediente/:codigoAsistente', async (req, res) => {
  try {
    const pool = await connect();
    const result = await pool.request()
      .input('codigoAsistente', sql.NVarChar, req.params.codigoAsistente)
      .query(`
        SELECT 
          HM.codigo_historial,
          E.fecha_creacion,
          E.ultima_actualizacion AS fecha_modificacion,
          HM.medicamentos_actuales,
          HM.enfermedades_pasadas,
          HM.alergias,
          HM.cirugias,
          HM.antecedentes_medicos,
          HM.antecedentes_familiares,
          HM.antecedentes_sociales,
          HM.observaciones
        FROM HISTORIALES_MEDICOS HM
        JOIN EXPEDIENTES E ON HM.codigo_expediente = E.codigo_expediente
        INNER JOIN PACIENTES P ON E.codigo_paciente = P.codigo_paciente
        WHERE P.codigo_paciente = @codigoAsistente
        ORDER BY HM.fecha_creacion DESC
      `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener expediente:', error);
    res.status(500).json({ error: 'Error al obtener el expediente' });
  }
});

// Ruta para obtener recetas de un paciente específico
app.get('/api/recetas/:codigoAsistente', async (req, res) => {
  try {
    const pool = await connect();
    const result = await pool.request()
      .input('codigoAsistente', sql.NVarChar, req.params.codigoAsistente)
      .query(`
                SELECT 
            R.codigo_receta,
            R.fecha AS fecha_receta,
            R.detalles,
            P.primer_nombre + ' ' + P.apellido_paterno AS nombre_paciente,
            M.primer_nombre + ' ' + M.apellido_paterno AS nombre_medico,
            ME.especialidad,
            C.codigo_consulta,
            R.medicamentos
        FROM 
            RECETAS R
        INNER JOIN MEDICOS ME ON R.codigo_medico = ME.codigo_medico
        INNER JOIN PERSONAS M ON ME.codigo_medico = M.codigo_persona
        INNER JOIN CONSULTAS C ON R.codigo_consulta = C.codigo_consulta
        INNER JOIN CITAS CI ON C.codigo_cita = CI.codigo_cita
        INNER JOIN PACIENTES PA ON CI.codigo_paciente = PA.codigo_paciente
        INNER JOIN PERSONAS P ON PA.codigo_paciente = P.codigo_persona
        WHERE CI.codigo_paciente = @codigoAsistente
        ORDER BY R.fecha DESC;
      `);
    
    // Procesar los datos para que sean más fáciles de usar en el frontend
    const recetas = result.recordset.map(receta => {
      // Procesar medicamentos si existen
      let medicamentos = [];
      if (receta.medicamentos) {
        medicamentos = receta.medicamentos.split(', ').map(med => {
          const parts = med.split(' - ');
          return {
            nombre: parts[0],
            dosis: parts[1],
            frecuencia: parts[2],
            duracion: parts[3]
          };
        });
      }
      
      return {
        ...receta,
        medicamentos,
        consulta_relacionada: receta.consulta_relacionada ? 
          formatDate(receta.consulta_relacionada) : 'No relacionada a cita'
      };
    });
    
    res.json(recetas);
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    res.status(500).json({ error: 'Error al obtener las recetas' });
  }
});

// Función auxiliar para formatear fechas
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
}

// Para obtener citas de un médico específico
app.get('/api/citas/medico/:codigoAsistente', async (req, res) => {
    try {
        const pool = await connect();
        const result = await pool.request()
            .input('codigoAsistente', sql.NVarChar, req.params.codigoAsistente)
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
              WHERE ME.codigo_medico = @codigoAsistente
              ORDER BY C.fecha_de_cita DESC, C.hora_de_cita DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener citas del médico:', error);
        res.status(500).json({ error: 'Error al obtener las citas del médico' });
    }
});

// Ruta para obtener recetas de un médico específico
app.get('/api/recetas/medico/:codigoAsistente', async (req, res) => {
  try {
    const pool = await connect();
    const result = await pool.request()
      .input('codigoAsistente', sql.NVarChar, req.params.codigoAsistente)
      .query(`
                SELECT 
            R.codigo_receta,
            R.fecha AS fecha_receta,
            R.detalles,
            P.primer_nombre + ' ' + P.apellido_paterno AS nombre_paciente,
            M.primer_nombre + ' ' + M.apellido_paterno AS nombre_medico,
            ME.especialidad,
            C.codigo_consulta,
            R.medicamentos
        FROM 
            RECETAS R
        INNER JOIN MEDICOS ME ON R.codigo_medico = ME.codigo_medico
        INNER JOIN PERSONAS M ON ME.codigo_medico = M.codigo_persona
        INNER JOIN CONSULTAS C ON R.codigo_consulta = C.codigo_consulta
        INNER JOIN CITAS CI ON C.codigo_cita = CI.codigo_cita
        INNER JOIN PACIENTES PA ON CI.codigo_paciente = PA.codigo_paciente
        INNER JOIN PERSONAS P ON PA.codigo_paciente = P.codigo_persona
        WHERE ME.codigo_medico = @codigoAsistente
        ORDER BY R.fecha DESC;
      `);
    
    // Procesar los datos para que sean más fáciles de usar en el frontend
    const recetas = result.recordset.map(receta => {
      // Procesar medicamentos si existen
      let medicamentos = [];
      if (receta.medicamentos) {
        medicamentos = receta.medicamentos.split(', ').map(med => {
          const parts = med.split(' - ');
          return {
            nombre: parts[0],
            dosis: parts[1],
            frecuencia: parts[2],
            duracion: parts[3]
          };
        });
      }
      
      return {
        ...receta,
        medicamentos,
        consulta_relacionada: receta.consulta_relacionada ? 
          formatDate(receta.consulta_relacionada) : 'No relacionada a cita'
      };
    });
    
    res.json(recetas);
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    res.status(500).json({ error: 'Error al obtener las recetas' });
  }
});

// Para obtener citas de un asistente específico
// Ruta para ver citas por asistente (incluso con paciente nulo)
app.get('/api/citas/asistente/:codigoAsistente', async (req, res) => {
  try {
    const { codigoAsistente } = req.params;
    const pool = await connect();

    const result = await pool.request()
      .input('codigoAsistente', sql.NVarChar, codigoAsistente)
      .query(`
            SELECT 
  C.codigo_cita,
  C.fecha_de_cita,
  C.hora_de_cita,
  C.estado_de_cita,
  ISNULL(P.primer_nombre + ' ' + P.apellido_paterno, 'Sin paciente') AS nombre_paciente,
  M.primer_nombre + ' ' + M.apellido_paterno AS nombre_medico,
  CON.nombre AS nombre_consultorio,
  S.nombre AS nombre_sucursal
FROM CITAS C
LEFT JOIN PACIENTES PA ON C.codigo_paciente = PA.codigo_paciente
LEFT JOIN PERSONAS P ON PA.codigo_paciente = P.codigo_persona
JOIN MEDICOS ME ON C.codigo_medico = ME.codigo_medico
JOIN PERSONAS M ON ME.codigo_medico = M.codigo_persona
JOIN CONSULTORIOS CON ON C.codigo_consultorio = CON.codigo_consultorio
JOIN SUCURSALES S ON CON.codigo_sucursal = S.codigo_sucursal
JOIN ASISTENTES A ON C.codigo_asistente = A.codigo_asistente
WHERE A.codigo_asistente = 'AS001'
ORDER BY C.fecha_de_cita DESC, C.hora_de_cita DESC;

      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener citas del asistente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Obtener sucursales
app.get('/api/sucursales', async (req, res) => {
    try {
        const pool = await connect();
        const result = await pool.request()
            .query('SELECT codigo_sucursal, nombre FROM SUCURSALES WHERE activo = \'1\'');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener sucursales:', error);
        res.status(500).json({ error: 'Error al obtener sucursales' });
    }
});

app.post('/api/consultas/nueva', async (req, res) => {
  try {
    const { codigoCita, codigoMedico, nombrePaciente } = req.body;
    
    // Validación más robusta
    if (!codigoCita || !codigoMedico || !nombrePaciente) {
      return res.status(400).json({ 
        success: false,
        error: 'Datos incompletos',
        message: 'Se requieren: codigoCita, codigoMedico y nombrePaciente'
      });
    }

    const pool = await connect();
    
    // 1. Verificar que la cita existe y obtener datos adicionales
    const citaQuery = `
        SELECT 
      C.codigo_paciente, 
      C.codigo_consultorio,
      P.primer_nombre + ' ' + P.apellido_paterno AS nombrePaciente,
      C.estado_de_cita
      FROM CITAS C
      JOIN PACIENTES PA ON C.codigo_paciente = PA.codigo_paciente
      JOIN PERSONAS P ON PA.codigo_paciente = P.codigo_persona
      WHERE C.codigo_cita = @codigoCita
    `;
    
    const citaResult = await pool.request()
      .input('codigoCita', sql.NVarChar, codigoCita)
      .query(citaQuery);

    if (citaResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada',
        message: 'La cita especificada no existe'
      });
    }

    const citaData = citaResult.recordset[0];
    
    // 2. Verificar que la cita no esté cancelada
    if (citaData.estado_de_cita.toLowerCase() === 'cancelada') {
      return res.status(400).json({
        success: false,
        error: 'Cita cancelada',
        message: 'No se puede iniciar consulta para una cita cancelada'
      });
    }

    // 3. Generar código de consulta (usando CN formato)
    // Obtener el último código de consulta correctamente ordenado
const result = await pool.request().query(`
  SELECT TOP 1 codigo_consulta
  FROM CONSULTAS
  WHERE ISNUMERIC(SUBSTRING(codigo_consulta, 3, LEN(codigo_consulta))) = 1
  ORDER BY CAST(SUBSTRING(codigo_consulta, 3, LEN(codigo_consulta)) AS INT) DESC
`);

let nextConsultaCode = 'CN001';

if (result.recordset.length > 0) {
  const lastCode = result.recordset[0].codigo_consulta; // e.g. "CN007"
  const num = parseInt(lastCode.substring(2)) + 1;
  nextConsultaCode = 'CN' + String(num).padStart(3, '0');
}


    // 4. Crear la consulta con todos los campos requeridos
    await pool.request()
      .input('codigoConsulta', sql.NVarChar, nextConsultaCode)
      .input('codigoCita', sql.NVarChar, codigoCita)
      .input('codigoMedico', sql.NVarChar, codigoMedico)
      .input('codigoConsultorio', sql.NVarChar, citaData.codigo_consultorio)
      .query(`
          INSERT INTO CONSULTAS (
        codigo_consulta,
        sintomas_actuales,
        observaciones,
        tratamiento,
        codigo_cita,
        codigo_medico,
        codigo_consultorio
      ) VALUES (
        @codigoConsulta,

        '',  -- sintomas_actuales vacío inicialmente
        '',  -- observaciones vacío inicialmente
        '',   -- tratamiento vacío inicialmente
        @codigoCita,
        @codigoMedico,
        @codigoConsultorio
    )
      `);

      res.json({ 
      success: true,
      codigoConsulta: nextConsultaCode,
      codigoPaciente: citaData.codigo_paciente,
      nombrePaciente: citaData.nombrePaciente, // actualizado aquí
      message: 'Consulta iniciada correctamente'
    });


  } catch (error) {
    console.error('Error en /api/consultas/nueva:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});
// Ruta para guardar el historial médico
app.post('/api/historial/guardar', async (req, res) => {
  try {
    const { 
      codigoPaciente, 
      codigoConsulta,
      medicamentos, 
      enfermedades, 
      alergias, 
      cirugias, 
      antecedentes,
      familiares,
      sociales,
      observaciones 
    } = req.body;

    const pool = await connect();

    // 1. Obtener el código de expediente del paciente
    const expediente = await pool.request()
      .input('codigoPaciente', sql.NVarChar, codigoPaciente)
      .query('SELECT codigo_expediente FROM EXPEDIENTES WHERE codigo_paciente = @codigoPaciente');

    if (expediente.recordset.length === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    const codigoExpediente = expediente.recordset[0].codigo_expediente;

    // 2. Crear código para el nuevo historial
    const lastHistorial = await pool.request()
      .query("SELECT TOP 1 codigo_historial FROM HISTORIALES_MEDICOS ORDER BY codigo_historial DESC");
    
    let nextHistorialCode = 'HM001';
    if (lastHistorial.recordset.length > 0) {
      const lastCode = lastHistorial.recordset[0].codigo_historial;
      const num = parseInt(lastCode.substring(2)) + 1;
      nextHistorialCode = 'HM' + num.toString().padStart(3, '0');
    }

    // 3. Insertar el historial médico
    await pool.request()
      .input('codigoHistorial', sql.NVarChar, nextHistorialCode)
      .input('codigoExpediente', sql.NVarChar, codigoExpediente)
      .input('codigoConsulta', sql.NVarChar, codigoConsulta)
      .input('medicamentos', sql.NVarChar, medicamentos)
      .input('enfermedades', sql.NVarChar, enfermedades)
      .input('alergias', sql.NVarChar, alergias)
      .input('cirugias', sql.NVarChar, cirugias)
      .input('antecedentes', sql.NVarChar, antecedentes)
      .input('familiares', sql.NVarChar, familiares)
      .input('sociales', sql.NVarChar, sociales)
      .input('observaciones', sql.NVarChar, observaciones)
      .query(`
        INSERT INTO HISTORIALES_MEDICOS (
          codigo_historial, codigo_expediente, codigo_consulta,
          medicamentos_actuales, enfermedades_pasadas, alergias,
          cirugias, antecedentes_medicos, antecedentes_familiares,
          antecedentes_sociales, observaciones, fecha_creacion
        )
        VALUES (
          @codigoHistorial, @codigoExpediente, @codigoConsulta,
          @medicamentos, @enfermedades, @alergias,
          @cirugias, @antecedentes, @familiares,
          @sociales, @observaciones, GETDATE()
        )
      `);
        // 4. Marcar la cita como completada
      await pool.request()
        .input('codigoConsulta', sql.NVarChar, codigoConsulta)
        .query(`
          UPDATE CITAS
          SET estado_de_cita = 'completada'
          WHERE codigo_cita = (
            SELECT codigo_cita FROM CONSULTAS WHERE codigo_consulta = @codigoConsulta
    )
  `);

    res.json({ success: true });
  } catch (error) {
    console.error('Error al guardar historial:', error);
    res.status(500).json({ error: 'Error al guardar el historial médico' });
  }
});

// Ruta para obtener consultorios disponibles para un doctor agrupados por sucursal
app.get('/api/consultorios-disponibles/:codigoDoctor', async (req, res) => {
  try {
    const pool = await connect();
    const result = await pool.request()
      .input('codigoDoctor', sql.NVarChar, req.params.codigoDoctor)
      .query(`
        SELECT 
          C.codigo_consultorio, 
          C.nombre AS nombre_consultorio,
          S.codigo_sucursal,
          S.nombre AS nombre_sucursal
        FROM CONSULTORIOS C
        JOIN SUCURSALES S ON C.codigo_sucursal = S.codigo_sucursal
        LEFT JOIN MEDICOS_CONSULTORIOS MC ON C.codigo_consultorio = MC.codigo_consultorio
        ORDER BY S.nombre, C.nombre
      `);
    
    // Agrupar por sucursal
    const consultoriosPorSucursal = {};
    result.recordset.forEach(consultorio => {
      if (!consultoriosPorSucursal[consultorio.codigo_sucursal]) {
        consultoriosPorSucursal[consultorio.codigo_sucursal] = {
          nombre_sucursal: consultorio.nombre_sucursal,
          consultorios: []
        };
      }
      consultoriosPorSucursal[consultorio.codigo_sucursal].consultorios.push({
        codigo: consultorio.codigo_consultorio,
        nombre: consultorio.nombre_consultorio
      });
    });
    
    res.json(consultoriosPorSucursal);
  } catch (error) {
    console.error('Error al obtener consultorios:', error);
    res.status(500).json({ error: 'Error al obtener consultorios' });
  }
});
// Ruta para asignar horario a doctor
app.post('/api/asignar-horario', async (req, res) => {
  try {
    const { codigoDoctor, codigoConsultorio, fecha, horaInicio, horaFin } = req.body;
    
    const pool = await connect();
    
    // Verificar si ya existe una asignación
    const existeAsignacion = await pool.request()
      .input('codigoDoctor', sql.NVarChar, codigoDoctor)
      .input('codigoConsultorio', sql.NVarChar, codigoConsultorio)
      .query('SELECT 1 FROM MEDICOS_CONSULTORIOS WHERE codigo_medico = @codigoDoctor AND codigo_consultorio = @codigoConsultorio');
    
    if (existeAsignacion.recordset.length > 0) {
      return res.status(400).json({ error: 'Este doctor ya está asignado a este consultorio' });
    }
    
    // Insertar nueva asignación
    await pool.request()
      .input('codigoDoctor', sql.NVarChar, codigoDoctor)
      .input('codigoConsultorio', sql.NVarChar, codigoConsultorio)
      .input('fecha', sql.Date, fecha)
      .input('horaInicio', sql.VarChar, horaInicio)
      .input('horaFin', sql.VarChar, horaFin)


      .query(`
        INSERT INTO MEDICOS_CONSULTORIOS (codigo_medico, codigo_consultorio, fecha, hora_inicio, hora_fin, detalles_uso)
        VALUES (@codigoDoctor, @codigoConsultorio, @fecha, @horaInicio, @horaFin, '')
      `);
    
    res.json({ success: true, message: 'Horario asignado correctamente' });
  } catch (error) {
    console.error('Error al asignar horario:', error);
    res.status(500).json({ error: 'Error al asignar horario' });
  }
});

app.get('/api/pacientes', async (req, res) => {
  try {
    const pool = await connect();
    const result = await pool.request().query(`
      SELECT 
        P.codigo_persona AS codigo_paciente,
        P.primer_nombre + ' ' + P.apellido_paterno + ' ' + ISNULL(P.apellido_materno, '') AS nombre,
        P.telefono,
        P.correo_electronico
      FROM PERSONAS P
      JOIN PACIENTES PA ON P.codigo_persona = PA.codigo_paciente
      WHERE P.activo = 1
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al cargar pacientes:', error);
    res.status(500).json({ error: 'Error al obtener los pacientes' });
  }
});

app.get('/api/medicos-consultorios', async (req, res) => {
  try {
    const pool = await connect();
    const result = await pool.request().query(`
      SELECT 
        S.nombre AS nombre_sucursal,
        C.nombre AS nombre_consultorio,
        P.primer_nombre + ' ' + P.apellido_paterno + ' ' + ISNULL(P.apellido_materno, '') AS nombre_medico,
        MC.hora_inicio,
        MC.hora_fin
      FROM MEDICOS_CONSULTORIOS MC
      JOIN CONSULTORIOS C ON MC.codigo_consultorio = C.codigo_consultorio
      JOIN SUCURSALES S ON C.codigo_sucursal = S.codigo_sucursal
      JOIN MEDICOS M ON MC.codigo_medico = M.codigo_medico
      JOIN PERSONAS P ON M.codigo_medico = P.codigo_persona
      ORDER BY S.nombre, C.nombre
    `);

    // Agrupar por sucursal
    const agrupado = {};
    for (const row of result.recordset) {
      if (!agrupado[row.nombre_sucursal]) agrupado[row.nombre_sucursal] = [];
      agrupado[row.nombre_sucursal].push({
        consultorio: row.nombre_consultorio,
        medico: row.nombre_medico,
        hora_inicio: row.hora_inicio,
        hora_fin: row.hora_fin
      });
    }

    res.json(agrupado);
  } catch (error) {
    console.error('Error al cargar médicos/consultorios:', error);
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
});

app.get('/api/pacientes/medico/:codigoMedico', async (req, res) => {
  try {
    const { codigoMedico } = req.params;

    const pool = await connect();
    const result = await pool.request()
      .input('codigoMedico', sql.NVarChar, codigoMedico)
      .query(`
        SELECT DISTINCT 
          P.codigo_persona AS codigo_paciente,
          P.primer_nombre + ' ' + P.apellido_paterno + ' ' + ISNULL(P.apellido_materno, '') AS nombre,
          P.telefono,
          P.correo_electronico
        FROM PERSONAS P
        JOIN PACIENTES PA ON P.codigo_persona = PA.codigo_paciente
        JOIN CITAS C ON C.codigo_paciente = PA.codigo_paciente
        WHERE C.codigo_medico = @codigoMedico AND P.activo = 1
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al cargar pacientes por médico:', error);
    res.status(500).json({ error: 'Error al obtener los pacientes' });
  }
});

app.get('/api/medicos-consultorios/:codigoMedico', async (req, res) => {
  try {
    const { codigoMedico } = req.params;
    const pool = await connect();
    const result = await pool.request()
      .input('codigoMedico', sql.NVarChar, codigoMedico)
      .query(`
        SELECT 
          S.nombre AS nombre_sucursal,
          C.nombre AS nombre_consultorio,
          P.primer_nombre + ' ' + P.apellido_paterno + ' ' + ISNULL(P.apellido_materno, '') AS nombre_medico,
          MC.hora_inicio,
          MC.hora_fin
        FROM MEDICOS_CONSULTORIOS MC
        JOIN CONSULTORIOS C ON MC.codigo_consultorio = C.codigo_consultorio
        JOIN SUCURSALES S ON C.codigo_sucursal = S.codigo_sucursal
        JOIN MEDICOS M ON MC.codigo_medico = M.codigo_medico
        JOIN PERSONAS P ON M.codigo_medico = P.codigo_persona
        WHERE MC.codigo_medico = @codigoMedico
        ORDER BY S.nombre, C.nombre
      `);

    const agrupado = {};
    for (const row of result.recordset) {
      if (!agrupado[row.nombre_sucursal]) agrupado[row.nombre_sucursal] = [];
      agrupado[row.nombre_sucursal].push({
        consultorio: row.nombre_consultorio,
        medico: row.nombre_medico,
        hora_inicio: row.hora_inicio,
        hora_fin: row.hora_fin
      });
    }

    res.json(agrupado);
  } catch (error) {
    console.error('Error al cargar asignaciones del médico:', error);
    res.status(500).json({ error: 'Error al obtener datos de asignación' });
  }
});

app.get('/api/pacientes/asistente/:codigoAsistente', async (req, res) => {
  try {
    const { codigoAsistente } = req.params;
    const pool = await connect();

    const result = await pool.request()
      .input('codigoAsistente', sql.NVarChar, codigoAsistente)
      .query(`
        SELECT DISTINCT 
          P.codigo_persona AS codigo_paciente,
          P.primer_nombre + ' ' + P.apellido_paterno + ' ' + ISNULL(P.apellido_materno, '') AS nombre,
          P.telefono,
          P.correo_electronico
        FROM CITAS C
        JOIN PACIENTES PA ON C.codigo_paciente = PA.codigo_paciente
        JOIN PERSONAS P ON PA.codigo_paciente = P.codigo_persona
        WHERE C.codigo_asistente = @codigoAsistente AND P.activo = 1
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener pacientes por asistente:', error);
    res.status(500).json({ error: 'Error al cargar pacientes del asistente' });
  }
});

app.get('/api/sucursales', async (req, res) => {
  try {
    const { especialidad } = req.query;
    const pool = await connect();

    let query = `
      SELECT DISTINCT S.codigo_sucursal, S.nombre
      FROM SUCURSALES S
      JOIN CONSULTORIOS C ON S.codigo_sucursal = C.codigo_sucursal
      JOIN MEDICOS_CONSULTORIOS MC ON C.codigo_consultorio = MC.codigo_consultorio
      JOIN MEDICOS M ON MC.codigo_medico = M.codigo_medico
      WHERE 1 = 1
    `;

    const request = pool.request();

    if (especialidad) {
      query += ` AND M.especialidad = @especialidad`;
      request.input('especialidad', sql.NVarChar, especialidad);
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al cargar sucursales por especialidad:', err);
    res.status(500).json({ error: 'Error interno al cargar sucursales' });
  }
});


app.get('/api/especialidades', async (req, res) => {
  const { sucursal } = req.query;
  const pool = await connect();
  const query = `
    SELECT DISTINCT M.especialidad
    FROM MEDICOS M
    JOIN MEDICOS_CONSULTORIOS MC ON M.codigo_medico = MC.codigo_medico
    JOIN CONSULTORIOS C ON MC.codigo_consultorio = C.codigo_consultorio
    ${sucursal ? 'WHERE C.codigo_sucursal = @sucursal' : ''}
  `;
  const request = pool.request();
  if (sucursal) request.input('sucursal', sql.NVarChar, sucursal);

  const result = await request.query(query);
  res.json(result.recordset);
});

app.get('/api/doctores2', async (req, res) => {
  try {
    const { especialidad, sucursal } = req.query;
    const pool = await connect();

    let query = `
      SELECT DISTINCT M.codigo_medico,
        P.primer_nombre + ' ' + P.apellido_paterno + ' ' + ISNULL(P.apellido_materno, '') AS nombre,
        MC.hora_inicio,
        MC.hora_fin,
        MC.fecha
      FROM MEDICOS M
      JOIN PERSONAS P ON M.codigo_medico = P.codigo_persona
      JOIN MEDICOS_CONSULTORIOS MC ON M.codigo_medico = MC.codigo_medico
      JOIN CONSULTORIOS C ON MC.codigo_consultorio = C.codigo_consultorio
      WHERE 1 = 1
    `;

    const request = pool.request();

    if (especialidad) {
      query += ' AND M.especialidad = @especialidad';
      request.input('especialidad', sql.NVarChar, especialidad);
    }

    if (sucursal) {
      query += ' AND C.codigo_sucursal = @sucursal';
      request.input('sucursal', sql.NVarChar, sucursal);
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener doctores:', error);
    res.status(500).json({ error: 'Error al obtener doctores' });
  }
});

// server.js (fragmento de la ruta /api/citas/nueva con logs de depuración)

// server.js (ruta /api/citas/nueva con hora como varchar)

// server.js (ruta /api/citas/nueva con asignación de codigo_consultorio)

app.post('/api/citas/nueva', async (req, res) => {
  try {
    const { codigoPaciente, codigoMedico, fecha, hora, monto, anticipo } = req.body;

    console.log('📥 Datos recibidos para nueva cita:', { codigoPaciente, codigoMedico, fecha, hora, monto, anticipo });

    const pool = await sql.connect();

    // Buscar el consultorio asignado para ese médico en esa fecha
    const consultorioResult = await pool.request()
      .input('codigo_medico', sql.NVarChar, codigoMedico)
      .input('fecha', sql.Date, fecha)
      .query(`
        SELECT TOP 1 codigo_consultorio
        FROM MEDICOS_CONSULTORIOS
        WHERE codigo_medico = @codigo_medico AND fecha = @fecha
      `);

    if (consultorioResult.recordset.length === 0) {
      return res.status(400).json({ success: false, error: 'El médico no tiene un consultorio asignado en esa fecha' });
    }

    const codigoConsultorio = consultorioResult.recordset[0].codigo_consultorio;

    // Generar nuevo código de cita
    const citaResult = await pool.request()
      .query("SELECT TOP 1 codigo_cita FROM CITAS ORDER BY codigo_cita DESC");
    let codigoCita = 'CI001';
    if (citaResult.recordset.length > 0) {
      const ultimo = citaResult.recordset[0].codigo_cita;
      const numero = parseInt(ultimo.substring(2)) + 1;
      codigoCita = 'CI' + numero.toString().padStart(3, '0');
    }

    // Validar hora
    const horaRegex = /^\d{2}:\d{2}:\d{2}$/;
    if (!horaRegex.test(hora)) {
      return res.status(400).json({ success: false, error: 'Hora inválida. Usa formato HH:MM:SS' });
    }

    // Insertar en CITAS usando varchar para hora
    await pool.request()
      .input('codigo_cita', sql.NVarChar, codigoCita)
      .input('codigo_paciente', sql.NVarChar, codigoPaciente)
      .input('codigo_medico', sql.NVarChar, codigoMedico)
      .input('codigo_consultorio', sql.NVarChar, codigoConsultorio)
      .input('fecha', sql.Date, fecha)
      .input('hora', sql.VarChar, hora)
      .input('estado', sql.NVarChar, 'programada')
      .query(`
        INSERT INTO CITAS (codigo_cita, codigo_paciente, codigo_medico, codigo_consultorio, fecha_de_cita, hora_de_cita, estado_de_cita)
        VALUES (@codigo_cita, @codigo_paciente, @codigo_medico, @codigo_consultorio, @fecha, @hora, @estado)
      `);

    // Generar código de pago
    const pagoResult = await pool.request()
      .query("SELECT TOP 1 codigo_pago FROM PAGOS ORDER BY codigo_pago DESC");
    let codigoPago = 'PG001';
    if (pagoResult.recordset.length > 0) {
      const ultimo = pagoResult.recordset[0].codigo_pago;
      const numero = parseInt(ultimo.substring(2)) + 1;
      codigoPago = 'PG' + numero.toString().padStart(3, '0');
    }

    // Insertar en PAGOS
await pool.request()
  .input('codigo_pago', sql.NVarChar, codigoPago)
  .input('codigo_cita', sql.NVarChar, codigoCita)
  .input('monto_total', sql.Money, anticipo)
  .input('fecha_pago', sql.DateTime, new Date())
  .input('estado', sql.NVarChar, 'pendiente')
  .query(`
     INSERT INTO PAGOS (codigo_pago, metodo_pago, monto_total, fecha_pago, estado, codigo_cita)
        VALUES (@codigo_pago, 'Efectivo', @monto_total, @fecha_pago, @estado, @codigo_cita)
  `);


    res.json({ success: true, codigoCita });
  } catch (error) {
    console.error('❌ Error al insertar cita y pago:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/citas/nueva/asistente', async (req, res) => {
  try {
    const { codigoAsistente, codigoPaciente, codigoMedico, fecha, hora, monto, anticipo } = req.body;

    console.log('📝 Nueva cita registrada por asistente:', { codigoAsistente, codigoPaciente, codigoMedico, fecha, hora, monto, anticipo });

    const pool = await connect();

    // Validar hora
    const horaRegex = /^\d{2}:\d{2}:\d{2}$/;
    if (!horaRegex.test(hora)) {
      return res.status(400).json({ success: false, error: 'Hora inválida. Usa formato HH:MM:SS' });
    }

    // Consultorio asignado
    const consultorioResult = await pool.request()
      .input('codigo_medico', sql.NVarChar, codigoMedico)
      .input('fecha', sql.Date, fecha)
      .query(`
        SELECT TOP 1 codigo_consultorio
        FROM MEDICOS_CONSULTORIOS
        WHERE codigo_medico = @codigo_medico AND fecha = @fecha
      `);

    if (consultorioResult.recordset.length === 0) {
      return res.status(400).json({ success: false, error: 'El médico no tiene un consultorio asignado para esa fecha' });
    }

    const codigoConsultorio = consultorioResult.recordset[0].codigo_consultorio;

    // Generar código de cita
    const citaRes = await pool.request().query(`SELECT TOP 1 codigo_cita FROM CITAS ORDER BY codigo_cita DESC`);
    let codigoCita = 'CI001';
    if (citaRes.recordset.length > 0) {
      const last = citaRes.recordset[0].codigo_cita;
      const num = parseInt(last.substring(2)) + 1;
      codigoCita = 'CI' + num.toString().padStart(3, '0');
    }

    // Insertar en CITAS
    await pool.request()
      .input('codigo_cita', sql.NVarChar, codigoCita)
      .input('codigo_paciente', sql.NVarChar, codigoPaciente)
      .input('codigo_medico', sql.NVarChar, codigoMedico)
      .input('codigo_consultorio', sql.NVarChar, codigoConsultorio)
      .input('codigo_asistente', sql.NVarChar, codigoAsistente)
      .input('fecha', sql.Date, fecha)
      .input('hora', sql.VarChar, hora)
      .input('estado', sql.NVarChar, 'programada')
      .query(`
        INSERT INTO CITAS (codigo_cita, codigo_paciente, codigo_medico, codigo_consultorio, codigo_asistente, fecha_de_cita, hora_de_cita, estado_de_cita)
        VALUES (@codigo_cita, NULL, @codigo_medico, @codigo_consultorio, @codigo_asistente, @fecha, @hora, @estado)
      `);

    // Generar código de pago
    const pagoRes = await pool.request().query(`SELECT TOP 1 codigo_pago FROM PAGOS ORDER BY codigo_pago DESC`);
    let codigoPago = 'PG001';
    if (pagoRes.recordset.length > 0) {
      const last = pagoRes.recordset[0].codigo_pago;
      const num = parseInt(last.substring(2)) + 1;
      codigoPago = 'PG' + num.toString().padStart(3, '0');
    }

    await pool.request()
      .input('codigo_pago', sql.NVarChar, codigoPago)
      .input('codigo_cita', sql.NVarChar, codigoCita)
      .input('monto_total', sql.Money, anticipo)
      .input('fecha_pago', sql.DateTime, new Date())
      .input('estado', sql.NVarChar, 'pendiente')
      .query(`
        INSERT INTO PAGOS (codigo_pago, metodo_pago, monto_total, fecha_pago, estado, codigo_cita)
        VALUES (@codigo_pago, 'Efectivo', @monto_total, @fecha_pago, @estado, @codigo_cita)
      `);

    res.json({ success: true, codigoCita });

  } catch (error) {
    console.error('❌ Error al registrar cita por asistente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});




// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

