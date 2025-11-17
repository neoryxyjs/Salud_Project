'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Menu, X } from 'lucide-react';

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg sm:text-xl">Solucion De Salud</span>
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center ml-6 space-x-4 xl:space-x-6 text-sm font-medium">
            <a
              href="#inicio"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('inicio');
              }}
            >
              Inicio
            </a>
            <a
              href="#quienes-somos"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('quienes-somos');
              }}
            >
              Quienes Somos
            </a>
            <a
              href="#plataforma"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('plataforma');
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
                      scrollToSection('superintendencia');
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
                      scrollToSection('isapres-chile');
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
                scrollToSection('noticias');
              }}
            >
              Noticias
            </a>
            <a
              href="#descargas"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('descargas');
              }}
            >
              Descargas
            </a>
            <a
              href="#mujeres"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('mujeres');
              }}
            >
              Mujeres
            </a>
            <a
              href="#ley-corta"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('ley-corta');
              }}
            >
              Ley Corta
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
            <Link href="/auth/login">CRM Login</Link>
          </Button>
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background/95 backdrop-blur">
          <nav className="container px-4 py-4 space-y-2">
            <a
              href="#inicio"
              className="block py-2 text-sm transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('inicio');
              }}
            >
              Inicio
            </a>
            <a
              href="#quienes-somos"
              className="block py-2 text-sm transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('quienes-somos');
              }}
            >
              Quienes Somos
            </a>
            <a
              href="#plataforma"
              className="block py-2 text-sm transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('plataforma');
              }}
            >
              Plataforma
            </a>
            <div className="py-2">
              <span className="block py-2 text-sm font-semibold text-foreground/80">Instituciones</span>
              <div className="pl-4 space-y-1">
                <a
                  href="#superintendencia"
                  className="block py-1 text-sm transition-colors hover:text-foreground/80 text-foreground/60"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('superintendencia');
                  }}
                >
                  Superintendencia
                </a>
                <a
                  href="#isapres-chile"
                  className="block py-1 text-sm transition-colors hover:text-foreground/80 text-foreground/60"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('isapres-chile');
                  }}
                >
                  Isapres Chile
                </a>
              </div>
            </div>
            <a
              href="#noticias"
              className="block py-2 text-sm transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('noticias');
              }}
            >
              Noticias
            </a>
            <a
              href="#descargas"
              className="block py-2 text-sm transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('descargas');
              }}
            >
              Descargas
            </a>
            <a
              href="#mujeres"
              className="block py-2 text-sm transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('mujeres');
              }}
            >
              Mujeres
            </a>
            <a
              href="#ley-corta"
              className="block py-2 text-sm transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('ley-corta');
              }}
            >
              Ley Corta
            </a>
            <div className="pt-2 border-t">
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <Link href="/auth/login">CRM Login</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

