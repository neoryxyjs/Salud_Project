'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">QuePlan</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Inicio
            </Link>
            <Link
              href="/quienes-somos"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Quienes Somos
            </Link>
            <Link
              href="/plataforma"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Plataforma
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-foreground/80 text-foreground/60 outline-none">
                Instituciones
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/instituciones/superintendencia">Superintendencia</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/instituciones/isapres-chile">Isapres Chile</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href="/noticias"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Noticias
            </Link>
            <Link
              href="/descargas"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Descargas
            </Link>
            <Link
              href="/mujeres"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Mujeres
            </Link>
            <Link
              href="/ley-corta"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Ley Corta
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">CRM Login</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

