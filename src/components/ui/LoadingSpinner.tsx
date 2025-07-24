interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'white' | 'red' | 'blue'
  text?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'white', 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const colorClasses = {
    white: 'text-white',
    red: 'text-red-500',
    blue: 'text-blue-500'
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`} />
      {text && (
        <p className="mt-2 text-slate-400 text-sm">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
} 