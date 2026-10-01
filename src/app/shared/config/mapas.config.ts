export function linkDoUber(lat: number | null | undefined, lon: number | null | undefined, nome: string, endereco: string): string {
  const destino = { latitude: lat, longitude: lon, addressLine1: nome, addressLine2: endereco };
  return `https://m.uber.com/looking?pickup=my_location&drop[0]=${encodeURIComponent(JSON.stringify(destino))}`;
}

export function linkDoMaps(lat: number | null | undefined, lon: number | null | undefined): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat}%2C${lon}`;
}
