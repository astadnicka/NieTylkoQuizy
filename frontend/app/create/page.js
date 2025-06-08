'use client';

import { useKeycloak } from '@react-keycloak/web';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Quiz i Poll - dynamiczny formularz
function QuestionsForm({ onSubmit, title, setTitle, questions, setQuestions, isQuiz, isSubmitting }) {
  // Dodaj nowe pytanie
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        options: [{ option_text: '', is_correct: false }]
      }
    ]);
  };

  // Zmień treść pytania
  const updateQuestion = (idx, value) => {
    const updated = [...questions];
    updated[idx].question_text = value;
    setQuestions(updated);
  };

  // Dodaj opcję do pytania
  const addOption = (qIdx) => {
    const updated = [...questions];
    updated[qIdx].options.push({ option_text: '', is_correct: false });
    setQuestions(updated);
  };

  // Zmień treść opcji
  const updateOption = (qIdx, oIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx].option_text = value;
    setQuestions(updated);
  };

  // Zaznacz poprawną odpowiedź (Quiz)
  const setCorrect = (qIdx, oIdx) => {
    if (!isQuiz) return;
    const updated = [...questions];
    updated[qIdx].options = updated[qIdx].options.map((opt, i) => ({
      ...opt,
      is_correct: i === oIdx,
    }));
    setQuestions(updated);
  };

  // Usuń pytanie
  const removeQuestion = (qIdx) => {
    const updated = [...questions];
    updated.splice(qIdx, 1);
    setQuestions(updated);
  };

  // Usuń opcję
  const removeOption = (qIdx, oIdx) => {
    const updated = [...questions];
    updated[qIdx].options.splice(oIdx, 1);
    setQuestions(updated);
  };

  return (
    <div>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={isQuiz ? "Tytuł quizu" : "Tytuł ankiety"}
        className="border p-2 mb-4 w-full"
      />
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="mb-4 border p-2 rounded">
          <div className="flex items-center mb-2">
            <input
              value={q.question_text}
              onChange={e => updateQuestion(qIdx, e.target.value)}
              placeholder="Treść pytania"
              className="border p-2 flex-1"
            />
            <button
              type="button"
              onClick={() => removeQuestion(qIdx)}
              className="ml-2 text-red-600"
              title="Usuń pytanie"
            >✕</button>
          </div>
          {q.options.map((opt, oIdx) => (
            <div key={oIdx} className="flex items-center mb-1">
              <input
                value={opt.option_text}
                onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                placeholder="Opcja"
                className="border p-2 flex-1"
              />
              {isQuiz && (
                <input
                  type="radio"
                  checked={opt.is_correct}
                  onChange={() => setCorrect(qIdx, oIdx)}
                  name={`correct-${qIdx}`}
                  className="ml-2"
                  title="Poprawna odpowiedź"
                />
              )}
              <button
                type="button"
                onClick={() => removeOption(qIdx, oIdx)}
                className="ml-2 text-red-600"
                title="Usuń opcję"
                disabled={q.options.length <= 1}
              >✕</button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addOption(qIdx)}
            className="text-xs text-blue-600 mt-1"
          >
            Dodaj opcję
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addQuestion}
        className="text-xs text-green-600 mb-4"
      >
        Dodaj pytanie
      </button>
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className={`${isQuiz
          ? "bg-blue-600 text-white p-2 rounded w-full mt-2"
          : "bg-purple-600 text-white p-2 rounded w-full mt-2"}
          ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isSubmitting ? "Zapisywanie..." : (isQuiz ? "Zapisz Quiz" : "Zapisz Ankietę")}
      </button>
    </div>
  );
}

// Horoskop - aktualizacja
const ZODIAC_SIGNS = [
  "Baran", "Byk", "Bliznieta", "Rak", "Lew", "Panna",
  "Waga", "Skorpion", "Strzelec", "Koziorozec", "Wodnik", "Ryby"
];

function HoroscopeForm({ onSubmit, title, setTitle, questions, setQuestions, isSubmitting }) {
  useEffect(() => {
    if (questions.length !== ZODIAC_SIGNS.length) {
      setQuestions(ZODIAC_SIGNS.map((sign, idx) => ({
        question_text: questions[idx]?.question_text || "",
        sign
      })));
    }
    // eslint-disable-next-line
  }, []);

  const updateQuestion = (idx, value) => {
    const updated = [...questions];
    updated[idx].question_text = value;
    setQuestions(updated);
  };

  return (
    <div>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Tytuł horoskopu"
        className="border p-2 mb-4 w-full"
      />
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="mb-2">
          <label className="block font-semibold mb-1">{ZODIAC_SIGNS[qIdx]}</label>
          <input
            value={q.question_text}
            onChange={e => updateQuestion(qIdx, e.target.value)}
            placeholder={`Horoskop dla znaku ${ZODIAC_SIGNS[qIdx]}`}
            className="border p-2 w-full"
          />
        </div>
      ))}
      <button 
        onClick={onSubmit} 
        disabled={isSubmitting}
        className={`bg-green-600 text-white p-2 rounded w-full mt-2 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isSubmitting ? "Zapisywanie..." : "Zapisz Horoskop"}
      </button>
    </div>
  );
}

export default function CreateQuizPage() {
  const { keycloak } = useKeycloak();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Dodany nowy stan

  // Resetuj pytania przy zmianie kategorii
  const handleCategoryChange = (e) => {
    setCategoryId(parseInt(e.target.value));
    setQuestions([]);
    setTitle('');
  };

  // Przygotuj payload zgodnie z bazą
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!keycloak.authenticated) {
      alert('Musisz być zalogowany, aby utworzyć quiz!');
      keycloak.login();
      return;
    }

    // Walidacja podstawowa
    if (!title.trim()) {
      alert('Tytuł jest wymagany!');
      return;
    }

    // Walidacja pytań
    if (questions.length === 0) {
      alert('Dodaj przynajmniej jedno pytanie!');
      return;
    }

    // Ustawienie stanu wysyłania na true
    setIsSubmitting(true);

    // Przygotuj pytania w odpowiednim formacie
    let formattedQuestions = [];

    try {
      if (categoryId === 1) {
        // Horoskop - pytania z jedną opcją (wymagane przez backend)
        formattedQuestions = questions
          .filter(q => q.question_text && q.question_text.trim())
          .map(q => ({
            question_text: `${q.sign}: ${q.question_text}`,
            options: [{ option_text: "Zobacz swoją wróżbę!", is_correct: true }]
          }));
      } else if (categoryId === 2 || categoryId === 3) {
        // Quiz lub ankieta - pytania z opcjami
        formattedQuestions = questions.map(q => {
          // Podstawowa walidacja
          if (!q.question_text?.trim()) {
            throw new Error('Wszystkie pytania muszą mieć treść!');
          }

          if (!q.options || q.options.length < 2) {
            throw new Error('Każde pytanie musi mieć co najmniej dwie opcje!');
          }

          // Dla quizów sprawdź, czy jest zaznaczona poprawna odpowiedź
          if (categoryId === 2 && !q.options.some(opt => opt.is_correct)) {
            throw new Error('Każde pytanie w quizie musi mieć zaznaczoną poprawną odpowiedź!');
          }

          return {
            question_text: q.question_text,
            options: q.options.map(opt => ({
              option_text: opt.option_text,
              is_correct: categoryId === 2 ? !!opt.is_correct : false  // Dla ankiet wszystkie false
            }))
          };
        });
      }

      // Przygotuj payload
      const payload = {
        title,
        category_id: categoryId,
        questions: formattedQuestions
      };

      // Debugowanie
      console.log('Sending payload:', JSON.stringify(payload));

      // Wyślij do API
      const response = await fetch('http://localhost:5001/quizzes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloak.token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Wystąpił błąd podczas zapisywania');
      }

      const result = await response.json();
      console.log('Quiz created:', result);

      // Pokaż komunikat o sukcesie
      alert(`Quiz "${title}" został pomyślnie utworzony!`);

      // Przekieruj na stronę główną
      router.push('/');

    } catch (error) {
      console.error('Error creating quiz:', error);
      alert(`Błąd: ${error.message}`);
    } finally {
      // Zawsze przywróć stan przycisku
      setIsSubmitting(false);
    }
  };

  let formComponent = null;
  if (categoryId === 1) {
    formComponent = (
      <HoroscopeForm
        onSubmit={handleSubmit}
        title={title}
        setTitle={setTitle}
        questions={questions}
        setQuestions={setQuestions}
        isSubmitting={isSubmitting}
      />
    );
  } else if (categoryId === 2) {
    formComponent = (
      <QuestionsForm
        onSubmit={handleSubmit}
        title={title}
        setTitle={setTitle}
        questions={questions}
        setQuestions={setQuestions}
        isQuiz={true}
        isSubmitting={isSubmitting}
      />
    );
  } else if (categoryId === 3) {
    formComponent = (
      <QuestionsForm
        onSubmit={handleSubmit}
        title={title}
        setTitle={setTitle}
        questions={questions}
        setQuestions={setQuestions}
        isQuiz={false}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Utwórz quiz/horoskop/ankietę</h1>
      <select
        value={categoryId}
        onChange={handleCategoryChange}
        className="border p-2 mb-4 w-full"
      >
        <option value={1}>Horoskop</option>
        <option value={2}>Quiz</option>
        <option value={3}>Ankieta</option>
      </select>
      {formComponent}
    </div>
  );
}
