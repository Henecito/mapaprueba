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

function loadPanorama(punto) {
  if (currentViewer) {
    currentViewer.destroy();
    currentViewer = null;
  }

  currentViewer = pannellum.viewer("panoramaViewer", {
    type: "equirectangular",
    panorama: punto.image,
    autoLoad: true,
    compass: false,
    hotSpots: punto.hotspots.map((hotspot) => {
      if (hotspot.type === "dropdown") {
        return {
            pitch: hotspot.pitch,
            yaw: hotspot.yaw,
            createTooltipFunc: (hotSpotDiv) => {
                // Crear el icono del hotspot
                const hotspotIcon = document.createElement("img");
                hotspotIcon.src = "./assets/img/iconos/arrow.png"; // Icono del hotspot
                hotspotIcon.style.width = "40px";
                hotspotIcon.style.cursor = "pointer";
                hotspotIcon.style.position = "relative";
                hotspotIcon.style.zIndex = "1001"; // Asegura que esté encima
    
                // Crear el contenedor del dropdown (oculto por defecto)
                const dropdownContainer = document.createElement("div");
                dropdownContainer.style.display = "none"; // Oculto al inicio
                dropdownContainer.style.position = "absolute";
                dropdownContainer.style.bottom = "50px"; // Para que aparezca arriba del hotspot
                dropdownContainer.style.left = "-55px"; // Ajuste de posición horizontal
                dropdownContainer.style.background = "white";
                dropdownContainer.style.padding = "5px";
                dropdownContainer.style.border = "1px solid #ccc";
                dropdownContainer.style.borderRadius = "5px";
                dropdownContainer.style.boxShadow = "0px 4px 6px rgba(0,0,0,0.2)";
                dropdownContainer.style.zIndex = "1002"; // Para que esté sobre otros elementos
    
                // Crear el dropdown
                dropdownContainer.innerHTML = `
                  <select id="floorSelector" class="hotspot-dropdown">
                    <option value="">Selecciona un Piso</option>
                    ${hotspot.floors.map(floor => `<option value="${floor.image}">${floor.name}</option>`).join('')}
                  </select>
                `;
    
                // Mostrar el dropdown al hacer clic en el hotspot
                hotspotIcon.addEventListener("click", (event) => {
                    event.stopPropagation(); // Evita que el clic se propague al documento
                    dropdownContainer.style.display = dropdownContainer.style.display === "none" ? "block" : "none";
                });
    
                // Cerrar el dropdown si se hace clic fuera de él
                document.addEventListener("click", (event) => {
                    if (!hotSpotDiv.contains(event.target)) {
                        dropdownContainer.style.display = "none";
                    }
                });
    
                // Cambiar de piso al seleccionar una opción
                dropdownContainer.querySelector("#floorSelector").addEventListener("change", function () {
                    const selectedImage = this.value;
                    if (selectedImage) {
                        const nextPunto = window.puntos.find(p => p.image === selectedImage);
                        if (nextPunto) {
                            loadPanorama(nextPunto);
                            dropdownContainer.style.display = "none"; // Ocultar el dropdown después de seleccionar
                        } else {
                            alert("Piso no encontrado.");
                        }
                    }
                });
    
                // Agregar el icono y el dropdown al hotspot
                hotSpotDiv.appendChild(hotspotIcon);
                hotSpotDiv.appendChild(dropdownContainer);
            },
            cssClass: "pannellum-hotspot"
        };
      } else {
        return {
          pitch: hotspot.pitch,
          yaw: hotspot.yaw,
          text: hotspot.text,
          createTooltipFunc: hotspot.createTooltipFunc,
          clickHandlerFunc: () => {
            if (hotspot.nextImage) {
              const nextPunto = window.puntos.find(p => p.image === hotspot.nextImage);
              if (nextPunto) {
                loadPanorama(nextPunto);
              } else {
                alert("No hay más puntos.");
              }
            }
          },
          cssClass: "pannellum-hotspot"
        };
      }
    }),
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
