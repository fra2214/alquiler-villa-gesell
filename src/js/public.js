
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const PROPERTY_ID = "villa-gesell";

// State
let propertyData = {};
let reservations = [];
let blocks = [];
let discounts = [];
let selectedDates = [];

// DOM Elements
const els = {
    title: document.getElementById('prop-title'),
    subtitle: document.getElementById('prop-subtitle'),
    desc: document.getElementById('prop-desc'),
    price: document.getElementById('prop-price'),
    featuresGrid: document.getElementById('features-grid'),
    btnWhatsapp: document.getElementById('btn-whatsapp'),
    mainPhoto: document.getElementById('current-img'),
    thumbnailRow: document.getElementById('thumbnail-row'),
    datePicker: document.getElementById('date-picker'),
    calcBox: document.getElementById('calc-box'),
    calcNights: document.getElementById('calc-nights-text'),
    calcSubtotal: document.getElementById('calc-subtotal'),
    calcDiscountRow: document.getElementById('calc-discount-row'),
    calcDiscountAmount: document.getElementById('calc-discount-amount'),
    calcTotal: document.getElementById('calc-total'),
    errorMsg: document.getElementById('booking-error')
};

async function init() {
    try {
        await fetchPropertyData();
        await fetchImages();
        await fetchAvailability();
        await fetchDiscounts();
        setupCalendar();
    } catch (error) {
        console.error("Error loading data:", error);
        els.title.innerText = "Error cargando la información.";
    }
}

async function fetchPropertyData() {
    const docRef = doc(db, "properties", PROPERTY_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        propertyData = docSnap.data();
        if(!propertyData.published) {
            document.body.innerHTML = "<div class='container' style='padding:50px; text-align:center;'><h2>Publicación no disponible actualmente.</h2></div>";
            return;
        }
        
        els.title.innerText = propertyData.title || "Departamento en Villa Gesell";
        els.subtitle.innerText = propertyData.subtitle || "";
        els.desc.innerText = propertyData.description || "";
        els.price.innerText = `USD ${propertyData.pricePerNight || 0}`;
        
        // Render features (mocked array for MVP based on DB structure)
        const featuresRef = collection(db, `properties/${PROPERTY_ID}/features`);
        const featSnap = await getDocs(featuresRef);
        els.featuresGrid.innerHTML = "";
        featSnap.forEach(doc => {
            const f = doc.data();
            if(f.active) {
                els.featuresGrid.innerHTML += `<div class="feature-item">✓ ${f.name}: ${f.value}</div>`;
            }
        });
    }
}

async function fetchImages() {
    const imagesRef = collection(db, `properties/${PROPERTY_ID}/images`);
    const imgSnap = await getDocs(imagesRef);
    let images = [];
    imgSnap.forEach(doc => images.push(doc.data()));
    
    // Sort by order
    images.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if(images.length > 0) {
        els.mainPhoto.src = images[0].url;
        images.forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = img.url;
            if(index === 0) thumb.classList.add('active');
            thumb.onclick = () => {
                els.mainPhoto.src = img.url;
                document.querySelectorAll('.thumbnail-row img').forEach(i => i.classList.remove('active'));
                thumb.classList.add('active');
            };
            els.thumbnailRow.appendChild(thumb);
        });
    }
}

async function fetchAvailability() {
    // Fetch Reservations
    const resRef = collection(db, `properties/${PROPERTY_ID}/reservations`);
    const resSnap = await getDocs(resRef);
    resSnap.forEach(doc => {
        const data = doc.data();
        if(data.status !== 'Cancelada') reservations.push(data);
    });

    // Fetch Blocks
    const blockRef = collection(db, `properties/${PROPERTY_ID}/blocks`);
    const blockSnap = await getDocs(blockRef);
    blockSnap.forEach(doc => blocks.push(doc.data()));
}

async function fetchDiscounts() {
    const discRef = collection(db, `properties/${PROPERTY_ID}/discounts`);
    const discSnap = await getDocs(discRef);
    discSnap.forEach(doc => {
        if(doc.data().active) discounts.push(doc.data());
    });
    // Sort discounts by minNights descending (apply biggest eligible)
    discounts.sort((a, b) => b.minNights - a.minNights);
}

function getDisabledDates() {
    let disabled = [];
    
    // Helper to get dates between start and end
    const getDatesInRange = (startStr, endStr) => {
        let dates = [];
        let curr = new Date(startStr + "T00:00:00");
        let end = new Date(endStr + "T00:00:00");
        while(curr <= end) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    };

    reservations.forEach(r => disabled.push(...getDatesInRange(r.startDate, r.endDate)));
    blocks.forEach(b => disabled.push(...getDatesInRange(b.startDate, b.endDate)));
    
    return disabled;
}

function setupCalendar() {
    const disabledDates = getDisabledDates();

    flatpickr(els.datePicker, {
        mode: "range",
        minDate: "today",
        dateFormat: "Y-m-d",
        disable: disabledDates,
        locale: "es",
        onChange: function(selectedDatesArr, dateStr, instance) {
            if (selectedDatesArr.length === 2) {
                // Check if range includes disabled dates
                const start = selectedDatesArr[0];
                const end = selectedDatesArr[1];
                let hasConflict = false;
                
                let curr = new Date(start);
                while(curr <= end) {
                    if(disabledDates.includes(curr.toISOString().split('T')[0])) {
                        hasConflict = true; break;
                    }
                    curr.setDate(curr.getDate() + 1);
                }

                if(hasConflict) {
                    els.errorMsg.innerText = "El rango seleccionado incluye fechas no disponibles.";
                    instance.clear();
                    resetCalculation();
                } else {
                    els.errorMsg.innerText = "";
                    selectedDates = [start, end];
                    calculatePrice();
                }
            } else {
                resetCalculation();
            }
        }
    });
}

function calculatePrice() {
    if(selectedDates.length !== 2) return;
    
    const start = selectedDates[0];
    const end = selectedDates[1];
    
    // Calculate nights
    const diffTime = Math.abs(end - start);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if(nights === 0) {
        els.errorMsg.innerText = "La reserva mínima es de 1 noche.";
        resetCalculation();
        return;
    }

    const pricePerNight = propertyData.pricePerNight || 0;
    const subtotal = nights * pricePerNight;
    
    // Check discounts
    let appliedDiscount = null;
    for(let d of discounts) {
        if(nights >= d.minNights) {
            appliedDiscount = d;
            break;
        }
    }

    let discountAmount = 0;
    if(appliedDiscount) {
        discountAmount = (subtotal * appliedDiscount.percentage) / 100;
    }

    const total = subtotal - discountAmount;

    // Update UI
    els.calcBox.style.display = 'block';
    els.calcNights.innerText = `${nights} noches`;
    els.calcSubtotal.innerText = `USD ${subtotal}`;
    
    if(discountAmount > 0) {
        els.calcDiscountRow.style.display = 'flex';
        els.calcDiscountAmount.innerText = `- USD ${discountAmount} (${appliedDiscount.percentage}%)`;
    } else {
        els.calcDiscountRow.style.display = 'none';
    }
    
    els.calcTotal.innerText = `USD ${total}`;
    
    // Setup WhatsApp
    setupWhatsApp(start, end, nights, total);
}

function resetCalculation() {
    els.calcBox.style.display = 'none';
    els.btnWhatsapp.disabled = true;
    selectedDates = [];
}

function setupWhatsApp(start, end, nights, total) {
    els.btnWhatsapp.disabled = false;
    
    const formatDate = (d) => {
        return d.toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: 'numeric'});
    };

    const msg = `Hola, quisiera consultar por el departamento en Villa Gesell.%0A%0AFecha de entrada: ${formatDate(start)}%0AFecha de salida: ${formatDate(end)}%0ANoches: ${nights}%0ATotal estimado: USD ${total}.`;
    
    const waNumber = propertyData.whatsapp || ""; // ensure it has country code e.g. 549...
    
    els.btnWhatsapp.onclick = () => {
        window.open(`https://wa.me/${waNumber}?text=${msg}`, '_blank');
    };
}

// Start app
document.addEventListener("DOMContentLoaded", init);
