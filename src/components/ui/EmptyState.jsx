export default function EmptyState({ icon: Icon, photo, photoAlt = '', title, description, action, className = '' }) {
  return (
    <div className={`card flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
      {photo ? (
        <img
          src={photo}
          alt={photoAlt}
          loading="lazy"
          className="mb-4 h-16 w-16 rounded-full object-cover shadow-soft ring-2 ring-sirkuit-300/40 dark:ring-sirkuit-400/30"
        />
      ) : (
        Icon && (
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-sirkuit-100 text-sirkuit-600 dark:bg-sirkuit-500/15 dark:text-sirkuit-300">
            <Icon size={26} />
          </div>
        )
      )}
      <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
