import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button, PageTitle, Panel } from "@/components/chrome";
import { useCivic } from "@/lib/store";
import { MODULES, moduleBySlug } from "@/lib/training";

export const Route = createFileRoute("/training/$slug")({
  head: () => ({ meta: [{ title: "Lesson · CivicPatch" }] }),
  component: LessonPage,
});

function LessonPage() {
  const { slug } = Route.useParams();
  const trainingModule = moduleBySlug(slug);
  const score = useCivic((state) => state.scores[slug]);
  const recordQuiz = useCivic((state) => state.recordQuiz);
  const [answers, setAnswers] = useState<number[]>(
    trainingModule ? trainingModule.quiz.map(() => -1) : [],
  );
  const [result, setResult] = useState<string | null>(null);

  if (!trainingModule) {
    return <PageTitle title="That lesson is not in the school" />;
  }

  const index = MODULES.findIndex((item) => item.slug === slug);
  const next = MODULES[index + 1];

  function grade() {
    if (!trainingModule) return;
    const correct = trainingModule.quiz.filter(
      (question, i) => answers[i] === question.answer,
    ).length;
    const passed = correct >= 2;
    recordQuiz(slug, { correct, total: trainingModule.quiz.length, passed });
    setResult(
      passed
        ? `Passed, ${correct} of ${trainingModule.quiz.length}.`
        : `${correct} of ${trainingModule.quiz.length}. You need 2. Read the steps again and retake it.`,
    );
  }

  return (
    <div className="max-w-3xl">
      <Link to="/training" className="text-sm font-semibold text-teal-deep underline">
        All lessons
      </Link>
      <PageTitle
        kicker={trainingModule.required ? "Required" : "Trade lesson"}
        title={trainingModule.title}
        lede={trainingModule.summary}
      />
      <div className="space-y-6">
        {trainingModule.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-2xl font-semibold">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mt-2 text-muted">
                {paragraph}
              </p>
            ))}
            {section.steps ? (
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                {section.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : null}
          </section>
        ))}
      </div>
      <Panel className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Check yourself</h2>
        <p className="mt-1 text-sm text-muted">Two out of three passes. You can retake it.</p>
        <div className="mt-4 space-y-5">
          {trainingModule.quiz.map((question, questionIndex) => (
            <fieldset key={question.prompt}>
              <legend className="font-semibold">{question.prompt}</legend>
              <div className="mt-2 space-y-2">
                {question.choices.map((choice, choiceIndex) => (
                  <label key={choice} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`q-${questionIndex}`}
                      checked={answers[questionIndex] === choiceIndex}
                      onChange={() =>
                        setAnswers((current) =>
                          current.map((value, index) =>
                            index === questionIndex ? choiceIndex : value,
                          ),
                        )
                      }
                    />
                    {choice}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <Button
          type="button"
          className="mt-4"
          disabled={answers.some((answer) => answer < 0)}
          onClick={grade}
        >
          Score this lesson
        </Button>
        {result ? <p className="mt-3 text-sm font-semibold">{result}</p> : null}
        {score?.passed ? (
          <p className="mt-2 text-sm text-teal-deep">This lesson is already on your record.</p>
        ) : null}
        {next ? (
          <Link
            to="/training/$slug"
            params={{ slug: next.slug }}
            className="mt-4 inline-block text-sm font-semibold text-teal-deep underline"
          >
            Next: {next.title}
          </Link>
        ) : (
          <Link to="/become" className="mt-4 inline-block text-sm font-semibold text-teal-deep underline">
            Return to crew activation
          </Link>
        )}
      </Panel>
    </div>
  );
}
