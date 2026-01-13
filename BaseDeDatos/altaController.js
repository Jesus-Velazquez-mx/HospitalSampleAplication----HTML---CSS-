// altaController.js
const sql = require('mssql');
const { connect } = require('./database');

// Función para generar códigos secuenciales
async function generarCodigo(tabla, prefijo) {
    const pool = await connect();

    // Determinar el nombre de la columna según la tabla
    let columnaCodigo;
    if (tabla === 'USUARIOS') {
        columnaCodigo = 'codigo_usuario';
    } else if (tabla === 'PERSONAS') {
        columnaCodigo = 'codigo_persona';
    } else if (tabla === 'SUCURSALES') {
        columnaCodigo = 'codigo_sucursal';
    } else if (tabla === 'CONSULTORIOS') {
        columnaCodigo = 'codigo_consultorio';
    } else {
        throw new Error(`Tabla ${tabla} no soportada`);
    }

    // Consulta mejorada: extraer la parte numérica y ordenar como entero
    const query = `
        SELECT TOP 1 ${columnaCodigo}
        FROM ${tabla}
        WHERE ISNUMERIC(SUBSTRING(${columnaCodigo}, 3, LEN(${columnaCodigo}))) = 1
        ORDER BY CAST(SUBSTRING(${columnaCodigo}, 3, LEN(${columnaCodigo})) AS INT) DESC
    `;

    const result = await pool.request().query(query);

    if (result.recordset.length === 0) {
        return `${prefijo}001`;
    }

    const ultimoCodigo = result.recordset[0][columnaCodigo];
    const numero = parseInt(ultimoCodigo.substring(2)) + 1;
    return `${prefijo}${numero.toString().padStart(3, '0')}`;
}


module.exports = {
   altaSucursal: async (req, res) => {
    try {
        const { nombre, calle, colonia, numero, telefono, email, hora_inicio, hora_fin } = req.body;
        
        // Validación adicional
        if (!nombre || !calle || !colonia || !numero || !telefono || !email || !hora_inicio || !hora_fin) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Convertir formato HH:MM:SS a objeto Time
        const parseTime = (timeString) => {
            const [hours, minutes, seconds] = timeString.split(':').map(Number);
            return new Date(1970, 0, 1, hours, minutes, seconds);
        };

        const codigo_sucursal = await generarCodigo('SUCURSALES', 'SU');
        
        const pool = await connect();
        const result = await pool.request()
            .input('codigo', sql.NVarChar, codigo_sucursal)
            .input('nombre', sql.NVarChar, nombre)
            .input('calle', sql.NVarChar, calle)
            .input('colonia', sql.NVarChar, colonia)
            .input('numero', sql.NVarChar, numero)
            .input('telefono', sql.NVarChar, telefono)
            .input('email', sql.NVarChar, email)
            .input('hora_inicio', sql.Time, parseTime(hora_inicio))
            .input('hora_fin', sql.Time, parseTime(hora_fin))
            .query(`
                INSERT INTO SUCURSALES (
                    codigo_sucursal, nombre, calle, colonia, numero, 
                    telefono, email, hora_inicio, hora_fin, activo
                ) VALUES (
                    @codigo, @nombre, @calle, @colonia, @numero, 
                    @telefono, @email, @hora_inicio, @hora_fin, '1'
                )`);
        
        res.json({ 
            success: true, 
            message: 'Sucursal registrada exitosamente', 
            codigo: codigo_sucursal 
        });
        
    } catch (error) {
        console.error('Error detallado:', {
            message: error.message,
            sqlError: error.originalError?.info?.message,
            stack: error.stack
        });
        
        res.status(500).json({ 
            error: 'Error al registrar la sucursal',
            details: error.message
        });
    }
},

    altaConsultorio: async (req, res) => {
        try {
            const { nombre, sucursal } = req.body;
            const codigo_consultorio = await generarCodigo('CONSULTORIOS', 'CO');
            
            const pool = await connect();
            await pool.request()
                .input('codigo', sql.NVarChar, codigo_consultorio)
                .input('nombre', sql.NVarChar, nombre)
                .input('sucursal', sql.NVarChar, sucursal)
                .query(`
                    INSERT INTO CONSULTORIOS (
                        codigo_consultorio, nombre, rentado, activo, codigo_sucursal
                    ) VALUES (
                        @codigo, @nombre, '0', '1', @sucursal
                    )`);
            
            res.json({ success: true, message: 'Consultorio registrado exitosamente', codigo: codigo_consultorio });
        } catch (error) {
            console.error('Error al registrar consultorio:', error);
            res.status(500).json({ error: 'Error al registrar el consultorio' });
        }
    },

    altaAsistente: async (req, res) => {
        console.log('Datos recibidos en altaAsistente:', req.body);

        try {
            const pool = await connect();
            const transaction = new sql.Transaction(pool);
            
            await transaction.begin();
            
            try {
                // 1. Generar códigos
                const codigo_usuario = await generarCodigo('USUARIOS', 'US');
                const codigo_asistente = await generarCodigo('PERSONAS', 'AS');
                
                // 2. Insertar en USUARIOS
                await transaction.request()
                    .input('codigo', sql.NVarChar, codigo_usuario)
                    .input('username', sql.NVarChar, req.body.correo)
                    .input('password', sql.NVarChar, req.body.password)
                    .input('tipo', sql.NVarChar, 'asistente')
                    .query(`
                        INSERT INTO USUARIOS (codigo_usuario, nombre_usuario, contrasena, tipo_usuario, activo)
                        VALUES (@codigo, @username, @password, @tipo, '1')`);
                
                // 3. Insertar en PERSONAS
                await transaction.request()
                    .input('codigo_persona', sql.NVarChar, codigo_asistente)
                    .input('codigo_usuario', sql.NVarChar, codigo_usuario)
                    .input('nombre', sql.NVarChar, req.body.nombre)
                    .input('apellidoPaterno', sql.NVarChar, req.body.apellidos.split(' ')[0] || '')
                    .input('apellidoMaterno', sql.NVarChar, req.body.apellidos.split(' ')[1] || '')
                    .input('telefono', sql.NVarChar, req.body.telefono)
                    .input('correo', sql.NVarChar, req.body.correo)
                    .input('calle', sql.NVarChar, req.body.calle)
                    .input('colonia', sql.NVarChar, req.body.colonia)
                    .input('numero', sql.NVarChar, req.body.numero)
                    .query(`
                        INSERT INTO PERSONAS (
                            codigo_persona, codigo_usuario, primer_nombre, apellido_paterno, apellido_materno,
                            telefono, correo_electronico, calle, colonia, numero, activo
                        ) VALUES (
                            @codigo_persona, @codigo_usuario, @nombre, @apellidoPaterno, @apellidoMaterno,
                            @telefono, @correo, @calle, @colonia, @numero, '1'
                        )`);
                
                // 4. Insertar en ASISTENTES
                await transaction.request()
                    .input('codigo_asistente', sql.NVarChar, codigo_asistente)
                    .input('horario_inicio', sql.VarChar, req.body.hora_inicio)
                    .input('horario_fin', sql.VarChar, req.body.hora_fin)
                    .query(`
                        INSERT INTO ASISTENTES (codigo_asistente, horario_inicio, horario_fin)
                        VALUES (@codigo_asistente, @horario_inicio, @horario_fin)`);
                
                await transaction.commit();
                
                res.json({ success: true, message: 'Asistente registrado exitosamente', codigo: codigo_asistente });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error al registrar asistente:', error);
            res.status(500).json({ error: 'Error al registrar el asistente' });
        }
    },

    altaDoctor: async (req, res) => {
        try {
            const pool = await connect();
            const transaction = new sql.Transaction(pool);
            
            await transaction.begin();
            
            try {
                // 1. Generar códigos
                const codigo_usuario = await generarCodigo('USUARIOS', 'US');
                const codigo_medico = await generarCodigo('PERSONAS', 'ME');
                
                // 2. Insertar en USUARIOS
                await transaction.request()
                    .input('codigo', sql.NVarChar, codigo_usuario)
                    .input('username', sql.NVarChar, req.body.correo)
                    .input('password', sql.NVarChar, req.body.password)
                    .input('tipo', sql.NVarChar, 'medico')
                    .query(`
                        INSERT INTO USUARIOS (codigo_usuario, nombre_usuario, contrasena, tipo_usuario, activo)
                        VALUES (@codigo, @username, @password, @tipo, '1')`);
                
                // 3. Insertar en PERSONAS
                await transaction.request()
                    .input('codigo_persona', sql.NVarChar, codigo_medico)
                    .input('codigo_usuario', sql.NVarChar, codigo_usuario)
                    .input('nombre', sql.NVarChar, req.body.nombre)
                    .input('apellidoPaterno', sql.NVarChar, req.body.apellidos.split(' ')[0] || '')
                    .input('apellidoMaterno', sql.NVarChar, req.body.apellidos.split(' ')[1] || '')
                    .input('telefono', sql.NVarChar, req.body.telefono)
                    .input('correo', sql.NVarChar, req.body.correo)
                    .input('calle', sql.NVarChar, req.body.calle)
                    .input('colonia', sql.NVarChar, req.body.colonia)
                    .input('numero', sql.NVarChar, req.body.numero)
                    .query(`
                        INSERT INTO PERSONAS (
                            codigo_persona, codigo_usuario, primer_nombre, apellido_paterno, apellido_materno,
                            telefono, correo_electronico, calle, colonia, numero, activo
                        ) VALUES (
                            @codigo_persona, @codigo_usuario, @nombre, @apellidoPaterno, @apellidoMaterno,
                            @telefono, @correo, @calle, @colonia, @numero, '1'
                        )`);
                
                // 4. Insertar en MEDICOS
                await transaction.request()
                    .input('codigo_medico', sql.NVarChar, codigo_medico)
                    .input('cedula', sql.NVarChar, req.body.cedula)
                    .input('especialidad', sql.NVarChar, req.body.especialidad)
                    .input('hora_inicio', sql.NVarChar, req.body.hora_inicio)
                    .input('hora_fin', sql.NVarChar, req.body.hora_fin)
                    .query(`
                        INSERT INTO MEDICOS (codigo_medico, cedula_profesional, especialidad, hora_inicio, hora_fin)
                        VALUES (@codigo_medico, @cedula, @especialidad, @hora_inicio, @hora_fin)`);
                
                await transaction.commit();
                
                res.json({ success: true, message: 'Médico registrado exitosamente', codigo: codigo_medico });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error al registrar médico:', error);
            res.status(500).json({ error: 'Error al registrar el médico' });
        }
    }
};