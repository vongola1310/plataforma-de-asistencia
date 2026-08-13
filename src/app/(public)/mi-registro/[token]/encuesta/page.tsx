import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SurveyForm } from "@/components/public/SurveyForm";
import { submitSurvey } from "@/actions/survey";

export default async function EncuestaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const registration = await prisma.registration.findUnique({
    where: { accessToken: token },
    include: { event: true, surveyResponse: true },
  });

  if (!registration) notFound();
  if (registration.surveyResponse) redirect(`/mi-registro/${token}`);
  if (registration.event.endsAt > new Date()) redirect(`/mi-registro/${token}`);

  const boundSubmitSurvey = submitSurvey.bind(null, token);

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-1 text-2xl font-semibold">Encuesta de satisfacción</h1>
      <p className="mb-6 text-muted-foreground">{registration.event.title}</p>
      <Card>
        <CardHeader>
          <CardTitle>Cuéntanos tu experiencia</CardTitle>
        </CardHeader>
        <CardContent>
          <SurveyForm action={boundSubmitSurvey} />
        </CardContent>
      </Card>
    </div>
  );
}
