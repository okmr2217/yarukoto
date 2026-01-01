"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

interface AuthCardProps {
  description?: string;
  children: React.ReactNode;
}

export function AuthCard({ description, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center">
            <Image
              src={"/icons/icon-192x192.png"}
              alt="icon"
              width={40}
              height={40}
            />
            <h1 className="text-2xl font-medium font-logo">Yarukoto</h1>
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
