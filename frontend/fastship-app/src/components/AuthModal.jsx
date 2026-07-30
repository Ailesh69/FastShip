// A returning-user login modal. Opened by either the navbar "LOGIN/SIGNUP"
// button or the "ALREADY REGISTERED?" button. It's an overlay, so it never
// unmounts / breaks the main page underneath.
//
// `open` controls visibility; `onClose` closes it. The form just logs for
// now — later onSubmit will POST to your FastAPI auth endpoint.
function AuthModal({ open, onClose }) {
  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Authenticating...') // TODO: call FastAPI login here
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose} // click the backdrop to close
    >
      <div
        className="relative w-80 rounded-md border-2 border-fs-teal bg-fs-bg px-8 py-8 shadow-[0_0_24px_rgba(47,240,224,0.5)]"
        onClick={(e) => e.stopPropagation()} // clicks inside shouldn't close
      >
        <button
          type="button"
          onClick={onClose}
          className="teal-glow absolute right-3 top-2 text-sm"
          aria-label="Close"
        >
          x
        </button>

        <h2 className="teal-glow text-center text-lg">LOG IN</h2>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="text-left text-[8px] text-fs-cyan/80">
            USERNAME
            <input
              type="text"
              className="mt-2 w-full rounded border-2 border-fs-green/60 bg-transparent px-3 py-2 text-[10px] text-fs-green outline-none focus:border-fs-teal"
            />
          </label>

          <label className="text-left text-[8px] text-fs-cyan/80">
            PASSWORD
            <input
              type="password"
              className="mt-2 w-full rounded border-2 border-fs-green/60 bg-transparent px-3 py-2 text-[10px] text-fs-green outline-none focus:border-fs-teal"
            />
          </label>

          <button
            type="submit"
            className="teal-box mt-2 rounded-md px-4 py-2 text-[10px] transition-transform hover:scale-105"
          >
            [ ENTER ]
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthModal
