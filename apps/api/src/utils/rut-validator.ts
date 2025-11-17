/**
 * Valida RUT chileno en el backend
 */

export function validateRUT(rut: string): boolean {
  if (!rut) return false;
  
  // Limpiar el RUT (quitar puntos y guiones)
  const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  
  // Verificar formato básico
  if (cleanRUT.length < 8 || cleanRUT.length > 10) {
    return false;
  }
  
  // Separar número y dígito verificador
  const rutBody = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  
  // Verificar que el cuerpo sea numérico
  if (!/^\d+$/.test(rutBody)) {
    return false;
  }
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = rutBody.length - 1; i >= 0; i--) {
    sum += parseInt(rutBody[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const calculatedDV = remainder < 2 ? remainder.toString() : (11 - remainder).toString();
  const expectedDV = calculatedDV === '10' ? 'K' : calculatedDV;
  
  return dv === expectedDV || dv === calculatedDV;
}

