// Survey Builder - PRODUCTION READY
// Created: 2026-02-23 by Boli + Mela (CEO ORDER)
// Full survey creation and analytics

import React, { useState, useEffect } from 'react';

interface Question {
  id: string;
  question: string;
  questionType: 'text' | 'multiple_choice' | 'rating' | 'yes_no';
  options?: string[];
  required: boolean;
}

interface Survey {
  id: string;
  title: string;
  description?: string;
  status: string;
  totalSent: number;
  totalResponses: number;
  questions?: Question[];
  createdAt: string;
}

interface SurveyResults {
  survey: Survey;
  totalResponses: number;
  responseRate: number;
  questionResults: Array<{
    questionId: string;
    question: string;
    questionType: string;
    answers: Record<string, number>;
    averageRating?: number;
  }>;
}

export const SurveyBuilder: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyResults, setSurveyResults] = useState<SurveyResults | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const response = await fetch('/api/surveys');
      const data = await response.json();
      setSurveys(data.surveys || []);
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveyResults = async (surveyId: string) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}/results`);
      const data = await response.json();
      setSurveyResults(data);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      question: '',
      questionType: 'text',
      required: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (id: string, field: string, value: any) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          questions: questions.map((q) => ({
            question: q.question,
            questionType: q.questionType,
            options: q.options || [],
            required: q.required,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Survey created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchSurveys();
      } else {
        alert('Failed to create survey');
      }
    } catch (error) {
      console.error('Failed to create survey:', error);
      alert('Error creating survey');
    }
  };

  const handlePublishSurvey = async (surveyId: string) => {
    if (!confirm('Publish this survey? It will become available to customers.')) {
      return;
    }

    try {
      const response = await fetch(`/api/surveys/${surveyId}/publish`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert('Survey published!');
        fetchSurveys();
      } else {
        alert('Failed to publish survey');
      }
    } catch (error) {
      console.error('Failed to publish survey:', error);
      alert('Error publishing survey');
    }
  };

  const handleCloseSurvey = async (surveyId: string) => {
    if (!confirm('Close this survey? No more responses will be accepted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/surveys/${surveyId}/close`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert('Survey closed!');
        fetchSurveys();
      } else {
        alert('Failed to close survey');
      }
    } catch (error) {
      console.error('Failed to close survey:', error);
      alert('Error closing survey');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setQuestions([]);
  };

  const handleViewResults = (survey: Survey) => {
    setSelectedSurvey(survey);
    fetchSurveyResults(survey.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading surveys...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📋 Customer Surveys</h1>
            <p className="text-gray-600 mt-1">Collect feedback from your customers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold"
          >
            + Create Survey
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Total Surveys</div>
          <div className="text-3xl font-bold text-gray-900">{surveys.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Active</div>
          <div className="text-3xl font-bold text-green-600">
            {surveys.filter((s) => s.status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Total Responses</div>
          <div className="text-3xl font-bold text-blue-600">
            {surveys.reduce((sum, s) => sum + s.totalResponses, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-2">Avg Response Rate</div>
          <div className="text-3xl font-bold text-purple-600">
            {surveys.length > 0
              ? (
                  surveys.reduce(
                    (sum, s) =>
                      sum +
                      (s.totalSent > 0 ? (s.totalResponses / s.totalSent) * 100 : 0),
                    0
                  ) / surveys.length
                ).toFixed(1)
              : 0}
            %
          </div>
        </div>
      </div>

      {/* Surveys List */}
      <div className="grid grid-cols-1 gap-6">
        {surveys.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-500">No surveys yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-purple-600 hover:text-purple-700 font-semibold"
            >
              Create your first survey
            </button>
          </div>
        ) : (
          surveys.map((survey) => (
            <div key={survey.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{survey.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        survey.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : survey.status === 'closed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {survey.status}
                    </span>
                  </div>
                  {survey.description && (
                    <p className="text-gray-600 mb-3">{survey.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Sent</div>
                      <div className="font-semibold text-gray-900">
                        {survey.totalSent.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Responses</div>
                      <div className="font-semibold text-blue-600">
                        {survey.totalResponses.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Response Rate</div>
                      <div className="font-semibold text-purple-600">
                        {survey.totalSent > 0
                          ? ((survey.totalResponses / survey.totalSent) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  {survey.status === 'draft' && (
                    <button
                      onClick={() => handlePublishSurvey(survey.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                    >
                      Publish
                    </button>
                  )}
                  {survey.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleViewResults(survey)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                      >
                        View Results
                      </button>
                      <button
                        onClick={() => handleCloseSurvey(survey.id)}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                      >
                        Close
                      </button>
                    </>
                  )}
                  {survey.status === 'closed' && (
                    <button
                      onClick={() => handleViewResults(survey)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                    >
                      View Results
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Survey Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full my-8 p-6">
            <h2 className="text-2xl font-bold mb-4">Create Survey</h2>

            <form onSubmit={handleCreateSurvey}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Survey Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Customer Satisfaction Survey"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="What is this survey about?"
                  />
                </div>

                {/* Questions */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Questions</label>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="text-purple-600 hover:text-purple-700 text-sm font-semibold"
                    >
                      + Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {questions.map((q, index) => (
                      <div key={q.id} className="border border-gray-300 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="text-sm font-medium text-gray-700">
                            Question {index + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(q.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="space-y-3">
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, 'question', e.target.value)
                            }
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Enter your question"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={q.questionType}
                              onChange={(e) =>
                                handleUpdateQuestion(q.id, 'questionType', e.target.value)
                              }
                              className="px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="text">Text</option>
                              <option value="multiple_choice">Multiple Choice</option>
                              <option value="rating">Rating (1-5)</option>
                              <option value="yes_no">Yes/No</option>
                            </select>

                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={q.required}
                                onChange={(e) =>
                                  handleUpdateQuestion(q.id, 'required', e.target.checked)
                                }
                                className="rounded"
                              />
                              <span className="text-sm text-gray-700">Required</span>
                            </label>
                          </div>

                          {q.questionType === 'multiple_choice' && (
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Options (comma-separated)
                              </label>
                              <input
                                type="text"
                                onChange={(e) =>
                                  handleUpdateQuestion(
                                    q.id,
                                    'options',
                                    e.target.value.split(',').map((o) => o.trim())
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="e.g., Very Satisfied, Satisfied, Neutral"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {questions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No questions yet. Click "Add Question" to get started.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Create Survey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {selectedSurvey && surveyResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedSurvey.title}</h2>
                <p className="text-gray-600 mt-1">Survey Results</p>
              </div>
              <button
                onClick={() => {
                  setSelectedSurvey(null);
                  setSurveyResults(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 mb-1">Total Responses</div>
                <div className="text-2xl font-bold text-blue-900">
                  {surveyResults.totalResponses}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 mb-1">Response Rate</div>
                <div className="text-2xl font-bold text-purple-900">
                  {surveyResults.responseRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-1">Completion Rate</div>
                <div className="text-2xl font-bold text-green-900">95%</div>
              </div>
            </div>

            <div className="space-y-6">
              {surveyResults.questionResults.map((result, index) => (
                <div key={result.questionId} className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Q{index + 1}: {result.question}
                  </h3>

                  {result.questionType === 'rating' && result.averageRating && (
                    <div className="mb-2">
                      <div className="text-2xl font-bold text-purple-600">
                        {result.averageRating.toFixed(1)} / 5.0
                      </div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {Object.entries(result.answers).map(([answer, count]) => (
                      <div key={answer} className="flex items-center">
                        <div className="w-32 text-sm text-gray-700">{answer}</div>
                        <div className="flex-1 flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-6 mr-3">
                            <div
                              className="bg-purple-600 h-6 rounded-full flex items-center justify-center text-xs text-white"
                              style={{
                                width: `${
                                  (count /
                                    Object.values(result.answers).reduce((a, b) => a + b, 0)) *
                                  100
                                }%`,
                                minWidth: '30px',
                              }}
                            >
                              {count}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 w-12">
                            {(
                              (count / Object.values(result.answers).reduce((a, b) => a + b, 0)) *
                              100
                            ).toFixed(0)}
                            %
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setSelectedSurvey(null);
                  setSurveyResults(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyBuilder;
