/**
 * Service to fetch data from Home Assistant or Node-RED
 */

const HA_URL = import.meta.env.VITE_HA_URL || 'http://homeassistant.local:8123';
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIzNTUzZmM4MDdlZjE0NjYwOGVjNGRkYjcyMTc4YTA2NyIsImlhdCI6MTc2NzAyNTc1NywiZXhwIjoyMDgyMzg1NzU3fQ.oGALg8N_Z02znKSO6jFC1bM6pPxIFZL-_1MRjxA24EA';

export async function getEntity(entityId) {
    try {
        const response = await fetch(`${HA_URL}/api/states/${entityId}`, {
            headers: {
                'Authorization': `Bearer ${HA_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching entity:', error);
        return null;
    }
}

/**
 * Example function to fetch multiple data points for the grid
 */
export async function getMaisonData() {
    const tempEntity = await getEntity('sensor.temperature_salon');
    const powerEntity = await getEntity('sensor.consommation_electrique');
    const weatherEntity = await getEntity('weather.maison');
    const transportEntity = await getEntity('sensor.prochain_bus');

    return {
        temp: tempEntity?.state || '--',
        power: powerEntity?.state || '--',
        weather: weatherEntity?.state || 'Stable',
        weather_info: weatherEntity?.attributes?.temperature ? `${weatherEntity.attributes.temperature}°C - ${weatherEntity.state}` : 'Chargement...',
        transport_info: transportEntity?.state || 'Pas de bus',
        system_status: 'En ligne'
    };
}

export async function getTrains() {
    try {
        const response = await fetch('http://node-red.lan:1880/prochainsTrains');
        const data = await response.json();

        if (data.departures && Array.isArray(data.departures)) {
            return data.departures.slice(0, 4).map(dep => {
                const sdt = dep.stop_date_time;
                const timeStr = sdt.departure_date_time;

                // Parse times to calculate delay
                const realTime = new Date(
                    timeStr.substring(0, 4),
                    parseInt(timeStr.substring(4, 6)) - 1,
                    timeStr.substring(6, 8),
                    timeStr.substring(9, 11),
                    timeStr.substring(11, 13)
                );

                const baseStr = sdt.base_departure_date_time;
                const baseTime = new Date(
                    baseStr.substring(0, 4),
                    parseInt(baseStr.substring(4, 6)) - 1,
                    baseStr.substring(6, 8),
                    baseStr.substring(9, 11),
                    baseStr.substring(11, 13)
                );

                const delayMin = Math.round((realTime - baseTime) / 60000);
                const delayText = delayMin > 0 ? ` (+${delayMin}m)` : '';

                const hours = timeStr.substring(9, 11);
                const mins = timeStr.substring(11, 13);
                const dir = dep.display_informations.direction.split('(')[0].trim();

                return `${hours}:${mins}${delayText} - ${dir}`;
            }).join('<br>');
        }
        return "Pas de trains prévus";
    } catch (error) {
        console.error('Error fetching trains:', error);
        return "Erreur SNCF";
    }
}

export async function getNews() {
    try {
        const response = await fetch('http://node-red.lan:1880/news');
        const data = await response.json();

        // We take the first 3 titles and format them
        if (Array.isArray(data)) {
            return data.slice(0, 3).map(item => `• ${item.title[0]}`).join('<br><br>');
        }
        return "Aucune information disponible";
    } catch (error) {
        console.error('Error fetching news:', error);
        return "Erreur lors du chargement des news";
    }
}
