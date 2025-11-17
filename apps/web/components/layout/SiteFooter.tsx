'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Phone, Mail, MapPin } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground relative overflow-hidden">
      {/* Background decorative icons */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-4 sm:left-10 w-10 h-10 sm:w-20 sm:h-20 border-2 border-primary-foreground rounded-full"></div>
        <div className="absolute top-32 right-10 sm:right-20 w-8 h-8 sm:w-16 sm:h-16 border-2 border-primary-foreground rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-6 h-6 sm:w-12 sm:h-12 border-2 border-primary-foreground rounded-full"></div>
      </div>

      <div className="container relative z-10 py-8 sm:py-12 md:py-16 px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Logo y Descripción */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                <span className="text-primary-foreground">Solucion</span>
                <span className="text-orange-500">Salud</span>
              </h3>
              <p className="text-xs sm:text-sm text-primary-foreground/90 leading-relaxed">
                SolucionSalud es la única plataforma web 100% gratuita que te permite comparar, cotizar y solicitar planes y seguros de salud de todas las Isapres y aseguradoras de Chile.
              </p>
            </div>
            <div className="flex gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* ISAPRES */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold uppercase">ISAPRES</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:underline text-primary-foreground/90">Banmedica</a>
              </li>
              <li>
                <a href="#" className="hover:underline text-primary-foreground/90">Consalud</a>
              </li>
              <li>
                <a href="#" className="hover:underline text-primary-foreground/90">Colmena</a>
              </li>
              <li>
                <a href="#" className="hover:underline text-primary-foreground/90">Cruz Blanca</a>
              </li>
              <li>
                <a href="#" className="hover:underline text-primary-foreground/90">Vidatres</a>
              </li>
              <li>
                <a href="#" className="hover:underline text-primary-foreground/90">Nueva Masvida</a>
              </li>
              <li>
                <a href="#" className="hover:underline text-primary-foreground/90">Esencial</a>
              </li>
            </ul>
          </div>

          {/* SITIOS DE INTERÉS */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold uppercase">SITIOS DE INTERÉS</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.superdesalud.gob.cl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline text-primary-foreground/90"
                >
                  Superintendencia de Salud
                </a>
              </li>
              <li>
                <a 
                  href="https://www.minsal.cl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline text-primary-foreground/90"
                >
                  Ministerio de Salud
                </a>
              </li>
              <li>
                <a 
                  href="https://www.isapresdechile.cl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline text-primary-foreground/90"
                >
                  Isapres de Chile
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold uppercase">SOLUCIONSALUD</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-primary-foreground/90">
                <Phone className="h-4 w-4" />
                <a href="tel:+56954789701" className="hover:underline">+569 5478 9701</a>
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/90">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@solucionsalud.cl" className="hover:underline">info@solucionsalud.cl</a>
              </li>
              <li className="flex items-start gap-2 text-primary-foreground/90">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Bombero Salas 1445, OF: 301, Santiago, Chile</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright y Política */}
        <div className="border-t border-primary-foreground/20 pt-6 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-primary-foreground/80">
              2024 SolucionSalud © Derechos reservados
            </p>
            <Link href="/politica-privacidad" className="text-primary-foreground/80 hover:underline">
              Política de privacidad
            </Link>
          </div>
        </div>

        {/* Descargo de responsabilidad */}
        <div className="mt-6 pt-6 border-t border-primary-foreground/20">
          <p className="text-xs text-primary-foreground/70 leading-relaxed text-center max-w-4xl mx-auto">
            Descargo de responsabilidad: Esperamos que encuentre útil la información presentada en este sitio web. Este sitio web es solo para información general y crear conciencia sobre Planes de Isapres. Toda la información basada en el sitio web es para su conocimiento. La información en nuestro sitio web está destinada a la información, si tiene alguna duda, verifique desde el sitio respectivo.
          </p>
        </div>
      </div>
    </footer>
  );
}

