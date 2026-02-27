import mysql.connector
from mysql.connector import Error

def get_connection():
    try:
        connection = mysql.connector.connect(
            host="127.0.0.1",
            user="root",
            password="",
            database="sia_asistencia"
        )
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None

# Prueba de conexión
if __name__ == "__main__":
    conn = get_connection()
    if conn:
        print("✅ Conexión exitosa a la base de datos")
        conn.close()
    else:
        print("❌ Error en la conexión")
