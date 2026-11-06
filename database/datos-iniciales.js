/**
 * Datos iniciales de la cooperativa, copiados del proyecto original
 * (Proyecto_Cooperativa_MongoDB_corregido.txt, bloque "DATOS A INSERTAR").
 * Solo se incluyen los datos iniciales: los ejemplos de las historias de
 * usuario del TXT (U012, A011, P009, DI011...) se crean desde la API.
 */
module.exports =
{
  usuarios: [
    {
      usuario_id: "U001",
      nombre: "Juan Carlos Muñoz",
      documento: "1001001001",
      telefono: "3001111001",
      email: "juan.munoz@universidad.edu.co",
      tipo: "estudiante",
      estado: "activo"
    },
    {
      usuario_id: "U002",
      nombre: "María Fernanda López",
      documento: "1001001002",
      telefono: "3001111002",
      email: "maria.lopez@universidad.edu.co",
      tipo: "estudiante",
      estado: "activo"
    },
    {
      usuario_id: "U003",
      nombre: "Carlos Andrés Gómez",
      documento: "1001001003",
      telefono: "3001111003",
      email: "carlos.gomez@universidad.edu.co",
      tipo: "estudiante",
      estado: "activo"
    },
    {
      usuario_id: "U004",
      nombre: "Laura Daniela Rodríguez",
      documento: "1001001004",
      telefono: "3001111004",
      email: "laura.rodriguez@universidad.edu.co",
      tipo: "estudiante",
      estado: "activo"
    },
    {
      usuario_id: "U005",
      nombre: "Andrés Felipe Torres",
      documento: "1001001005",
      telefono: "3001111005",
      email: "andres.torres@universidad.edu.co",
      tipo: "estudiante",
      estado: "activo"
    },
    {
      usuario_id: "U006",
      nombre: "Sofía Valentina Herrera",
      documento: "1001001006",
      telefono: "3001111006",
      email: "sofia.herrera@universidad.edu.co",
      tipo: "estudiante",
      estado: "activo"
    },
    {
      usuario_id: "U007",
      nombre: "Mateo Sebastián Castro",
      documento: "1001001007",
      telefono: "3001111007",
      email: "mateo.castro@universidad.edu.co",
      tipo: "estudiante",
      estado: "activo"
    },
    {
      usuario_id: "U008",
      nombre: "Valentina Isabel Pérez",
      documento: "1001001008",
      telefono: "3001111008",
      email: "valentina.perez@universidad.edu.co",
      tipo: "estudiante",
      estado: "activo"
    },
    {
      usuario_id: "U009",
      nombre: "Sebastián David Moreno",
      documento: "1001001009",
      telefono: "3001111009",
      email: "sebastian.moreno@universidad.edu.co",
      tipo: "estudiante",
      estado: "activo"
    },
    {
      usuario_id: "U010",
      nombre: "Natalia Alejandra Vargas",
      documento: "1001001010",
      telefono: "3001111010",
      email: "natalia.vargas@universidad.edu.co",
      tipo: "estudiante",
      estado: "activo"
    },
    {
      usuario_id: "U011",
      nombre: "Ricardo Alberto Sánchez",
      documento: "1001001011",
      telefono: "3001111011",
      email: "rector@universidad.edu.co",
      tipo: "rector",
      estado: "activo"
    }
  ],
  funcionarios: [
    {
      funcionario_id: "F001",
      nombre: "Diana Marcela Rojas",
      cargo: "Director financiero",
      telefono: "3102001001",
      email: "diana.rojas@universidad.edu.co",
      estado: "activo"
    },
    {
      funcionario_id: "F002",
      nombre: "Jorge Enrique Martínez",
      cargo: "Asesor de créditos",
      telefono: "3102001002",
      email: "jorge.martinez@universidad.edu.co",
      estado: "activo"
    },
    {
      funcionario_id: "F003",
      nombre: "Paola Andrea Castillo",
      cargo: "Tesorero",
      telefono: "3102001003",
      email: "paola.castillo@universidad.edu.co",
      estado: "activo"
    },
    {
      funcionario_id: "F004",
      nombre: "Miguel Ángel Ramírez",
      cargo: "Auxiliar administrativo",
      telefono: "3102001004",
      email: "miguel.ramirez@universidad.edu.co",
      estado: "activo"
    },
    {
      funcionario_id: "F005",
      nombre: "Camila Andrea Suárez",
      cargo: "Analista financiero",
      telefono: "3102001005",
      email: "camila.suarez@universidad.edu.co",
      estado: "activo"
    }
  ],
  ahorros: [
    {
      ahorro_id: "A001",
      usuario_id: "U001",
      saldo: 2000000,
      estado: "activo"
    },
    {
      ahorro_id: "A002",
      usuario_id: "U002",
      saldo: 3000000,
      estado: "activo"
    },
    {
      ahorro_id: "A003",
      usuario_id: "U003",
      saldo: 5000000,
      estado: "activo"
    },
    {
      ahorro_id: "A004",
      usuario_id: "U004",
      saldo: 1500000,
      estado: "activo"
    },
    {
      ahorro_id: "A005",
      usuario_id: "U005",
      saldo: 2500000,
      estado: "activo"
    },
    {
      ahorro_id: "A006",
      usuario_id: "U006",
      saldo: 1000000,
      estado: "activo"
    },
    {
      ahorro_id: "A007",
      usuario_id: "U007",
      saldo: 3500000,
      estado: "activo"
    },
    {
      ahorro_id: "A008",
      usuario_id: "U008",
      saldo: 4500000,
      estado: "activo"
    },
    {
      ahorro_id: "A009",
      usuario_id: "U009",
      saldo: 1800000,
      estado: "activo"
    },
    {
      ahorro_id: "A010",
      usuario_id: "U010",
      saldo: 2200000,
      estado: "activo"
    }
  ],
  movimientos_ahorro: [
    {
      movimiento_id: "M001",
      ahorro_id: "A001",
      usuario_id: "U001",
      tipo: "deposito",
      valor: 2000000,
      fecha: new Date("2026-01-10T10:00:00Z"),
      descripcion: "Ahorro inicial"
    },
    {
      movimiento_id: "M002",
      ahorro_id: "A002",
      usuario_id: "U002",
      tipo: "deposito",
      valor: 3500000,
      fecha: new Date("2026-01-11T10:00:00Z"),
      descripcion: "Ahorro inicial"
    },
    {
      movimiento_id: "M003",
      ahorro_id: "A002",
      usuario_id: "U002",
      tipo: "retiro",
      valor: 500000,
      fecha: new Date("2026-02-15T10:00:00Z"),
      descripcion: "Retiro autorizado"
    },
    {
      movimiento_id: "M004",
      ahorro_id: "A003",
      usuario_id: "U003",
      tipo: "deposito",
      valor: 5000000,
      fecha: new Date("2026-01-12T10:00:00Z"),
      descripcion: "Ahorro inicial"
    },
    {
      movimiento_id: "M005",
      ahorro_id: "A004",
      usuario_id: "U004",
      tipo: "deposito",
      valor: 1500000,
      fecha: new Date("2026-01-13T10:00:00Z"),
      descripcion: "Ahorro inicial"
    },
    {
      movimiento_id: "M006",
      ahorro_id: "A005",
      usuario_id: "U005",
      tipo: "deposito",
      valor: 2500000,
      fecha: new Date("2026-01-14T10:00:00Z"),
      descripcion: "Ahorro inicial"
    },
    {
      movimiento_id: "M007",
      ahorro_id: "A006",
      usuario_id: "U006",
      tipo: "deposito",
      valor: 1000000,
      fecha: new Date("2026-01-15T10:00:00Z"),
      descripcion: "Ahorro inicial"
    },
    {
      movimiento_id: "M008",
      ahorro_id: "A007",
      usuario_id: "U007",
      tipo: "deposito",
      valor: 3500000,
      fecha: new Date("2026-01-16T10:00:00Z"),
      descripcion: "Ahorro inicial"
    },
    {
      movimiento_id: "M009",
      ahorro_id: "A008",
      usuario_id: "U008",
      tipo: "deposito",
      valor: 4500000,
      fecha: new Date("2026-01-17T10:00:00Z"),
      descripcion: "Ahorro inicial"
    },
    {
      movimiento_id: "M010",
      ahorro_id: "A009",
      usuario_id: "U009",
      tipo: "deposito",
      valor: 1800000,
      fecha: new Date("2026-01-18T10:00:00Z"),
      descripcion: "Ahorro inicial"
    },
    {
      movimiento_id: "M011",
      ahorro_id: "A010",
      usuario_id: "U010",
      tipo: "deposito",
      valor: 2200000,
      fecha: new Date("2026-01-19T10:00:00Z"),
      descripcion: "Ahorro inicial"
    },
    {
      movimiento_id: "M012",
      ahorro_id: "A001",
      usuario_id: "U001",
      tipo: "deposito",
      valor: 250000,
      fecha: new Date("2026-03-01T10:00:00Z"),
      descripcion: "Aporte adicional"
    },
    {
      movimiento_id: "M013",
      ahorro_id: "A001",
      usuario_id: "U001",
      tipo: "retiro",
      valor: 250000,
      fecha: new Date("2026-03-10T10:00:00Z"),
      descripcion: "Retiro autorizado"
    }
  ],
  fines_educativos: [
    {
      fin_id: "FE001",
      nombre: "Pago de matrícula",
      descripcion: "Pago de matrícula universitaria",
      estado: "activo"
    },
    {
      fin_id: "FE002",
      nombre: "Pago de semestre",
      descripcion: "Pago de semestre académico",
      estado: "activo"
    },
    {
      fin_id: "FE003",
      nombre: "Compra de computador",
      descripcion: "Compra de computador para actividades académicas",
      estado: "activo"
    },
    {
      fin_id: "FE004",
      nombre: "Compra de libros",
      descripcion: "Compra de libros y textos académicos",
      estado: "activo"
    },
    {
      fin_id: "FE005",
      nombre: "Material académico",
      descripcion: "Compra de materiales necesarios para estudiar",
      estado: "activo"
    },
    {
      fin_id: "FE006",
      nombre: "Cursos",
      descripcion: "Pago de cursos relacionados con la formación",
      estado: "activo"
    },
    {
      fin_id: "FE007",
      nombre: "Certificaciones",
      descripcion: "Pago de certificaciones académicas o profesionales",
      estado: "activo"
    },
    {
      fin_id: "FE008",
      nombre: "Transporte universitario",
      descripcion: "Transporte relacionado con actividades universitarias",
      estado: "activo"
    },
    {
      fin_id: "FE009",
      nombre: "Otros gastos educativos",
      descripcion: "Otros gastos directamente relacionados con la educación",
      estado: "activo"
    }
  ],
  prestamos: [
    {
      prestamo_id: "P001",
      usuario_id: "U001",
      fin_id: "FE001",
      capital_inicial: 1000000,
      interes_inicial: 50000,
      capital_pendiente: 1000000,
      interes_pendiente: 50000,
      tasa_interes: 0.05,
      estado: "activo",
      fecha_solicitud: new Date("2026-02-01T10:00:00Z")
    },
    {
      prestamo_id: "P002",
      usuario_id: "U002",
      fin_id: "FE003",
      capital_inicial: 2000000,
      interes_inicial: 100000,
      capital_pendiente: 2000000,
      interes_pendiente: 100000,
      tasa_interes: 0.05,
      estado: "activo",
      fecha_solicitud: new Date("2026-02-02T10:00:00Z")
    },
    {
      prestamo_id: "P003",
      usuario_id: "U003",
      fin_id: "FE004",
      capital_inicial: 3000000,
      interes_inicial: 150000,
      capital_pendiente: 3000000,
      interes_pendiente: 150000,
      tasa_interes: 0.05,
      estado: "activo",
      fecha_solicitud: new Date("2026-02-03T10:00:00Z")
    },
    {
      prestamo_id: "P004",
      usuario_id: "U004",
      fin_id: "FE002",
      capital_inicial: 5000000,
      interes_inicial: 250000,
      capital_pendiente: 3000000,
      interes_pendiente: 150000,
      tasa_interes: 0.05,
      estado: "activo",
      fecha_solicitud: new Date("2026-02-04T10:00:00Z")
    },
    {
      prestamo_id: "P005",
      usuario_id: "U005",
      fin_id: "FE006",
      capital_inicial: 1500000,
      interes_inicial: 75000,
      capital_pendiente: 1500000,
      interes_pendiente: 75000,
      tasa_interes: 0.05,
      estado: "activo",
      fecha_solicitud: new Date("2026-02-05T10:00:00Z")
    },
    {
      prestamo_id: "P006",
      usuario_id: "U006",
      fin_id: "FE005",
      capital_inicial: 500000,
      interes_inicial: 25000,
      capital_pendiente: 500000,
      interes_pendiente: 15000,
      tasa_interes: 0.05,
      estado: "activo",
      fecha_solicitud: new Date("2026-02-06T10:00:00Z")
    },
    {
      prestamo_id: "P007",
      usuario_id: "U007",
      fin_id: "FE007",
      capital_inicial: 800000,
      interes_inicial: 40000,
      capital_pendiente: 0,
      interes_pendiente: 0,
      tasa_interes: 0.05,
      estado: "pagado",
      fecha_solicitud: new Date("2026-02-07T10:00:00Z")
    },
    {
      prestamo_id: "P008",
      usuario_id: "U008",
      fin_id: "FE008",
      capital_inicial: 3000000,
      interes_inicial: 150000,
      capital_pendiente: 3000000,
      interes_pendiente: 150000,
      tasa_interes: 0.05,
      estado: "activo",
      fecha_solicitud: new Date("2026-02-08T10:00:00Z")
    }
  ],
  pagos_prestamo: [
    {
      pago_id: "PG001",
      prestamo_id: "P001",
      usuario_id: "U001",
      tipo_abono: "interes",
      valor: 20000,
      fecha: new Date("2026-03-01T10:00:00Z")
    },
    {
      pago_id: "PG002",
      prestamo_id: "P004",
      usuario_id: "U004",
      tipo_abono: "capital",
      valor: 2000000,
      fecha: new Date("2026-03-02T10:00:00Z")
    },
    {
      pago_id: "PG003",
      prestamo_id: "P007",
      usuario_id: "U007",
      tipo_abono: "capital",
      valor: 800000,
      fecha: new Date("2026-03-03T10:00:00Z")
    }
  ],
  distribucion_intereses: [
    {
      distribucion_id: "DI001",
      periodo: "2026-03",
      usuario_id: "U001",
      ahorro_id: "A001",
      ahorro_base: 2000000,
      total_ahorrado: 27000000,
      intereses_generados: 500000,
      participacion: 0.0740740741,
      interes_recibido: 37037.04
    },
    {
      distribucion_id: "DI002",
      periodo: "2026-03",
      usuario_id: "U002",
      ahorro_id: "A002",
      ahorro_base: 3000000,
      total_ahorrado: 27000000,
      intereses_generados: 500000,
      participacion: 0.1111111111,
      interes_recibido: 55555.56
    },
    {
      distribucion_id: "DI003",
      periodo: "2026-03",
      usuario_id: "U003",
      ahorro_id: "A003",
      ahorro_base: 5000000,
      total_ahorrado: 27000000,
      intereses_generados: 500000,
      participacion: 0.1851851852,
      interes_recibido: 92592.59
    },
    {
      distribucion_id: "DI004",
      periodo: "2026-03",
      usuario_id: "U004",
      ahorro_id: "A004",
      ahorro_base: 1500000,
      total_ahorrado: 27000000,
      intereses_generados: 500000,
      participacion: 0.0555555556,
      interes_recibido: 27777.78
    },
    {
      distribucion_id: "DI005",
      periodo: "2026-03",
      usuario_id: "U005",
      ahorro_id: "A005",
      ahorro_base: 2500000,
      total_ahorrado: 27000000,
      intereses_generados: 500000,
      participacion: 0.0925925926,
      interes_recibido: 46296.3
    },
    {
      distribucion_id: "DI006",
      periodo: "2026-03",
      usuario_id: "U006",
      ahorro_id: "A006",
      total_ahorrado: 27000000,
      intereses_generados: 500000,
      ahorro_base: 1000000,
      participacion: 0.037037037,
      interes_recibido: 18518.52
    },
    {
      distribucion_id: "DI007",
      periodo: "2026-03",
      usuario_id: "U007",
      ahorro_id: "A007",
      ahorro_base: 3500000,
      total_ahorrado: 27000000,
      intereses_generados: 500000,
      participacion: 0.1296296296,
      interes_recibido: 64814.81
    },
    {
      distribucion_id: "DI008",
      periodo: "2026-03",
      usuario_id: "U008",
      ahorro_id: "A008",
      ahorro_base: 4500000,
      total_ahorrado: 27000000,
      intereses_generados: 500000,
      participacion: 0.1666666667,
      interes_recibido: 83333.33
    },
    {
      distribucion_id: "DI009",
      periodo: "2026-03",
      usuario_id: "U009",
      ahorro_id: "A009",
      ahorro_base: 1800000,
      total_ahorrado: 27000000,
      intereses_generados: 500000,
      participacion: 0.0666666667,
      interes_recibido: 33333.33
    },
    {
      distribucion_id: "DI010",
      periodo: "2026-03",
      usuario_id: "U010",
      ahorro_id: "A010",
      ahorro_base: 2200000,
      total_ahorrado: 27000000,
      intereses_generados: 500000,
      participacion: 0.0814814815,
      interes_recibido: 40740.74
    }
  ]
};
