// The zone ownership rules live with the editor, so the editor, the panel and
// the Lovelace card all drop the same zones.
export { removeOrphanedSensorZones, removeZonesOwnedBySensor } from '../js/floor-planner-zones.mjs';

export const zoneOwnerIsAvailable = (owner, sensorIds) =>
  !owner || (sensorIds instanceof Set ? sensorIds : new Set(sensorIds || [])).has(owner);

export const hasUnknownVisiblePeopleCount = (rooms, people) => {
  const roomsWithMarkers = new Set((people || []).map(person => person.roomId));
  return (rooms || []).some(room => room.visible !== false
    && !room.peopleCountKnown
    && (room.available === false || room.occupied || roomsWithMarkers.has(room.roomId)));
};

export class FloorPlanValidationError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = 'FloorPlanValidationError';
    this.validationCode = code;
    this.details = details;
  }
}

export const floorPlanValidationCopy = {
  en: {
    invalid_project: 'Check the floor plan and zones before saving.',
    duplicate_room: 'A room appears more than once.',
    sensor_outside_room: 'Place every sensor inside a room before saving.',
    duplicate_device: 'Link each Home Assistant device to only one sensor.',
    wall_opening: 'This wall has an existing opening that must be adjusted first.',
    opening_off_wall: 'Move every door, window and mirror in {room} onto a wall before saving.',
    calibration_device: 'The linked device in {room} belongs to the saved calibration.',
    calibration_sensor: 'The calibration sensor in {room} is required by the saved calibration.',
    zone_owner_outside_room: 'A source-owned zone in {room} must stay with its linked sensor.',
  },
  nl: {
    invalid_project: 'Controleer de plattegrond en zones voordat je opslaat.',
    duplicate_room: 'Een kamer komt meer dan één keer voor.',
    sensor_outside_room: 'Plaats elke sensor in een kamer voordat je opslaat.',
    duplicate_device: 'Koppel elk Home Assistant-apparaat aan één sensor.',
    wall_opening: 'Deze muur heeft een bestaande opening die eerst moet worden aangepast.',
    opening_off_wall: 'Zet elke deur, elk raam en elke spiegel in {room} tegen een muur voordat je opslaat.',
    calibration_device: 'Het gekoppelde apparaat in {room} hoort bij de opgeslagen kalibratie.',
    calibration_sensor: 'De kalibratiesensor in {room} is nodig voor de opgeslagen kalibratie.',
    zone_owner_outside_room: 'Een brongebonden zone in {room} moet bij de gekoppelde sensor blijven.',
  },
  de: {
    invalid_project: 'Prüfe den Grundriss und die Zonen vor dem Speichern.',
    duplicate_room: 'Ein Raum kommt mehr als einmal vor.',
    sensor_outside_room: 'Platziere vor dem Speichern jeden Sensor in einem Raum.',
    duplicate_device: 'Verknüpfe jedes Home-Assistant-Gerät nur mit einem Sensor.',
    wall_opening: 'Diese Wand hat eine vorhandene Öffnung, die zuerst angepasst werden muss.',
    opening_off_wall: 'Setze vor dem Speichern jede Tür, jedes Fenster und jeden Spiegel in {room} an eine Wand.',
    calibration_device: 'Das verknüpfte Gerät in {room} gehört zur gespeicherten Kalibrierung.',
    calibration_sensor: 'Der Kalibrierungssensor in {room} wird für die gespeicherte Kalibrierung benötigt.',
    zone_owner_outside_room: 'Eine quellgebundene Zone in {room} muss bei ihrem verknüpften Sensor bleiben.',
  },
  fr: {
    invalid_project: 'Vérifiez le plan et les zones avant l\'enregistrement.',
    duplicate_room: 'Une pièce apparaît plusieurs fois.',
    sensor_outside_room: 'Placez chaque capteur dans une pièce avant l\'enregistrement.',
    duplicate_device: 'N\'associez chaque appareil Home Assistant qu\'à un seul capteur.',
    wall_opening: 'Ce mur comporte une ouverture existante qui doit d\'abord être ajustée.',
    opening_off_wall: 'Placez chaque porte, fenêtre et miroir de {room} contre un mur avant l\'enregistrement.',
    calibration_device: 'L\'appareil associé dans {room} appartient à l\'étalonnage enregistré.',
    calibration_sensor: 'Le capteur d\'étalonnage de {room} est requis par l\'étalonnage enregistré.',
    zone_owner_outside_room: 'Une zone liée à une source dans {room} doit rester avec son capteur associé.',
  },
  es: {
    invalid_project: 'Comprueba el plano y las zonas antes de guardar.',
    duplicate_room: 'Una habitación aparece más de una vez.',
    sensor_outside_room: 'Coloca cada sensor dentro de una habitación antes de guardar.',
    duplicate_device: 'Vincula cada dispositivo de Home Assistant a un solo sensor.',
    wall_opening: 'Esta pared tiene una abertura existente que debe ajustarse primero.',
    opening_off_wall: 'Coloca cada puerta, ventana y espejo de {room} en una pared antes de guardar.',
    calibration_device: 'El dispositivo vinculado en {room} pertenece a la calibración guardada.',
    calibration_sensor: 'La calibración guardada necesita el sensor de calibración de {room}.',
    zone_owner_outside_room: 'Una zona vinculada a una fuente en {room} debe permanecer con su sensor asociado.',
  },
};

export const floorPlanValidationMessage = (error, language) => {
  const catalog = floorPlanValidationCopy[String(language || 'en').split('-')[0]]
    || floorPlanValidationCopy.en;
  let message = catalog[error.validationCode] || floorPlanValidationCopy.en.invalid_project;
  for (const [name, value] of Object.entries(error.details || {})) {
    message = message.split(`{${name}}`).join(String(value));
  }
  return message;
};
