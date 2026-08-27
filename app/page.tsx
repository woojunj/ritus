import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted p-6 sm:p-16">
      <Card className="w-full max-w-xl">
        <CardHeader className="gap-3">
          <Badge variant="secondary" className="w-fit">
            shadcn/ui preset 적용됨
          </Badge>
          <h1 className="font-heading text-3xl font-semibold leading-10 tracking-tight text-foreground">
            To get started, edit the{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
              page.tsx
            </code>{" "}
            file.
          </h1>
          <CardDescription className="text-base leading-7">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Learning
            </a>{" "}
            center.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input placeholder="you@example.com" aria-label="이메일" />
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row">
          <a
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full gap-2 sm:w-auto"
            )}
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt=""
              width={16}
              height={14}
            />
            Deploy Now
          </a>
          <a
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full sm:w-auto"
            )}
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}
