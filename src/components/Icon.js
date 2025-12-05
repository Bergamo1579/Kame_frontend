// Componente Icon reutilizável
export default function Icon({ path, size = "h-5 w-5" }) {
  return (
    <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
}
