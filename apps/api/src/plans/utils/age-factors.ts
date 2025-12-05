/**
 * Calcula el precio de un plan basado en factores etarios
 * Fórmula: FACTOR_ETARIO * PRECIO_BASE + GES
 * 
 * @param basePrice - Precio base del plan en CLP
 * @param age - Edad del cotizante
 * @param gesFactor - Factor GES de la ISAPRE (monto fijo a sumar)
 * @param isCotizante - Si es cotizante (true) o carga (false)
 * @returns Precio calculado en CLP
 */
export function calculatePrice(
  basePrice: number,
  age: number,
  gesFactor: number,
  isCotizante: boolean = true,
): number {
  // Factores etarios estándar para ISAPRES en Chile
  let ageFactor = 1.0;

  if (age >= 0 && age <= 29) {
    ageFactor = 1.0;
  } else if (age >= 30 && age <= 44) {
    ageFactor = 1.2;
  } else if (age >= 45 && age <= 59) {
    ageFactor = 1.5;
  } else if (age >= 60 && age <= 74) {
    ageFactor = 2.0;
  } else if (age >= 75) {
    ageFactor = 2.5;
  }

  // Aplicar fórmula: FACTOR_ETARIO * PRECIO_BASE + GES
  const calculatedPrice = ageFactor * basePrice + (gesFactor || 0);

  // Redondear a entero (precios en CLP)
  return Math.round(calculatedPrice);
}

