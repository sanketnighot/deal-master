import { cn } from '@/lib/utils'
import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'outlined' | 'elevated' | 'pixel'
}

export function Card({
  children,
  variant = 'default',
  className,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-dark-purple/50 border-4 border-neon-magenta shadow-neon-glow-magenta',
    outlined: 'bg-transparent border-4 border-neon-cyan',
    elevated: 'bg-dark-purple/80 border-4 border-neon-magenta shadow-neon-glow-magenta',
    pixel: 'pixel-box',
  }

  return (
    <div
      className={cn(
        'p-6 font-pixel',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('mb-4 pb-4 border-b-2 border-neon-cyan/30', className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn('text-xl font-pixel uppercase text-neon-yellow tracking-wider', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div
      className={cn('text-neon-cyan', className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('mt-4 pt-4 border-t-2 border-neon-cyan/30', className)}
      {...props}
    >
      {children}
    </div>
  )
}
