import axios from 'axios';

const BMKG_API_BASE = 'https://api.bmkg.go.id/publik/prakiraan-cuaca';

export const fetchWeather = async (adm4 = '61.71.05.1001') => {
  try {
    const response = await axios.get(`${BMKG_API_BASE}?adm4=${adm4}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching BMKG weather:', error);
    throw error;
  }
};

export const getWeatherIcon = (weatherId) => {
  // BMKG Weather IDs: 
  // 0: Cerah, 1: Cerah Berawan, 2: Cerah Berawan, 3: Berawan, 4: Berawan Tebal, 
  // 5: Udara Kabur, 10: Asap, 45: Kabut, 60: Hujan Ringan, 61: Hujan Sedang, 
  // 63: Hujan Lebat, 80: Hujan Lokal, 95: Hujan Petir, 97: Hujan Petir
  const mapping = {
    0: 'Sun',
    1: 'CloudSun',
    2: 'CloudSun',
    3: 'Cloud',
    4: 'Clouds',
    60: 'CloudRain',
    61: 'CloudRain',
    63: 'CloudRain',
    95: 'CloudLightning',
    97: 'CloudLightning',
  };
  return mapping[weatherId] || 'Cloud';
};
