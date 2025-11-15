'use client';

import { User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function DashboardHeader() {
  return (
    <header className="flex h-14 items-center border-b bg-background px-6">
      <div className="ml-auto flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

