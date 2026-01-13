const { connect } = require('./database.js'); // Ajusta la ruta

async function testConnection() {
  try {
    const pool = await connect();
    
    // Ejecuta una consulta simple para verificar
    const result = await pool.query`SELECT 1 AS testResult`;
    console.log('✅ Conexión exitosa. Resultado:', result.recordset);
    
    // Cierra la conexión
    await pool.close();
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    
    // Detalles específicos para diagnóstico
    if (err.code) console.log('Código de error:', err.code);
    if (err.number) console.log('Número de error SQL:', err.number);
  }
}

testConnection();