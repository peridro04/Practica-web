/* ==========================================================
   PJG Fitness - Carrito, avisos (modal de Bootstrap) y formularios
   ========================================================== */
(() => {
    'use strict';

    // Ruta hasta la raíz de la web ("" en la raíz, "../" en /productos)
    const RAIZ = document.body.dataset.raiz || '';
    const CLAVE_CARRITO = 'pjg_carrito';
    const CLAVE_USUARIO = 'pjg_usuario';
    const CODIGOS = { IRON10: 0.10 };

    const euros = (n) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

    // Evita meter HTML al pintar textos guardados
    const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    /* ---------- Carrito (localStorage) ---------- */

    function leerCarrito() {
        try {
            return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
        } catch (e) {
            return [];
        }
    }

    function guardarCarrito(carrito) {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
        pintarCarrito();
    }

    function subtotal(carrito) {
        return carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
    }

    function anadir(producto, cantidad) {
        const carrito = leerCarrito();
        const existente = carrito.find((i) => i.id === producto.id && i.talla === producto.talla);
        if (existente) {
            existente.cantidad = Math.min(existente.cantidad + cantidad, 10);
        } else {
            carrito.push({ ...producto, cantidad });
        }
        guardarCarrito(carrito);
    }

    function pintarCarrito() {
        const carrito = leerCarrito();
        const unidades = carrito.reduce((suma, item) => suma + item.cantidad, 0);

        document.querySelectorAll('.contador-carrito').forEach((el) => {
            el.textContent = unidades;
            el.classList.remove('rebote');
            void el.offsetWidth; // reinicia la animación
            el.classList.add('rebote');
        });

        const lista = document.getElementById('listaCarrito');
        if (lista) {
            if (carrito.length === 0) {
                lista.innerHTML = `
                    <div class="carrito-vacio">
                        <i class="bi bi-bag-x" aria-hidden="true"></i>
                        <p>Tu carrito está vacío.</p>
                        <a href="${RAIZ}tienda.html" class="btn btn-outline-light">Ir a la tienda</a>
                    </div>`;
            } else {
                lista.innerHTML = carrito.map((item, i) => `
                    <div class="item-carrito">
                        <img src="${RAIZ}img/${escapar(item.img)}" alt="">
                        <div class="datos">
                            <a class="nombre" href="${RAIZ}productos/${escapar(item.id)}.html">${escapar(item.nombre)}</a>
                            <span class="extra">${item.talla ? escapar(item.talla) + ' · ' : ''}${euros(item.precio)}</span>
                            <div class="controles">
                                <button type="button" class="btn btn-sm btn-outline-secondary" data-accion="menos" data-indice="${i}" aria-label="Quitar una unidad de ${escapar(item.nombre)}">−</button>
                                <span aria-live="polite">${item.cantidad}</span>
                                <button type="button" class="btn btn-sm btn-outline-secondary" data-accion="mas" data-indice="${i}" aria-label="Añadir una unidad de ${escapar(item.nombre)}">+</button>
                                <button type="button" class="btn btn-sm btn-link text-danger ms-auto" data-accion="quitar" data-indice="${i}" aria-label="Eliminar ${escapar(item.nombre)} del carrito"><i class="bi bi-trash3"></i></button>
                            </div>
                        </div>
                    </div>`).join('');
            }
        }

        const total = document.getElementById('totalCarrito');
        if (total) total.textContent = euros(subtotal(carrito));

        const finalizar = document.getElementById('btnFinalizar');
        if (finalizar) finalizar.classList.toggle('disabled', carrito.length === 0);

        pintarResumenPago();
    }

    // Botones + / − / papelera dentro del carrito
    document.addEventListener('click', (e) => {
        const boton = e.target.closest('[data-accion]');
        if (!boton) return;
        const carrito = leerCarrito();
        const i = Number(boton.dataset.indice);
        if (!carrito[i]) return;
        if (boton.dataset.accion === 'mas') carrito[i].cantidad = Math.min(carrito[i].cantidad + 1, 10);
        if (boton.dataset.accion === 'menos') carrito[i].cantidad -= 1;
        if (boton.dataset.accion === 'quitar' || carrito[i].cantidad <= 0) carrito.splice(i, 1);
        guardarCarrito(carrito);
    });

    /* ---------- Añadir al carrito / Comprar ahora ---------- */

    function datosProducto(boton) {
        const producto = {
            id: boton.dataset.id,
            nombre: boton.dataset.nombre,
            precio: Number(boton.dataset.precio),
            img: boton.dataset.img
        };
        let cantidad = 1;
        const ficha = boton.closest('.ficha');
        if (ficha) {
            const campo = ficha.querySelector('#cantidad');
            cantidad = Math.max(1, Math.min(10, Number(campo?.value) || 1));
            // Variante elegida: talla (ropa) u opción del desplegable (sabor, peso...)
            const talla = ficha.querySelector('input[name="talla"]:checked');
            const opcion = ficha.querySelector('#opcion');
            if (talla) producto.talla = 'Talla ' + talla.value;
            else if (opcion) producto.talla = opcion.value;
        }
        return { producto, cantidad };
    }

    document.addEventListener('click', (e) => {
        const boton = e.target.closest('.btn-anadir, .btn-comprar');
        if (!boton) return;
        e.preventDefault();
        const { producto, cantidad } = datosProducto(boton);
        anadir(producto, cantidad);

        if (boton.classList.contains('btn-comprar')) {
            window.location.href = `${RAIZ}pago.html`;
            return;
        }

        const toastEl = document.getElementById('toastCarrito');
        if (toastEl) {
            toastEl.querySelector('.toast-body span').textContent =
                `${cantidad} × ${producto.nombre}${producto.talla ? ' (' + producto.talla + ')' : ''} añadido al carrito.`;
            bootstrap.Toast.getOrCreateInstance(toastEl).show();
        }
    });

    // Selector de cantidad de la ficha de producto
    document.addEventListener('click', (e) => {
        const boton = e.target.closest('[data-cantidad]');
        if (!boton) return;
        const campo = document.getElementById('cantidad');
        const valor = (Number(campo.value) || 1) + Number(boton.dataset.cantidad);
        campo.value = Math.max(1, Math.min(10, valor));
    });

    /* ---------- Modal de aviso ---------- */

    function aviso({ titulo, texto, icono = 'bi-check-lg', enlace, textoEnlace, alCerrar }) {
        const modalEl = document.getElementById('modalAviso');
        modalEl.querySelector('.modal-title').textContent = titulo;
        modalEl.querySelector('.mensaje').innerHTML = texto;
        modalEl.querySelector('.icono i').className = `bi ${icono}`;
        const accion = modalEl.querySelector('.accion');
        if (enlace) {
            accion.href = enlace;
            accion.textContent = textoEnlace;
            accion.classList.remove('d-none');
        } else {
            accion.classList.add('d-none');
        }
        if (alCerrar) modalEl.addEventListener('hidden.bs.modal', alCerrar, { once: true });
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }

    /* ---------- Usuario ---------- */

    function pintarUsuario() {
        const usuario = localStorage.getItem(CLAVE_USUARIO);
        document.querySelectorAll('.nombre-usuario').forEach((el) => {
            el.textContent = usuario ? usuario : 'Entrar';
        });
        const sesion = document.getElementById('sesionIniciada');
        if (sesion) {
            sesion.classList.toggle('d-none', !usuario);
            sesion.querySelector('strong').textContent = usuario || '';
        }
    }

    document.getElementById('cerrarSesion')?.addEventListener('click', () => {
        localStorage.removeItem(CLAVE_USUARIO);
        pintarUsuario();
    });

    // Mostrar / ocultar la contraseña
    document.querySelectorAll('[data-ver-clave]').forEach((boton) => {
        boton.addEventListener('click', () => {
            const campo = document.getElementById(boton.dataset.verClave);
            const visible = campo.type === 'text';
            campo.type = visible ? 'password' : 'text';
            boton.querySelector('i').className = visible ? 'bi bi-eye' : 'bi bi-eye-slash';
            boton.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
        });
    });

    /* ---------- Formularios con validación de Bootstrap ---------- */

    const acciones = {
        contacto(form) {
            aviso({
                titulo: 'Mensaje enviado',
                texto: 'Gracias por escribirnos. Te responderemos en menos de 24 horas.',
                icono: 'bi-envelope-check'
            });
            form.reset();
        },
        newsletter(form) {
            aviso({
                titulo: 'Ya estás dentro',
                texto: 'Te avisaremos de los nuevos lanzamientos. Usa el código <span class="codigo-promo">IRON10</span> en tu primera compra.',
                icono: 'bi-lightning-charge-fill'
            });
            form.reset();
        },
        login(form) {
            const email = form.querySelector('#emailLogin').value;
            const nombre = email.split('@')[0];
            localStorage.setItem(CLAVE_USUARIO, nombre);
            pintarUsuario();
            aviso({
                titulo: `Hola, ${nombre}`,
                texto: 'Has iniciado sesión correctamente. Ya puedes seguir comprando.',
                icono: 'bi-person-check',
                enlace: `${RAIZ}tienda.html`,
                textoEnlace: 'Ir a la tienda'
            });
            form.reset();
        },
        registro(form) {
            const nombre = form.querySelector('#nombreRegistro').value.trim();
            localStorage.setItem(CLAVE_USUARIO, nombre);
            pintarUsuario();
            aviso({
                titulo: 'Cuenta creada',
                texto: `Bienvenido al equipo, <strong>${escapar(nombre)}</strong>. Te hemos enviado un correo de confirmación.`,
                icono: 'bi-person-plus',
                enlace: `${RAIZ}tienda.html`,
                textoEnlace: 'Empezar a comprar'
            });
            form.reset();
        },
        pago(form) {
            const carrito = leerCarrito();
            if (carrito.length === 0) {
                aviso({
                    titulo: 'Carrito vacío',
                    texto: 'Añade algún producto antes de pagar.',
                    icono: 'bi-bag-x',
                    enlace: `${RAIZ}tienda.html`,
                    textoEnlace: 'Ir a la tienda'
                });
                return;
            }
            const { total } = calcularPago();
            const pedido = 'PJG-' + Date.now().toString().slice(-6);
            localStorage.removeItem(CLAVE_CARRITO);
            localStorage.removeItem('pjg_codigo');
            pintarCarrito();
            form.reset();
            form.classList.remove('was-validated');
            aviso({
                titulo: 'Compra realizada',
                texto: `Tu pedido <strong>${pedido}</strong> por <strong>${euros(total)}</strong> está confirmado.<br>Lo recibirás en 24/48 h.`,
                icono: 'bi-bag-check',
                enlace: `${RAIZ}index.html`,
                textoEnlace: 'Volver al inicio'
            });
        }
    };

    // La contraseña repetida tiene que coincidir
    const repetir = document.getElementById('clave2Registro');
    if (repetir) {
        const comprobar = () => {
            const iguales = repetir.value === document.getElementById('claveRegistro').value;
            repetir.setCustomValidity(iguales ? '' : 'Las contraseñas no coinciden');
        };
        repetir.addEventListener('input', comprobar);
        document.getElementById('claveRegistro').addEventListener('input', comprobar);
    }

    document.querySelectorAll('form.needs-validation').forEach((form) => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                form.querySelector(':invalid')?.focus();
                return;
            }
            form.classList.remove('was-validated');
            acciones[form.dataset.form]?.(form);
        });
    });

    /* ---------- Filtros de la tienda ---------- */

    const filtros = document.querySelectorAll('[data-filtro]');
    function filtrar(categoria) {
        filtros.forEach((b) => {
            const activo = b.dataset.filtro === categoria;
            b.classList.toggle('active', activo);
            b.setAttribute('aria-pressed', activo);
        });
        document.querySelectorAll('[data-categoria]').forEach((col) => {
            col.classList.toggle('oculto', categoria !== 'todo' && col.dataset.categoria !== categoria);
        });
    }
    if (filtros.length) {
        filtros.forEach((b) => b.addEventListener('click', () => filtrar(b.dataset.filtro)));
        const inicial = new URLSearchParams(location.search).get('cat');
        if (inicial && document.querySelector(`[data-filtro="${CSS.escape(inicial)}"]`)) filtrar(inicial);
    }

    /* ---------- Página de pago ---------- */

    function calcularPago() {
        const carrito = leerCarrito();
        const sub = subtotal(carrito);
        const codigo = localStorage.getItem('pjg_codigo');
        const descuento = codigo && CODIGOS[codigo] ? sub * CODIGOS[codigo] : 0;
        const tipoEnvio = document.querySelector('input[name="envio"]:checked')?.value || 'estandar';
        let envio = 0;
        if (carrito.length) {
            envio = tipoEnvio === 'express' ? 5.9 : (sub >= 50 ? 0 : 3.9);
        }
        return { carrito, sub, descuento, envio, total: sub - descuento + envio, codigo };
    }

    function pintarResumenPago() {
        const resumen = document.getElementById('resumenPago');
        if (!resumen) return;
        const { carrito, sub, descuento, envio, total, codigo } = calcularPago();

        document.getElementById('resumenProductos').innerHTML = carrito.length
            ? carrito.map((item) => `
                <li class="item-carrito">
                    <img src="${RAIZ}img/${escapar(item.img)}" alt="">
                    <div class="datos">
                        <span class="nombre">${escapar(item.nombre)}</span>
                        <span class="extra">${item.cantidad} × ${euros(item.precio)}${item.talla ? ' · ' + escapar(item.talla) : ''}</span>
                    </div>
                    <strong>${euros(item.precio * item.cantidad)}</strong>
                </li>`).join('')
            : `<li class="carrito-vacio"><i class="bi bi-bag-x" aria-hidden="true"></i>No hay productos. <a href="${RAIZ}tienda.html">Ir a la tienda</a></li>`;

        document.getElementById('pagoSubtotal').textContent = euros(sub);
        document.getElementById('pagoEnvio').textContent = envio === 0 ? 'Gratis' : euros(envio);
        document.getElementById('pagoTotal').textContent = euros(total);
        document.getElementById('btnPagar').textContent = `Pagar ${euros(total)}`;
        const filaDescuento = document.getElementById('filaDescuento');
        filaDescuento.classList.toggle('d-none', descuento === 0);
        document.getElementById('pagoDescuento').textContent = '−' + euros(descuento);
        document.getElementById('nombreCodigo').textContent = codigo || '';
        const precioEstandar = document.getElementById('precioEstandar');
        if (precioEstandar) precioEstandar.textContent = sub >= 50 || !carrito.length ? 'Gratis' : euros(3.9);
    }

    document.querySelectorAll('input[name="envio"]').forEach((r) => r.addEventListener('change', pintarResumenPago));

    // Mostrar los campos de la tarjeta solo si se paga con tarjeta
    document.querySelectorAll('input[name="metodo"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            const tarjeta = document.getElementById('datosTarjeta');
            const conTarjeta = radio.value === 'tarjeta' && radio.checked;
            tarjeta.classList.toggle('d-none', !conTarjeta);
            tarjeta.querySelectorAll('input').forEach((i) => { i.required = conTarjeta; });
        });
    });

    document.getElementById('aplicarCodigo')?.addEventListener('click', () => {
        const campo = document.getElementById('codigo');
        const codigo = campo.value.trim().toUpperCase();
        if (CODIGOS[codigo]) {
            localStorage.setItem('pjg_codigo', codigo);
            campo.classList.remove('is-invalid');
            campo.classList.add('is-valid');
        } else {
            localStorage.removeItem('pjg_codigo');
            campo.classList.remove('is-valid');
            campo.classList.add('is-invalid');
        }
        pintarResumenPago();
    });

    /* ---------- Cuenta atrás de la oferta (novedades) ---------- */

    const cuenta = document.getElementById('cuentaAtras');
    if (cuenta) {
        const fin = new Date(cuenta.dataset.fin).getTime();
        const actualizar = () => {
            const resto = Math.max(0, fin - Date.now());
            const partes = {
                dias: Math.floor(resto / 86400000),
                horas: Math.floor(resto / 3600000) % 24,
                minutos: Math.floor(resto / 60000) % 60,
                segundos: Math.floor(resto / 1000) % 60
            };
            Object.entries(partes).forEach(([k, v]) => {
                cuenta.querySelector(`[data-${k}]`).textContent = String(v).padStart(2, '0');
            });
        };
        actualizar();
        setInterval(actualizar, 1000);
    }

    // Año actual en el footer
    document.querySelectorAll('.anio').forEach((el) => { el.textContent = new Date().getFullYear(); });

    pintarCarrito();
    pintarUsuario();
})();
