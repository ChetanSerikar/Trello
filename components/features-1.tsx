import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Move, Settings2, Users } from "lucide-react";
import { ReactNode } from "react";

export default function Features() {
  return (
    <section className="py-16 md:py-32 dark:bg-transparent">
      <div className="@container mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
            Everything you need to manage your workflow
          </h2>
          <p className="mt-4 text-muted-foreground">
            Organize tasks, collaborate with your team, and streamline
            productivity — all in one intuitive workspace.
          </p>
        </div>

        <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 *:text-center md:mt-16">
          <Card className="group shadow-zinc-950/5">
            <CardHeader className="pb-3">
              <CardDecorator>
                <Users className="size-6" aria-hidden />
              </CardDecorator>
              <h3 className="mt-6 font-medium">Team Collaboration</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Share boards, assign tasks, and work together in real-time to
                move projects forward efficiently.
              </p>
            </CardContent>
          </Card>

          <Card className="group shadow-zinc-950/5">
            <CardHeader className="pb-3">
              <CardDecorator>
                <Move className="size-6" aria-hidden />
              </CardDecorator>
              <h3 className="mt-6 font-medium">Drag-and-Drop Simplicity</h3>
            </CardHeader>
            <CardContent>
              <p className="mt-3 text-sm">
                Easily move cards across lists with an intuitive drag-and-drop
                interface that keeps everything in flow.
              </p>
            </CardContent>
          </Card>

          <Card className="group shadow-zinc-950/5">
            <CardHeader className="pb-3">
              <CardDecorator>
                <Settings2 className="size-6" aria-hidden />
              </CardDecorator>
              <h3 className="mt-6 font-medium">Task Management</h3>
            </CardHeader>
            <CardContent>
              <p className="mt-3 text-sm">
                Easily organize tasks with lists and cards to keep your workflow
                structured and efficient.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:bg-white/5 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"
    />
    <div
      aria-hidden
      className="bg-radial to-background absolute inset-0 from-transparent to-75%"
    />
    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">
      {children}
    </div>
  </div>
);
