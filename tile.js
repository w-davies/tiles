import { BackgroundGeolocation } from "@capacitor-community/background-geolocation";

/* ---------------- Tile System Settings ---------------- */
const TILE_SIZE_M = 100;
const DEG_PER_M_LAT = 1 / 111320;

let visited = new Set(JSON.parse(localStorage.getItem("visitedTiles") || "[]"));

document.getElementById("tileCount").innerText = "Tiles: " + visited.size;

/* Compute tile boundaries */
function computeTile(lat, lon) {
  const latSize = TILE_SIZE_M * DEG_PER_M_LAT;
  const lonSize = TILE_SIZE_M * (1 / (111320 * Math.cos(lat * Math.PI/180)));

  return {
    x: Math.floor(lon / lonSize),
    y: Math.floor(lat / latSize),
    latSize,
    lonSize
  };
}

/* ---------------- Map ---------------- */
const map = L.map("map").setView([52.0, -3.0], 8);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

let userMarker = null;
let currentTileRect = null;

function drawTile(x, y, latSize, lonSize, color="#00FF73", weight=2) {
  const minLat = y * latSize;
  const maxLat = minLat + latSize;
  const minLon = x * lonSize;
  const maxLon = minLon + lonSize;

  return L.rectangle([[minLat,minLon],[maxLat,maxLon]], {
    color,
    weight,
    fillOpacity: 0
  }).addTo(map);
}

/* Draw saved tiles */
for (const key of visited) {
  const [x, y] = key.split("_").map(Number);
  const latSize = TILE_SIZE_M * DEG_PER_M_LAT;
  const approxLat = y * latSize;
  const lonSize = TILE_SIZE_M * (1 / (111320 * Math.cos(approxLat * Math.PI/180)));

  drawTile(x, y, latSize, lonSize);
}

/* ---------------- Handle GPS updates ---------------- */
function handleLocation(loc) {
  const lat = loc.latitude;
  const lon = loc.longitude;

  document.getElementById("gpsStatus").innerText =
    `GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  if (!userMarker) {
    userMarker = L.marker([lat, lon]).addTo(map);
    map.setView([lat, lon], 16);
  } else {
    userMarker.setLatLng([lat, lon]);
  }

  const tile = computeTile(lat, lon);
  const key = `${tile.x}_${tile.y}`;

  // Highlight tile
  if (currentTileRect) map.removeLayer(currentTileRect);
  currentTileRect = drawTile(tile.x, tile.y, tile.latSize, tile.lonSize, "#FFFF00", 3);

  // Save tile
  if (!visited.has(key)) {
    visited.add(key);
    localStorage.setItem("visitedTiles", JSON.stringify([...visited]));
    drawTile(tile.x, tile.y, tile.latSize, tile.lonSize);
    document.getElementById("tileCount").innerText = "Tiles: " + visited.size;
  }
}

/* ---------------- Start Background Tracking ---------------- */
BackgroundGeolocation.addWatcher(
  {
    backgroundTitle: "Tracking tiles",
    backgroundMessage: "Tile tracker running",
    requestPermissions: true,
    stale: false,
  },
  location => {
    if (location) handleLocation(location);
  }
);
