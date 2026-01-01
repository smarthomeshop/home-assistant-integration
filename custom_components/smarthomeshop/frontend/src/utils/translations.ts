/**
 * SmartHomeShop Cards - Internationalization (i18n)
 *
 * All strings in English as base, with translations for popular languages.
 * Falls back to English if translation is not available.
 */

export interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    unknown: string;
    today: string;
    week: string;
    month: string;
    year: string;
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
    current: string;
    total: string;
    temperature: string;
    humidity: string;
    settings: string;
    save: string;
    cancel: string;
    close: string;
    edit: string;
    delete: string;
    add: string;
    name: string;
    value: string;
    unit: string;
    active: string;
    inactive: string;
    on: string;
    off: string;
    yes: string;
    no: string;
    show: string;
    hide: string;
  };

  // WaterFlowKit Card
  waterflowkit: {
    title: string;
    subtitle: string;
    pipe1: string;
    pipe2: string;
    currentFlow: string;
    totalConsumption: string;
    flowRate: string;
    perHour: string;
    noFlow: string;
    flowing: string;
    waterTemperature: string;
    showPipe1: string;
    showPipe2: string;
    showTemperature: string;
    pipe1Name: string;
    pipe2Name: string;
  };

  // WaterP1MeterKit Card
  waterp1: {
    title: string;
    water: string;
    energy: string;
    energyActive: string;
    currentUsage: string;
    leakDetection: string;
    monitoringActivity: string;
    meter: string;
    currentPower: string;
    electricityToday: string;
    gasToday: string;
    waterLast24h: string;
    max: string;
  };

  // WaterMeterKit Card
  watermeter: {
    title: string;
    waterUsage: string;
    dailyUsage: string;
    weeklyUsage: string;
    monthlyUsage: string;
    yearlyUsage: string;
    calibration: string;
    lastCalibration: string;
    sinceLast: string;
  };

  // UltimateSensor Card
  ultimatesensor: {
    title: string;
    roomScore: string;
    excellent: string;
    good: string;
    moderate: string;
    poor: string;
    unhealthy: string;
    hazardous: string;
    presence: string;
    detected: string;
    notDetected: string;
    targets: string;
    co2Level: string;
    vocIndex: string;
    noxIndex: string;
    illuminance: string;
    pm1: string;
    pm25: string;
    pm4: string;
    pm10: string;
    radarView: string;
    roomView: string;
    view2D: string;
    view3D: string;
    zoneOccupancy: string;
    zone: string;
    recommendations: string;
    ventilateNow: string;
    openWindow: string;
    airQualityPoor: string;
    tooHumid: string;
    tooDry: string;
    tooCold: string;
    tooWarm: string;
  };

  // Settings/Editor
  editor: {
    deviceId: string;
    selectDevice: string;
    appearance: string;
    showGraph: string;
    showWater: string;
    showEnergy: string;
    graphType: string;
    historyGraph: string;
    liveGraph: string;
    displayOptions: string;
  };
}

// English (default/fallback)
const en: Translations = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    unknown: 'Unknown',
    today: 'Today',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    current: 'Current',
    total: 'Total',
    temperature: 'Temperature',
    humidity: 'Humidity',
    settings: 'Settings',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    name: 'Name',
    value: 'Value',
    unit: 'Unit',
    active: 'Active',
    inactive: 'Inactive',
    on: 'On',
    off: 'Off',
    yes: 'Yes',
    no: 'No',
    show: 'Show',
    hide: 'Hide',
  },
  waterflowkit: {
    title: 'WaterFlowKit',
    subtitle: 'Dual flow monitoring',
    pipe1: 'Pipe 1',
    pipe2: 'Pipe 2',
    currentFlow: 'Current flow',
    totalConsumption: 'Total consumption',
    flowRate: 'Flow rate',
    perHour: 'per hour',
    noFlow: 'No flow',
    flowing: 'Flowing',
    waterTemperature: 'Water temperature',
    showPipe1: 'Show Pipe 1',
    showPipe2: 'Show Pipe 2',
    showTemperature: 'Show temperature',
    pipe1Name: 'Pipe 1 name',
    pipe2Name: 'Pipe 2 name',
  },
  waterp1: {
    title: 'WaterP1MeterKit',
    water: 'Water',
    energy: 'Energy',
    energyActive: 'Energy active',
    currentUsage: 'Current water usage',
    leakDetection: 'Leak Detection',
    monitoringActivity: 'Monitoring activity',
    meter: 'Meter',
    currentPower: 'Current power',
    electricityToday: 'Electricity today',
    gasToday: 'Gas today',
    waterLast24h: 'Water last 24 hours',
    max: 'max',
  },
  watermeter: {
    title: 'WaterMeterKit',
    waterUsage: 'Water usage',
    dailyUsage: 'Daily usage',
    weeklyUsage: 'Weekly usage',
    monthlyUsage: 'Monthly usage',
    yearlyUsage: 'Yearly usage',
    calibration: 'Calibration',
    lastCalibration: 'Last calibration',
    sinceLast: 'since calibration',
  },
  ultimatesensor: {
    title: 'UltimateSensor',
    roomScore: 'Room Score',
    excellent: 'Excellent',
    good: 'Good',
    moderate: 'Moderate',
    poor: 'Poor',
    unhealthy: 'Unhealthy',
    hazardous: 'Hazardous',
    presence: 'Presence',
    detected: 'Detected',
    notDetected: 'Not detected',
    targets: 'Targets',
    co2Level: 'CO₂ level',
    vocIndex: 'VOC index',
    noxIndex: 'NOx index',
    illuminance: 'Illuminance',
    pm1: 'PM1.0',
    pm25: 'PM2.5',
    pm4: 'PM4.0',
    pm10: 'PM10',
    radarView: 'Radar view',
    roomView: 'Room view',
    view2D: '2D',
    view3D: '3D',
    zoneOccupancy: 'Zone occupancy',
    zone: 'Zone',
    recommendations: 'Recommendations',
    ventilateNow: 'Ventilate now!',
    openWindow: 'Open a window',
    airQualityPoor: 'Air quality is poor',
    tooHumid: 'Too humid',
    tooDry: 'Too dry',
    tooCold: 'Too cold',
    tooWarm: 'Too warm',
  },
  editor: {
    deviceId: 'Device ID',
    selectDevice: 'Select device',
    appearance: 'Appearance',
    showGraph: 'Show graph',
    showWater: 'Show water',
    showEnergy: 'Show energy',
    graphType: 'Graph type',
    historyGraph: 'History graph',
    liveGraph: 'Live graph',
    displayOptions: 'Display options',
  },
};

// Dutch (Nederlands)
const nl: Translations = {
  common: {
    loading: 'Laden...',
    error: 'Fout',
    unknown: 'Onbekend',
    today: 'Vandaag',
    week: 'Week',
    month: 'Maand',
    year: 'Jaar',
    daily: 'Dagelijks',
    weekly: 'Wekelijks',
    monthly: 'Maandelijks',
    yearly: 'Jaarlijks',
    current: 'Huidig',
    total: 'Totaal',
    temperature: 'Temperatuur',
    humidity: 'Luchtvochtigheid',
    settings: 'Instellingen',
    save: 'Opslaan',
    cancel: 'Annuleren',
    close: 'Sluiten',
    edit: 'Bewerken',
    delete: 'Verwijderen',
    add: 'Toevoegen',
    name: 'Naam',
    value: 'Waarde',
    unit: 'Eenheid',
    active: 'Actief',
    inactive: 'Inactief',
    on: 'Aan',
    off: 'Uit',
    yes: 'Ja',
    no: 'Nee',
    show: 'Tonen',
    hide: 'Verbergen',
  },
  waterflowkit: {
    title: 'WaterFlowKit',
    subtitle: 'Dubbele flowmeting',
    pipe1: 'Leiding 1',
    pipe2: 'Leiding 2',
    currentFlow: 'Huidige flow',
    totalConsumption: 'Totaal verbruik',
    flowRate: 'Debiet',
    perHour: 'per uur',
    noFlow: 'Geen flow',
    flowing: 'Stromend',
    waterTemperature: 'Watertemperatuur',
    showPipe1: 'Toon leiding 1',
    showPipe2: 'Toon leiding 2',
    showTemperature: 'Toon temperatuur',
    pipe1Name: 'Naam leiding 1',
    pipe2Name: 'Naam leiding 2',
  },
  waterp1: {
    title: 'WaterP1MeterKit',
    water: 'Water',
    energy: 'Energie',
    energyActive: 'Energie actief',
    currentUsage: 'Huidig waterverbruik',
    leakDetection: 'Lekdetectie',
    monitoringActivity: 'Bewakingsactiviteit',
    meter: 'Meter',
    currentPower: 'Huidig vermogen',
    electricityToday: 'Stroom vandaag',
    gasToday: 'Gas vandaag',
    waterLast24h: 'Water laatste 24 uur',
    max: 'max',
  },
  watermeter: {
    title: 'WaterMeterKit',
    waterUsage: 'Waterverbruik',
    dailyUsage: 'Dagelijks verbruik',
    weeklyUsage: 'Wekelijks verbruik',
    monthlyUsage: 'Maandelijks verbruik',
    yearlyUsage: 'Jaarlijks verbruik',
    calibration: 'Kalibratie',
    lastCalibration: 'Laatste kalibratie',
    sinceLast: 'sinds kalibratie',
  },
  ultimatesensor: {
    title: 'UltimateSensor',
    roomScore: 'Kamerscore',
    excellent: 'Uitstekend',
    good: 'Goed',
    moderate: 'Matig',
    poor: 'Slecht',
    unhealthy: 'Ongezond',
    hazardous: 'Gevaarlijk',
    presence: 'Aanwezigheid',
    detected: 'Gedetecteerd',
    notDetected: 'Niet gedetecteerd',
    targets: 'Doelen',
    co2Level: 'CO₂-niveau',
    vocIndex: 'VOC-index',
    noxIndex: 'NOx-index',
    illuminance: 'Verlichtingssterkte',
    pm1: 'PM1.0',
    pm25: 'PM2.5',
    pm4: 'PM4.0',
    pm10: 'PM10',
    radarView: 'Radarweergave',
    roomView: 'Kamerweergave',
    view2D: '2D',
    view3D: '3D',
    zoneOccupancy: 'Zone bezetting',
    zone: 'Zone',
    recommendations: 'Aanbevelingen',
    ventilateNow: 'Ventileer nu!',
    openWindow: 'Open een raam',
    airQualityPoor: 'Luchtkwaliteit is slecht',
    tooHumid: 'Te vochtig',
    tooDry: 'Te droog',
    tooCold: 'Te koud',
    tooWarm: 'Te warm',
  },
  editor: {
    deviceId: 'Apparaat-ID',
    selectDevice: 'Selecteer apparaat',
    appearance: 'Uiterlijk',
    showGraph: 'Toon grafiek',
    showWater: 'Toon water',
    showEnergy: 'Toon energie',
    graphType: 'Grafiektype',
    historyGraph: 'Historiegrafiek',
    liveGraph: 'Live grafiek',
    displayOptions: 'Weergaveopties',
  },
};

// German (Deutsch)
const de: Translations = {
  common: {
    loading: 'Laden...',
    error: 'Fehler',
    unknown: 'Unbekannt',
    today: 'Heute',
    week: 'Woche',
    month: 'Monat',
    year: 'Jahr',
    daily: 'Täglich',
    weekly: 'Wöchentlich',
    monthly: 'Monatlich',
    yearly: 'Jährlich',
    current: 'Aktuell',
    total: 'Gesamt',
    temperature: 'Temperatur',
    humidity: 'Luftfeuchtigkeit',
    settings: 'Einstellungen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    close: 'Schließen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    add: 'Hinzufügen',
    name: 'Name',
    value: 'Wert',
    unit: 'Einheit',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    on: 'An',
    off: 'Aus',
    yes: 'Ja',
    no: 'Nein',
    show: 'Anzeigen',
    hide: 'Ausblenden',
  },
  waterflowkit: {
    title: 'WaterFlowKit',
    subtitle: 'Doppelte Durchflussmessung',
    pipe1: 'Leitung 1',
    pipe2: 'Leitung 2',
    currentFlow: 'Aktueller Durchfluss',
    totalConsumption: 'Gesamtverbrauch',
    flowRate: 'Durchflussrate',
    perHour: 'pro Stunde',
    noFlow: 'Kein Durchfluss',
    flowing: 'Fließend',
    waterTemperature: 'Wassertemperatur',
    showPipe1: 'Leitung 1 anzeigen',
    showPipe2: 'Leitung 2 anzeigen',
    showTemperature: 'Temperatur anzeigen',
    pipe1Name: 'Name Leitung 1',
    pipe2Name: 'Name Leitung 2',
  },
  waterp1: {
    title: 'WaterP1MeterKit',
    water: 'Wasser',
    energy: 'Energie',
    energyActive: 'Energie aktiv',
    currentUsage: 'Aktueller Wasserverbrauch',
    leakDetection: 'Leckerkennung',
    monitoringActivity: 'Überwachungsaktivität',
    meter: 'Zähler',
    currentPower: 'Aktuelle Leistung',
    electricityToday: 'Strom heute',
    gasToday: 'Gas heute',
    waterLast24h: 'Wasser letzte 24 Stunden',
    max: 'max',
  },
  watermeter: {
    title: 'WaterMeterKit',
    waterUsage: 'Wasserverbrauch',
    dailyUsage: 'Täglicher Verbrauch',
    weeklyUsage: 'Wöchentlicher Verbrauch',
    monthlyUsage: 'Monatlicher Verbrauch',
    yearlyUsage: 'Jährlicher Verbrauch',
    calibration: 'Kalibrierung',
    lastCalibration: 'Letzte Kalibrierung',
    sinceLast: 'seit Kalibrierung',
  },
  ultimatesensor: {
    title: 'UltimateSensor',
    roomScore: 'Raumbewertung',
    excellent: 'Ausgezeichnet',
    good: 'Gut',
    moderate: 'Mäßig',
    poor: 'Schlecht',
    unhealthy: 'Ungesund',
    hazardous: 'Gefährlich',
    presence: 'Anwesenheit',
    detected: 'Erkannt',
    notDetected: 'Nicht erkannt',
    targets: 'Ziele',
    co2Level: 'CO₂-Niveau',
    vocIndex: 'VOC-Index',
    noxIndex: 'NOx-Index',
    illuminance: 'Beleuchtungsstärke',
    pm1: 'PM1.0',
    pm25: 'PM2.5',
    pm4: 'PM4.0',
    pm10: 'PM10',
    radarView: 'Radaransicht',
    roomView: 'Raumansicht',
    view2D: '2D',
    view3D: '3D',
    zoneOccupancy: 'Zonenbelegung',
    zone: 'Zone',
    recommendations: 'Empfehlungen',
    ventilateNow: 'Jetzt lüften!',
    openWindow: 'Öffnen Sie ein Fenster',
    airQualityPoor: 'Luftqualität ist schlecht',
    tooHumid: 'Zu feucht',
    tooDry: 'Zu trocken',
    tooCold: 'Zu kalt',
    tooWarm: 'Zu warm',
  },
  editor: {
    deviceId: 'Geräte-ID',
    selectDevice: 'Gerät auswählen',
    appearance: 'Erscheinungsbild',
    showGraph: 'Diagramm anzeigen',
    showWater: 'Wasser anzeigen',
    showEnergy: 'Energie anzeigen',
    graphType: 'Diagrammtyp',
    historyGraph: 'Verlaufsdiagramm',
    liveGraph: 'Live-Diagramm',
    displayOptions: 'Anzeigeoptionen',
  },
};

// French (Français)
const fr: Translations = {
  common: {
    loading: 'Chargement...',
    error: 'Erreur',
    unknown: 'Inconnu',
    today: "Aujourd'hui",
    week: 'Semaine',
    month: 'Mois',
    year: 'Année',
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    yearly: 'Annuel',
    current: 'Actuel',
    total: 'Total',
    temperature: 'Température',
    humidity: 'Humidité',
    settings: 'Paramètres',
    save: 'Enregistrer',
    cancel: 'Annuler',
    close: 'Fermer',
    edit: 'Modifier',
    delete: 'Supprimer',
    add: 'Ajouter',
    name: 'Nom',
    value: 'Valeur',
    unit: 'Unité',
    active: 'Actif',
    inactive: 'Inactif',
    on: 'Activé',
    off: 'Désactivé',
    yes: 'Oui',
    no: 'Non',
    show: 'Afficher',
    hide: 'Masquer',
  },
  waterflowkit: {
    title: 'WaterFlowKit',
    subtitle: 'Double mesure de débit',
    pipe1: 'Conduite 1',
    pipe2: 'Conduite 2',
    currentFlow: 'Débit actuel',
    totalConsumption: 'Consommation totale',
    flowRate: 'Débit',
    perHour: 'par heure',
    noFlow: 'Pas de débit',
    flowing: 'En cours',
    waterTemperature: "Température de l'eau",
    showPipe1: 'Afficher conduite 1',
    showPipe2: 'Afficher conduite 2',
    showTemperature: 'Afficher température',
    pipe1Name: 'Nom conduite 1',
    pipe2Name: 'Nom conduite 2',
  },
  waterp1: {
    title: 'WaterP1MeterKit',
    water: 'Eau',
    energy: 'Énergie',
    energyActive: 'Énergie active',
    currentUsage: "Consommation d'eau actuelle",
    leakDetection: 'Détection de fuite',
    monitoringActivity: 'Activité de surveillance',
    meter: 'Compteur',
    currentPower: 'Puissance actuelle',
    electricityToday: "Électricité aujourd'hui",
    gasToday: "Gaz aujourd'hui",
    waterLast24h: 'Eau dernières 24 heures',
    max: 'max',
  },
  watermeter: {
    title: 'WaterMeterKit',
    waterUsage: "Consommation d'eau",
    dailyUsage: 'Consommation quotidienne',
    weeklyUsage: 'Consommation hebdomadaire',
    monthlyUsage: 'Consommation mensuelle',
    yearlyUsage: 'Consommation annuelle',
    calibration: 'Calibration',
    lastCalibration: 'Dernière calibration',
    sinceLast: 'depuis calibration',
  },
  ultimatesensor: {
    title: 'UltimateSensor',
    roomScore: 'Score de la pièce',
    excellent: 'Excellent',
    good: 'Bon',
    moderate: 'Modéré',
    poor: 'Mauvais',
    unhealthy: 'Malsain',
    hazardous: 'Dangereux',
    presence: 'Présence',
    detected: 'Détectée',
    notDetected: 'Non détectée',
    targets: 'Cibles',
    co2Level: 'Niveau de CO₂',
    vocIndex: 'Indice COV',
    noxIndex: 'Indice NOx',
    illuminance: 'Éclairement',
    pm1: 'PM1.0',
    pm25: 'PM2.5',
    pm4: 'PM4.0',
    pm10: 'PM10',
    radarView: 'Vue radar',
    roomView: 'Vue de la pièce',
    view2D: '2D',
    view3D: '3D',
    zoneOccupancy: 'Occupation de zone',
    zone: 'Zone',
    recommendations: 'Recommandations',
    ventilateNow: 'Aérez maintenant !',
    openWindow: 'Ouvrez une fenêtre',
    airQualityPoor: "La qualité de l'air est mauvaise",
    tooHumid: 'Trop humide',
    tooDry: 'Trop sec',
    tooCold: 'Trop froid',
    tooWarm: 'Trop chaud',
  },
  editor: {
    deviceId: 'ID appareil',
    selectDevice: 'Sélectionner appareil',
    appearance: 'Apparence',
    showGraph: 'Afficher graphique',
    showWater: "Afficher l'eau",
    showEnergy: "Afficher l'énergie",
    graphType: 'Type de graphique',
    historyGraph: 'Graphique historique',
    liveGraph: 'Graphique en direct',
    displayOptions: "Options d'affichage",
  },
};

// Spanish (Español)
const es: Translations = {
  common: {
    loading: 'Cargando...',
    error: 'Error',
    unknown: 'Desconocido',
    today: 'Hoy',
    week: 'Semana',
    month: 'Mes',
    year: 'Año',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    yearly: 'Anual',
    current: 'Actual',
    total: 'Total',
    temperature: 'Temperatura',
    humidity: 'Humedad',
    settings: 'Configuración',
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    edit: 'Editar',
    delete: 'Eliminar',
    add: 'Añadir',
    name: 'Nombre',
    value: 'Valor',
    unit: 'Unidad',
    active: 'Activo',
    inactive: 'Inactivo',
    on: 'Encendido',
    off: 'Apagado',
    yes: 'Sí',
    no: 'No',
    show: 'Mostrar',
    hide: 'Ocultar',
  },
  waterflowkit: {
    title: 'WaterFlowKit',
    subtitle: 'Medición de flujo dual',
    pipe1: 'Tubería 1',
    pipe2: 'Tubería 2',
    currentFlow: 'Flujo actual',
    totalConsumption: 'Consumo total',
    flowRate: 'Caudal',
    perHour: 'por hora',
    noFlow: 'Sin flujo',
    flowing: 'Fluyendo',
    waterTemperature: 'Temperatura del agua',
    showPipe1: 'Mostrar tubería 1',
    showPipe2: 'Mostrar tubería 2',
    showTemperature: 'Mostrar temperatura',
    pipe1Name: 'Nombre tubería 1',
    pipe2Name: 'Nombre tubería 2',
  },
  waterp1: {
    title: 'WaterP1MeterKit',
    water: 'Agua',
    energy: 'Energía',
    energyActive: 'Energía activa',
    currentUsage: 'Consumo de agua actual',
    leakDetection: 'Detección de fugas',
    monitoringActivity: 'Actividad de monitoreo',
    meter: 'Medidor',
    currentPower: 'Potencia actual',
    electricityToday: 'Electricidad hoy',
    gasToday: 'Gas hoy',
    waterLast24h: 'Agua últimas 24 horas',
    max: 'máx',
  },
  watermeter: {
    title: 'WaterMeterKit',
    waterUsage: 'Consumo de agua',
    dailyUsage: 'Consumo diario',
    weeklyUsage: 'Consumo semanal',
    monthlyUsage: 'Consumo mensual',
    yearlyUsage: 'Consumo anual',
    calibration: 'Calibración',
    lastCalibration: 'Última calibración',
    sinceLast: 'desde calibración',
  },
  ultimatesensor: {
    title: 'UltimateSensor',
    roomScore: 'Puntuación de habitación',
    excellent: 'Excelente',
    good: 'Bueno',
    moderate: 'Moderado',
    poor: 'Malo',
    unhealthy: 'No saludable',
    hazardous: 'Peligroso',
    presence: 'Presencia',
    detected: 'Detectada',
    notDetected: 'No detectada',
    targets: 'Objetivos',
    co2Level: 'Nivel de CO₂',
    vocIndex: 'Índice COV',
    noxIndex: 'Índice NOx',
    illuminance: 'Iluminancia',
    pm1: 'PM1.0',
    pm25: 'PM2.5',
    pm4: 'PM4.0',
    pm10: 'PM10',
    radarView: 'Vista radar',
    roomView: 'Vista de habitación',
    view2D: '2D',
    view3D: '3D',
    zoneOccupancy: 'Ocupación de zona',
    zone: 'Zona',
    recommendations: 'Recomendaciones',
    ventilateNow: '¡Ventila ahora!',
    openWindow: 'Abre una ventana',
    airQualityPoor: 'La calidad del aire es mala',
    tooHumid: 'Demasiado húmedo',
    tooDry: 'Demasiado seco',
    tooCold: 'Demasiado frío',
    tooWarm: 'Demasiado caliente',
  },
  editor: {
    deviceId: 'ID de dispositivo',
    selectDevice: 'Seleccionar dispositivo',
    appearance: 'Apariencia',
    showGraph: 'Mostrar gráfico',
    showWater: 'Mostrar agua',
    showEnergy: 'Mostrar energía',
    graphType: 'Tipo de gráfico',
    historyGraph: 'Gráfico histórico',
    liveGraph: 'Gráfico en vivo',
    displayOptions: 'Opciones de visualización',
  },
};

// Italian (Italiano)
const it: Translations = {
  common: {
    loading: 'Caricamento...',
    error: 'Errore',
    unknown: 'Sconosciuto',
    today: 'Oggi',
    week: 'Settimana',
    month: 'Mese',
    year: 'Anno',
    daily: 'Giornaliero',
    weekly: 'Settimanale',
    monthly: 'Mensile',
    yearly: 'Annuale',
    current: 'Attuale',
    total: 'Totale',
    temperature: 'Temperatura',
    humidity: 'Umidità',
    settings: 'Impostazioni',
    save: 'Salva',
    cancel: 'Annulla',
    close: 'Chiudi',
    edit: 'Modifica',
    delete: 'Elimina',
    add: 'Aggiungi',
    name: 'Nome',
    value: 'Valore',
    unit: 'Unità',
    active: 'Attivo',
    inactive: 'Inattivo',
    on: 'Acceso',
    off: 'Spento',
    yes: 'Sì',
    no: 'No',
    show: 'Mostra',
    hide: 'Nascondi',
  },
  waterflowkit: {
    title: 'WaterFlowKit',
    subtitle: 'Misurazione doppio flusso',
    pipe1: 'Tubo 1',
    pipe2: 'Tubo 2',
    currentFlow: 'Flusso attuale',
    totalConsumption: 'Consumo totale',
    flowRate: 'Portata',
    perHour: "all'ora",
    noFlow: 'Nessun flusso',
    flowing: 'In flusso',
    waterTemperature: "Temperatura dell'acqua",
    showPipe1: 'Mostra tubo 1',
    showPipe2: 'Mostra tubo 2',
    showTemperature: 'Mostra temperatura',
    pipe1Name: 'Nome tubo 1',
    pipe2Name: 'Nome tubo 2',
  },
  waterp1: {
    title: 'WaterP1MeterKit',
    water: 'Acqua',
    energy: 'Energia',
    energyActive: 'Energia attiva',
    currentUsage: "Consumo d'acqua attuale",
    leakDetection: 'Rilevamento perdite',
    monitoringActivity: 'Attività di monitoraggio',
    meter: 'Contatore',
    currentPower: 'Potenza attuale',
    electricityToday: 'Elettricità oggi',
    gasToday: 'Gas oggi',
    waterLast24h: 'Acqua ultime 24 ore',
    max: 'max',
  },
  watermeter: {
    title: 'WaterMeterKit',
    waterUsage: "Consumo d'acqua",
    dailyUsage: 'Consumo giornaliero',
    weeklyUsage: 'Consumo settimanale',
    monthlyUsage: 'Consumo mensile',
    yearlyUsage: 'Consumo annuale',
    calibration: 'Calibrazione',
    lastCalibration: 'Ultima calibrazione',
    sinceLast: 'dalla calibrazione',
  },
  ultimatesensor: {
    title: 'UltimateSensor',
    roomScore: 'Punteggio stanza',
    excellent: 'Eccellente',
    good: 'Buono',
    moderate: 'Moderato',
    poor: 'Scarso',
    unhealthy: 'Non salutare',
    hazardous: 'Pericoloso',
    presence: 'Presenza',
    detected: 'Rilevata',
    notDetected: 'Non rilevata',
    targets: 'Obiettivi',
    co2Level: 'Livello CO₂',
    vocIndex: 'Indice COV',
    noxIndex: 'Indice NOx',
    illuminance: 'Illuminamento',
    pm1: 'PM1.0',
    pm25: 'PM2.5',
    pm4: 'PM4.0',
    pm10: 'PM10',
    radarView: 'Vista radar',
    roomView: 'Vista stanza',
    view2D: '2D',
    view3D: '3D',
    zoneOccupancy: 'Occupazione zona',
    zone: 'Zona',
    recommendations: 'Raccomandazioni',
    ventilateNow: 'Ventila ora!',
    openWindow: 'Apri una finestra',
    airQualityPoor: "La qualità dell'aria è scarsa",
    tooHumid: 'Troppo umido',
    tooDry: 'Troppo secco',
    tooCold: 'Troppo freddo',
    tooWarm: 'Troppo caldo',
  },
  editor: {
    deviceId: 'ID dispositivo',
    selectDevice: 'Seleziona dispositivo',
    appearance: 'Aspetto',
    showGraph: 'Mostra grafico',
    showWater: 'Mostra acqua',
    showEnergy: 'Mostra energia',
    graphType: 'Tipo di grafico',
    historyGraph: 'Grafico storico',
    liveGraph: 'Grafico in tempo reale',
    displayOptions: 'Opzioni di visualizzazione',
  },
};

// Portuguese (Português)
const pt: Translations = {
  common: {
    loading: 'Carregando...',
    error: 'Erro',
    unknown: 'Desconhecido',
    today: 'Hoje',
    week: 'Semana',
    month: 'Mês',
    year: 'Ano',
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    yearly: 'Anual',
    current: 'Atual',
    total: 'Total',
    temperature: 'Temperatura',
    humidity: 'Umidade',
    settings: 'Configurações',
    save: 'Salvar',
    cancel: 'Cancelar',
    close: 'Fechar',
    edit: 'Editar',
    delete: 'Excluir',
    add: 'Adicionar',
    name: 'Nome',
    value: 'Valor',
    unit: 'Unidade',
    active: 'Ativo',
    inactive: 'Inativo',
    on: 'Ligado',
    off: 'Desligado',
    yes: 'Sim',
    no: 'Não',
    show: 'Mostrar',
    hide: 'Ocultar',
  },
  waterflowkit: {
    title: 'WaterFlowKit',
    subtitle: 'Medição de fluxo duplo',
    pipe1: 'Tubo 1',
    pipe2: 'Tubo 2',
    currentFlow: 'Fluxo atual',
    totalConsumption: 'Consumo total',
    flowRate: 'Vazão',
    perHour: 'por hora',
    noFlow: 'Sem fluxo',
    flowing: 'Fluindo',
    waterTemperature: 'Temperatura da água',
    showPipe1: 'Mostrar tubo 1',
    showPipe2: 'Mostrar tubo 2',
    showTemperature: 'Mostrar temperatura',
    pipe1Name: 'Nome tubo 1',
    pipe2Name: 'Nome tubo 2',
  },
  waterp1: {
    title: 'WaterP1MeterKit',
    water: 'Água',
    energy: 'Energia',
    energyActive: 'Energia ativa',
    currentUsage: 'Consumo de água atual',
    leakDetection: 'Detecção de vazamento',
    monitoringActivity: 'Atividade de monitoramento',
    meter: 'Medidor',
    currentPower: 'Potência atual',
    electricityToday: 'Eletricidade hoje',
    gasToday: 'Gás hoje',
    waterLast24h: 'Água últimas 24 horas',
    max: 'máx',
  },
  watermeter: {
    title: 'WaterMeterKit',
    waterUsage: 'Consumo de água',
    dailyUsage: 'Consumo diário',
    weeklyUsage: 'Consumo semanal',
    monthlyUsage: 'Consumo mensal',
    yearlyUsage: 'Consumo anual',
    calibration: 'Calibração',
    lastCalibration: 'Última calibração',
    sinceLast: 'desde calibração',
  },
  ultimatesensor: {
    title: 'UltimateSensor',
    roomScore: 'Pontuação do ambiente',
    excellent: 'Excelente',
    good: 'Bom',
    moderate: 'Moderado',
    poor: 'Ruim',
    unhealthy: 'Não saudável',
    hazardous: 'Perigoso',
    presence: 'Presença',
    detected: 'Detectada',
    notDetected: 'Não detectada',
    targets: 'Alvos',
    co2Level: 'Nível de CO₂',
    vocIndex: 'Índice COV',
    noxIndex: 'Índice NOx',
    illuminance: 'Iluminância',
    pm1: 'PM1.0',
    pm25: 'PM2.5',
    pm4: 'PM4.0',
    pm10: 'PM10',
    radarView: 'Vista radar',
    roomView: 'Vista do ambiente',
    view2D: '2D',
    view3D: '3D',
    zoneOccupancy: 'Ocupação da zona',
    zone: 'Zona',
    recommendations: 'Recomendações',
    ventilateNow: 'Ventile agora!',
    openWindow: 'Abra uma janela',
    airQualityPoor: 'A qualidade do ar está ruim',
    tooHumid: 'Muito úmido',
    tooDry: 'Muito seco',
    tooCold: 'Muito frio',
    tooWarm: 'Muito quente',
  },
  editor: {
    deviceId: 'ID do dispositivo',
    selectDevice: 'Selecionar dispositivo',
    appearance: 'Aparência',
    showGraph: 'Mostrar gráfico',
    showWater: 'Mostrar água',
    showEnergy: 'Mostrar energia',
    graphType: 'Tipo de gráfico',
    historyGraph: 'Gráfico histórico',
    liveGraph: 'Gráfico ao vivo',
    displayOptions: 'Opções de exibição',
  },
};

// Polish (Polski)
const pl: Translations = {
  common: {
    loading: 'Ładowanie...',
    error: 'Błąd',
    unknown: 'Nieznany',
    today: 'Dzisiaj',
    week: 'Tydzień',
    month: 'Miesiąc',
    year: 'Rok',
    daily: 'Dziennie',
    weekly: 'Tygodniowo',
    monthly: 'Miesięcznie',
    yearly: 'Rocznie',
    current: 'Bieżący',
    total: 'Łącznie',
    temperature: 'Temperatura',
    humidity: 'Wilgotność',
    settings: 'Ustawienia',
    save: 'Zapisz',
    cancel: 'Anuluj',
    close: 'Zamknij',
    edit: 'Edytuj',
    delete: 'Usuń',
    add: 'Dodaj',
    name: 'Nazwa',
    value: 'Wartość',
    unit: 'Jednostka',
    active: 'Aktywny',
    inactive: 'Nieaktywny',
    on: 'Włączony',
    off: 'Wyłączony',
    yes: 'Tak',
    no: 'Nie',
    show: 'Pokaż',
    hide: 'Ukryj',
  },
  waterflowkit: {
    title: 'WaterFlowKit',
    subtitle: 'Podwójny pomiar przepływu',
    pipe1: 'Rura 1',
    pipe2: 'Rura 2',
    currentFlow: 'Bieżący przepływ',
    totalConsumption: 'Całkowite zużycie',
    flowRate: 'Przepływ',
    perHour: 'na godzinę',
    noFlow: 'Brak przepływu',
    flowing: 'Przepływa',
    waterTemperature: 'Temperatura wody',
    showPipe1: 'Pokaż rurę 1',
    showPipe2: 'Pokaż rurę 2',
    showTemperature: 'Pokaż temperaturę',
    pipe1Name: 'Nazwa rury 1',
    pipe2Name: 'Nazwa rury 2',
  },
  waterp1: {
    title: 'WaterP1MeterKit',
    water: 'Woda',
    energy: 'Energia',
    energyActive: 'Energia aktywna',
    currentUsage: 'Bieżące zużycie wody',
    leakDetection: 'Wykrywanie wycieków',
    monitoringActivity: 'Aktywność monitorowania',
    meter: 'Licznik',
    currentPower: 'Bieżąca moc',
    electricityToday: 'Prąd dzisiaj',
    gasToday: 'Gaz dzisiaj',
    waterLast24h: 'Woda ostatnie 24 godziny',
    max: 'maks',
  },
  watermeter: {
    title: 'WaterMeterKit',
    waterUsage: 'Zużycie wody',
    dailyUsage: 'Dzienne zużycie',
    weeklyUsage: 'Tygodniowe zużycie',
    monthlyUsage: 'Miesięczne zużycie',
    yearlyUsage: 'Roczne zużycie',
    calibration: 'Kalibracja',
    lastCalibration: 'Ostatnia kalibracja',
    sinceLast: 'od kalibracji',
  },
  ultimatesensor: {
    title: 'UltimateSensor',
    roomScore: 'Wynik pomieszczenia',
    excellent: 'Doskonały',
    good: 'Dobry',
    moderate: 'Umiarkowany',
    poor: 'Słaby',
    unhealthy: 'Niezdrowy',
    hazardous: 'Niebezpieczny',
    presence: 'Obecność',
    detected: 'Wykryta',
    notDetected: 'Nie wykryta',
    targets: 'Cele',
    co2Level: 'Poziom CO₂',
    vocIndex: 'Indeks LZO',
    noxIndex: 'Indeks NOx',
    illuminance: 'Natężenie oświetlenia',
    pm1: 'PM1.0',
    pm25: 'PM2.5',
    pm4: 'PM4.0',
    pm10: 'PM10',
    radarView: 'Widok radaru',
    roomView: 'Widok pomieszczenia',
    view2D: '2D',
    view3D: '3D',
    zoneOccupancy: 'Zajętość strefy',
    zone: 'Strefa',
    recommendations: 'Zalecenia',
    ventilateNow: 'Wietrz teraz!',
    openWindow: 'Otwórz okno',
    airQualityPoor: 'Jakość powietrza jest słaba',
    tooHumid: 'Za wilgotno',
    tooDry: 'Za sucho',
    tooCold: 'Za zimno',
    tooWarm: 'Za ciepło',
  },
  editor: {
    deviceId: 'ID urządzenia',
    selectDevice: 'Wybierz urządzenie',
    appearance: 'Wygląd',
    showGraph: 'Pokaż wykres',
    showWater: 'Pokaż wodę',
    showEnergy: 'Pokaż energię',
    graphType: 'Typ wykresu',
    historyGraph: 'Wykres historyczny',
    liveGraph: 'Wykres na żywo',
    displayOptions: 'Opcje wyświetlania',
  },
};

// All available translations
const translations: Record<string, Translations> = {
  en,
  nl,
  de,
  fr,
  es,
  it,
  pt,
  pl,
};

// Cache for current language
let currentLanguage = 'en';
let currentTranslations: Translations = en;

/**
 * Get the current language from Home Assistant
 */
export function getLanguageFromHass(hass: any): string {
  if (!hass) return 'en';

  // Try to get language from Home Assistant
  const lang = hass.language || hass.locale?.language || 'en';

  // Extract base language code (e.g., "nl-NL" -> "nl")
  const baseLanguage = lang.split('-')[0].toLowerCase();

  return baseLanguage;
}

/**
 * Initialize translations based on Home Assistant language
 */
export function initTranslations(hass: any): void {
  const lang = getLanguageFromHass(hass);

  if (lang !== currentLanguage) {
    currentLanguage = lang;
    currentTranslations = translations[lang] || en;
  }
}

/**
 * Get translations for the current language
 * Falls back to English if translation is not available
 */
export function getTranslations(hass?: any): Translations {
  if (hass) {
    initTranslations(hass);
  }
  return currentTranslations;
}

/**
 * Get a specific translation by key path
 * Example: t('waterflowkit.title') returns 'WaterFlowKit'
 */
export function t(key: string, hass?: any): string {
  if (hass) {
    initTranslations(hass);
  }

  const keys = key.split('.');
  let value: any = currentTranslations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English
      value = en;
      for (const ek of keys) {
        if (value && typeof value === 'object' && ek in value) {
          value = value[ek];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }

  return typeof value === 'string' ? value : key;
}

/**
 * Export all translations for use in components
 */
export { translations, en, nl, de, fr, es, it, pt, pl };

