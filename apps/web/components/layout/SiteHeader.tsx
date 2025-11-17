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
            <span className="font-bold text-xl">SolucionSalud</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <a
              href="#inicio"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Inicio
            </a>
            <a
              href="#quienes-somos"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('quienes-somos')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Quienes Somos
            </a>
            <a
              href="#plataforma"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('plataforma')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Plataforma
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-foreground/80 text-foreground/60 outline-none">
                Instituciones
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <a
                    href="#superintendencia"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('superintendencia')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Superintendencia
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href="#isapres-chile"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('isapres-chile')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Isapres Chile
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <a
              href="#noticias"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('noticias')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Noticias
            </a>
            <a
              href="#descargas"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('descargas')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Descargas
            </a>
            <a
              href="#mujeres"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('mujeres')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Mujeres
            </a>
            <a
              href="#ley-corta"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('ley-corta')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Ley Corta
            </a>
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

