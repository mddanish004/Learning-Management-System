const LOGO_SRC = '/penta-academy-logo.png'

function BrandLogo({ className = '' }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Penta Academy logo"
      width={512}
      height={512}
      decoding="async"
      loading="eager"
      draggable={false}
      className={`object-cover select-none ${className}`}
    />
  )
}

export default BrandLogo
