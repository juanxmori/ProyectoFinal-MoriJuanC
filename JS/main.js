// Variables globales
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let turnos = JSON.parse(localStorage.getItem("turnos")) || [];

// Elementos del DOM (adaptados a tus IDs)
const formTurnos = document.getElementById("formTurnos");
const listaTurnos = document.getElementById("listaTurnos");
const selectServicioTurno = document.getElementById("servicioTurno");
const inputFechaTurno = document.getElementById("fechaTurno");
const inputNombreCliente = document.getElementById("nombreCliente");
const inputTelefonoCliente = document.getElementById("telefonoCliente");

const listadoProductos = document.getElementById("listadoProductos");
const carritoItems = document.getElementById("carritoItems");
const totalCarritoSpan = document.getElementById("totalCarrito");
const btnRealizarCompra = document.getElementById("btnRealizarCompra");

// Productos y servicios se cargarán desde JSON
let productos = [];
let servicios = [];

// Función para mostrar alertas con SweetAlert2
const mostrarAlerta = (titulo, texto, icono = "info") => {
  Swal.fire({
    title: titulo,
    text: texto,
    icon: icono,
    confirmButtonText: "Aceptar",
  });
};

// --- Carga inicial ---
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Cargar servicios desde JSON y llenar select
    servicios = await fetch("./datos/servicios.json").then((res) => res.json());
    selectServicioTurno.length = 1; // Elimina todas las opciones excepto la primera
    servicios.forEach(({ id, nombre, precio }) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = `${nombre} ($${precio})`;
      selectServicioTurno.appendChild(option);
    });

    // Cargar productos desde JSON
    productos = await fetch("./datos/productos.json").then((res) => res.json());

    // Setear fecha mínima a hoy para el input fecha
    const hoy = new Date().toISOString().split("T")[0];
    inputFechaTurno.min = hoy;

    mostrarTurnosGuardados();
    mostrarProductos();
    mostrarCarrito();
  } catch (error) {
    mostrarAlerta(
      "Error",
      "No se pudieron cargar datos. Intenta más tarde.",
      "error"
    );
    console.error(error);
  }
});

// --- TURNOS ---
// Mostrar turnos guardados al cargar
function mostrarTurnosGuardados() {
  listaTurnos.innerHTML = "";
  turnos.forEach(mostrarTurnoEnHTML);
}

// Mostrar un turno en la lista
function mostrarTurnoEnHTML(turno) {
  const li = document.createElement("li");
  li.className = "list-group-item";
  li.innerHTML = `
    <strong>${turno.nombreCliente}</strong> - Tel: ${turno.telefonoCliente}<br/>
    Servicio: ${turno.servicio} | Fecha: ${turno.fecha}
  `;
  listaTurnos.appendChild(li);
}

// Validación simple formulario y guardar turno
formTurnos.addEventListener("submit", (e) => {
  e.preventDefault();

  // Validar formulario con Bootstrap (clase is-invalid)
  if (!formTurnos.checkValidity()) {
    formTurnos.classList.add("was-validated");
    return;
  }

  // Validar fecha >= hoy
  const fechaSeleccionada = new Date(inputFechaTurno.value).setHours(
    0,
    0,
    0,
    0
  );
  const hoy = new Date().setHours(0, 0, 0, 0);
  if (fechaSeleccionada < hoy) {
    mostrarAlerta(
      "Error",
      "No puedes seleccionar una fecha anterior a hoy.",
      "error"
    );
    return;
  }

  const nombreCliente = inputNombreCliente.value.trim();
  const telefonoCliente = inputTelefonoCliente.value.trim();
  const servicioId = parseInt(selectServicioTurno.value);

  const servicio = servicios.find((s) => s.id === servicioId);
  if (!servicio) {
    mostrarAlerta("Error", "Selecciona un servicio válido.", "error");
    return;
  }

  // Crear turno y guardarlo
  const nuevoTurno = {
    id: Date.now(),
    nombreCliente,
    telefonoCliente,
    servicio: servicio.nombre,
    fecha: inputFechaTurno.value,
  };
  turnos.push(nuevoTurno);
  localStorage.setItem("turnos", JSON.stringify(turnos));

  mostrarTurnoEnHTML(nuevoTurno);
  mostrarAlerta(
    "Turno reservado",
    "Tu turno fue reservado con éxito.",
    "success"
  );

  formTurnos.reset();
  formTurnos.classList.remove("was-validated");
});

// --- PRODUCTOS ---
// Mostrar productos en DOM
function mostrarProductos() {
  listadoProductos.innerHTML = "";
  productos.forEach(({ id, nombre, precio, imagen }) => {
    const div = document.createElement("div");
    div.className = "col-md-3 mb-3";

    div.innerHTML = `
      <div class="card h-100">
        <img src="${imagen}" class="card-img-top" alt="${nombre}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${nombre}</h5>
          <p class="card-text">Precio: $${precio}</p>
          <button class="btn btn-primary mt-auto btnAgregar" data-id="${id}">Agregar al carrito</button>
        </div>
      </div>
    `;
    listadoProductos.appendChild(div);
  });

  // Eventos para agregar productos
  document.querySelectorAll(".btnAgregar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idProducto = parseInt(btn.dataset.id);
      agregarAlCarrito(idProducto);
    });
  });
}

// --- CARRITO ---
// Agregar producto al carrito
function agregarAlCarrito(idProducto) {
  const producto = productos.find((p) => p.id === idProducto);
  if (!producto) return;

  const productoEnCarrito = carrito.find((p) => p.id === idProducto);
  if (productoEnCarrito) {
    productoEnCarrito.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  guardarCarrito();
  mostrarCarrito();

  mostrarAlerta(
    "Producto agregado",
    `${producto.nombre} fue agregado al carrito.`,
    "success"
  );
}

// Guardar carrito en localStorage
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

// Mostrar carrito en DOM
function mostrarCarrito() {
  carritoItems.innerHTML = "";
  if (carrito.length === 0) {
    carritoItems.innerHTML = "<p>El carrito está vacío.</p>";
    btnRealizarCompra.disabled = true;
    totalCarritoSpan.textContent = "0";
    return;
  }

  carrito.forEach(({ id, nombre, precio, cantidad }) => {
    const div = document.createElement("div");
    div.className = "d-flex justify-content-between align-items-center mb-2";

    div.innerHTML = `
      <div>${nombre} x ${cantidad}</div>
      <div>$${precio * cantidad}</div>
      <button class="btn btn-danger btn-sm btnEliminar" data-id="${id}">&times;</button>
    `;
    carritoItems.appendChild(div);
  });

  // Eventos eliminar producto
  document.querySelectorAll(".btnEliminar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idProducto = parseInt(btn.dataset.id);
      eliminarDelCarrito(idProducto);
    });
  });

  // Actualizar total y botón comprar
  const total = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  totalCarritoSpan.textContent = total;
  btnRealizarCompra.disabled = false;
}

// Eliminar producto del carrito
function eliminarDelCarrito(idProducto) {
  carrito = carrito.filter((p) => p.id !== idProducto);
  guardarCarrito();
  mostrarCarrito();
}

// --- COMPRA ---
// Evento botón realizar compra
btnRealizarCompra.addEventListener("click", () => {
  if (carrito.length === 0) {
    mostrarAlerta("Atención", "No hay productos en el carrito.", "warning");
    return;
  }

  mostrarAlerta("Compra realizada", "Gracias por tu compra.", "success");

  carrito = [];
  guardarCarrito();
  mostrarCarrito();
});
