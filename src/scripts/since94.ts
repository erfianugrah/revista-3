export default function yearsSince1994(): number {
  const currentYear = new Date().getFullYear();
  return currentYear - 1994;
}
