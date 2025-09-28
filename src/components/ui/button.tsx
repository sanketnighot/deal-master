import { cn } from '@/lib/utils'
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'magenta' | 'cyan'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-pixel text-lg uppercase border-4 transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'

  const variants = {
    primary: 'border-neon-cyan text-neon-cyan bg-dark-purple hover:bg-neon-cyan hover:text-dark-purple hover:shadow-neon-glow-cyan focus:ring-neon-cyan/50',
    secondary: 'border-neon-magenta text-neon-magenta bg-dark-purple hover:bg-neon-magenta hover:text-dark-purple hover:shadow-neon-glow-magenta focus:ring-neon-magenta/50',
    outline: 'border-neon-yellow text-neon-yellow bg-transparent hover:bg-neon-yellow hover:text-dark-purple focus:ring-neon-yellow/50',
    ghost: 'border-transparent text-neon-cyan hover:border-neon-cyan hover:bg-dark-purple/50 focus:ring-neon-cyan/50',
    danger: 'border-red-500 text-red-500 bg-dark-purple hover:bg-red-500 hover:text-dark-purple focus:ring-red-500/50',
    magenta: 'border-neon-magenta text-neon-magenta bg-dark-purple hover:bg-neon-magenta hover:text-dark-purple hover:shadow-neon-glow-magenta focus:ring-neon-magenta/50',
    cyan: 'border-neon-cyan text-neon-cyan bg-dark-purple hover:bg-neon-cyan hover:text-dark-purple hover:shadow-neon-glow-cyan focus:ring-neon-cyan/50',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-lg',
    lg: 'px-8 py-4 text-xl',
  }

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        loading && 'cursor-not-allowed animate-text-flicker',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
