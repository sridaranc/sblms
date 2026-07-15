interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

export const attendanceService = {
  async getCurrentPosition(): Promise<GeolocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const address = await attendanceService.reverseGeocode(latitude, longitude);
          resolve({ latitude, longitude, accuracy, address });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  },

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  },

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  },

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  },

  calculateHours(checkIn: string, checkOut: string): number {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  },

  getStatus(checkInTime: string): 'ontime' | 'late' | 'early' {
    const hour = new Date(checkInTime).getHours();
    const minute = new Date(checkInTime).getMinutes();
    const totalMinutes = hour * 60 + minute;
    if (totalMinutes > 9 * 60 + 15) return 'late';
    if (totalMinutes < 8 * 60 + 45) return 'early';
    return 'ontime';
  },
};
