mapboxgl.accessToken =
  "pk.eyJ1IjoiaGVuZWNpdG8iLCJhIjoiY200dzZ1cm01MGF2cTJrcTJkbG56dzlkdCJ9.3rggYKzR-071VqpIW_LTYg";

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/satellite-streets-v11",
  center: [-72.650148, -37.517891],
  zoom: 15,
  bearing: 0,
  pitch: 0,
  antialias: true,
  pitchWithRotate: true,
  dragRotate: true,
  maxBounds: [
    [-72.670148, -37.530891],
    [-72.630148, -37.505891],
  ],
  maxZoom: 18.5,
  minZoom: 14.4,
});

map.addControl(new mapboxgl.NavigationControl());

map.on("load", function () {
  map.resize();
});

// Crear modal para mostrar imágenes 360
const modal = document.createElement("div");
modal.id = "modal";
modal.style.display = "none";
modal.style.position = "fixed";
modal.style.top = "0";
modal.style.left = "0";
modal.style.width = "100%";
modal.style.height = "100%";
modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
modal.style.display = "none";
modal.style.alignItems = "center";
modal.style.justifyContent = "center";
modal.style.zIndex = "1000";

const panoramaViewer = document.createElement("div");
panoramaViewer.id = "panoramaViewer";
panoramaViewer.style.width = "90%";
panoramaViewer.style.height = "80vh";
panoramaViewer.style.borderRadius = "0.5rem";

const closeButton = document.createElement("button");
closeButton.textContent = "Cerrar";
closeButton.style.position = "absolute";
closeButton.style.top = "20px";
closeButton.style.right = "20px";
closeButton.style.padding = "10px 20px";
closeButton.style.backgroundColor = "#f00";
closeButton.style.color = "#fff";
closeButton.style.border = "none";
closeButton.style.cursor = "pointer";
closeButton.style.borderRadius = "0.5rem";

closeButton.addEventListener("click", () => {
  modal.style.display = "none";
});

modal.appendChild(panoramaViewer);
modal.appendChild(closeButton);
document.body.appendChild(modal);

let markers = [];
let currentViewer = null; // Para mantener la referencia del visor actual

// Función para cargar el panorama y sus hotspots
function loadPanorama(punto) {
  // Si ya hay un visor cargado, destrúyelo antes de cargar uno nuevo
  if (currentViewer) {
    currentViewer.destroy(); // Destruir el visor anterior
    currentViewer = null; // Limpiar la referencia
  }

  // Cargar el panorama actual con sus hotspots
  currentViewer = pannellum.viewer("panoramaViewer", {
    type: "equirectangular",
    panorama: punto.image,
    autoLoad: true,
    compass: false,
    hotSpots: punto.hotspots.map((hotspot) => ({
      pitch: hotspot.pitch,
      yaw: hotspot.yaw,
      text: hotspot.text,
      createTooltipFunc: hotspot.createTooltipFunc,
      clickHandlerFunc: () => {
        // Llamar a la función loadPanorama cuando se haga clic en un hotspot
        if (hotspot.nextImage) {
          // Encontrar el siguiente punto
          const nextPunto = window.puntos.find(
            (p) => p.image === hotspot.nextImage
          ); // Buscar el siguiente punto usando la imagen
          if (nextPunto) {
            loadPanorama(nextPunto); // Cargar el siguiente panorama como un nuevo evento
          } else {
            alert("No hay más puntos.");
          }
        } else {
          // Si no hay siguiente imagen, puedes mostrar el mensaje o cerrar el modal
          alert("No hay más imágenes.");
        }
      },
      cssClass: "pannellum-hotspot",
    })),
    onLoad: () => {
      console.log("Imagen cargada y hotspots aplicados correctamente.");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.puntos) {
    window.puntos.forEach((punto, puntoIndex) => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.width = "26px";
      el.style.height = "26px";
      el.style.borderRadius = "100%";
      el.style.border = "2px solid rgb(0, 255, 4)";
      el.style.display = "none";

      const marker = new mapboxgl.Marker(el)
        .setLngLat(punto.coordinates)
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        modal.style.display = "flex";
        loadPanorama(punto); // Llamar a la función para cargar el panorama inicial
      });

      markers.push(el);
    });

    map.on("zoom", () => {
      const currentZoom = map.getZoom();
      markers.forEach((markerElement) => {
        markerElement.style.display = currentZoom >= 15.25 ? "block" : "none";
      });
    });
  }
});

// Cierra el modal al hacer clic fuera del contenido
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
    if (currentViewer) {
      currentViewer.destroy();
      currentViewer = null; // Limpiar la referencia
    }
  }
});
