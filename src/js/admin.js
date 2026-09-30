
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const PROPERTY_ID = "villa-gesell";

// DOM
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const btnLogout = document.getElementById('btn-logout');

// Tabs
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
        e.target.classList.add('active');
        document.getElementById(e.target.dataset.target).style.display = 'block';
    });
});

// Auth Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        loadAdminData();
    } else {
        loginScreen.style.display = 'flex';
        dashboard.style.display = 'none';
    }
});

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    
    signInWithEmailAndPassword(auth, email, pass)
        .catch(err => document.getElementById('login-error').innerText = "Credenciales incorrectas.");
});

// Logout
btnLogout.addEventListener('click', () => signOut(auth));

// Load Data
async function loadAdminData() {
    // Load Property Info
    const docRef = doc(db, "properties", PROPERTY_ID);
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('input-price').value = data.pricePerNight || 0;
        document.getElementById('input-whatsapp').value = data.whatsapp || "";
        document.getElementById('input-title').value = data.title || "";
        document.getElementById('input-desc').value = data.description || "";
        document.getElementById('input-published').value = data.published ? "true" : "false";
        document.getElementById('pub-status').innerText = data.published ? "Publicado" : "No Publicado";
    }

    // Load Reservations (mock display for MVP)
    const resRef = collection(db, `properties/${PROPERTY_ID}/reservations`);
    const resSnap = await getDocs(resRef);
    const tbody = document.querySelector('#reservations-table tbody');
    tbody.innerHTML = '';
    resSnap.forEach(doc => {
        const r = doc.data();
        tbody.innerHTML += `
            <tr>
                <td>${r.guestName}</td>
                <td>${r.startDate} a ${r.endDate}</td>
                <td>USD ${r.total}</td>
                <td><strong>${r.status}</strong></td>
                <td><button class="action-btn" onclick="alert('Editar reserva en desarrollo')">Ver/Editar</button></td>
            </tr>
        `;
    });

    // Init Admin Calendar (visual only MVP)
    flatpickr("#admin-calendar", {
        inline: true,
        mode: "multiple",
        locale: "es",
    });
}

// Save Property Info
document.getElementById('form-info').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        pricePerNight: Number(document.getElementById('input-price').value),
        whatsapp: document.getElementById('input-whatsapp').value,
        title: document.getElementById('input-title').value,
        description: document.getElementById('input-desc').value,
        published: document.getElementById('input-published').value === "true",
        updatedAt: new Date().toISOString()
    };
    
    try {
        await updateDoc(doc(db, "properties", PROPERTY_ID), data);
        alert("Información guardada correctamente");
        document.getElementById('pub-status').innerText = data.published ? "Publicado" : "No Publicado";
    } catch(err) {
        alert("Error al guardar: " + err.message);
    }
});

// Note: Image upload and complex reservation creation forms require additional UI modals.
// They follow the same Firestore structure described in the prompt.
document.getElementById('btn-new-reservation').onclick = () => alert("Módulo de nueva reserva: Aquí se abriría el modal de carga manual conectando a la colección reservations.");
document.getElementById('btn-upload-img').onclick = () => alert("Módulo de subida de imágenes: Aquí se conecta Firebase Storage.");
