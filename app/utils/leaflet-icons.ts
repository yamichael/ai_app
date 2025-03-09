export async function fixLeafletIcons() {
  if (typeof window === 'undefined') return;
  
  try {
    const L = (await import('leaflet')).default;
    
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/marker-icon-2x.png',
      iconUrl: '/marker-icon.png',
      shadowUrl: '/marker-shadow.png',
    });
  } catch (error) {
    console.error('Error initializing Leaflet icons:', error);
  }
} 