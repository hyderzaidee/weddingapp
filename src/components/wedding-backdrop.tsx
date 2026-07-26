export function WeddingBackdrop() {
  return (
    <div
      aria-hidden
      className="wedding-backdrop absolute inset-0 overflow-hidden bg-[#b7aea6]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/login-bg.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover object-center"
      />
      {/* Soft wash so app content stays readable */}
      <div className="absolute inset-0 bg-[#f4efe8]/72" />
    </div>
  );
}
