// Survey Service
// Customer feedback and surveys
// Created: 2026-02-23 - Day 13 Marketing Features

interface SurveyCreate {
  title: string;
  description?: string;
  questions: SurveyQuestionCreate[];
  distributionMethod?: string;
  startsAt?: Date;
  endsAt?: Date;
}

interface SurveyQuestionCreate {
  question: string;
  questionType: 'text' | 'multiple_choice' | 'rating' | 'yes_no';
  options?: string[];
  required?: boolean;
}

interface SurveyResponse {
  surveyId: string;
  customerId?: string;
  isAnonymous: boolean;
  answers: {
    questionId: string;
    answer: string;
  }[];
}

export class SurveyService {
  /**
   * Create survey
   */
  async createSurvey(tenantId: string, data: SurveyCreate): Promise<any> {
    const survey = {
      id: this.generateId(),
      tenantId,
      title: data.title,
      description: data.description,
      status: 'draft',
      distributionMethod: data.distributionMethod || 'email',
      totalViews: 0,
      totalResponses: 0,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const questions = data.questions.map((q, index) => ({
      id: this.generateId(),
      surveyId: survey.id,
      question: q.question,
      questionType: q.questionType,
      options: q.options,
      required: q.required || false,
      order: index,
      createdAt: new Date(),
    }));

    return {
      ...survey,
      questions,
    };
  }

  /**
   * Get all surveys
   */
  async getSurveys(tenantId: string, filters?: { status?: string }): Promise<any> {
    const surveys = [
      {
        id: 'survey_1',
        tenantId,
        title: 'Customer Satisfaction Survey',
        description: 'Help us improve your experience',
        status: 'active',
        totalViews: 245,
        totalResponses: 127,
        startsAt: new Date('2026-02-01'),
        endsAt: new Date('2026-03-01'),
        createdAt: new Date('2026-01-28'),
      },
      {
        id: 'survey_2',
        tenantId,
        title: 'Product Feedback Survey',
        description: 'Tell us what you think about our new products',
        status: 'active',
        totalViews: 156,
        totalResponses: 89,
        startsAt: new Date('2026-02-15'),
        createdAt: new Date('2026-02-14'),
      },
      {
        id: 'survey_3',
        tenantId,
        title: 'Service Quality Survey',
        description: 'Rate our service',
        status: 'draft',
        totalViews: 0,
        totalResponses: 0,
        createdAt: new Date(),
      },
    ];

    let filtered = surveys;
    if (filters?.status) {
      filtered = surveys.filter(s => s.status === filters.status);
    }

    return {
      surveys: filtered,
      total: filtered.length,
    };
  }

  /**
   * Get survey details with questions
   */
  async getSurveyDetails(tenantId: string, surveyId: string): Promise<any> {
    const survey = {
      id: surveyId,
      tenantId,
      title: 'Customer Satisfaction Survey',
      description: 'Help us improve your experience',
      status: 'active',
      totalViews: 245,
      totalResponses: 127,
      startsAt: new Date('2026-02-01'),
      endsAt: new Date('2026-03-01'),
      createdAt: new Date('2026-01-28'),
    };

    const questions = [
      {
        id: 'q1',
        surveyId,
        question: 'How satisfied are you with our service?',
        questionType: 'rating',
        options: null,
        required: true,
        order: 0,
      },
      {
        id: 'q2',
        surveyId,
        question: 'Would you recommend us to a friend?',
        questionType: 'yes_no',
        options: null,
        required: true,
        order: 1,
      },
      {
        id: 'q3',
        surveyId,
        question: 'What do you like most about our service?',
        questionType: 'multiple_choice',
        options: ['Price', 'Quality', 'Customer Service', 'Speed', 'Other'],
        required: false,
        order: 2,
      },
      {
        id: 'q4',
        surveyId,
        question: 'Any additional feedback?',
        questionType: 'text',
        options: null,
        required: false,
        order: 3,
      },
    ];

    return {
      ...survey,
      questions,
    };
  }

  /**
   * Submit survey response
   */
  async submitResponse(data: SurveyResponse): Promise<any> {
    await this.simulateNetworkDelay();

    const response = {
      id: this.generateId(),
      surveyId: data.surveyId,
      customerId: data.customerId,
      isAnonymous: data.isAnonymous,
      submittedAt: new Date(),
    };

    console.log(`[MOCK] Survey response submitted for survey ${data.surveyId}`, data.answers);

    return {
      success: true,
      response,
      message: 'Thank you for your feedback!',
    };
  }

  /**
   * Get survey responses/results
   */
  async getSurveyResults(tenantId: string, surveyId: string): Promise<any> {
    return {
      surveyId,
      summary: {
        totalResponses: 127,
        completionRate: 51.8, // 127/245 * 100
        averageCompletionTime: 135, // seconds
      },
      questionResults: [
        {
          questionId: 'q1',
          question: 'How satisfied are you with our service?',
          type: 'rating',
          responses: 127,
          data: {
            1: 3,
            2: 8,
            3: 22,
            4: 51,
            5: 43,
          },
          average: 4.1,
        },
        {
          questionId: 'q2',
          question: 'Would you recommend us to a friend?',
          type: 'yes_no',
          responses: 127,
          data: {
            yes: 98,
            no: 29,
          },
          nps: 54.3, // Net Promoter Score
        },
        {
          questionId: 'q3',
          question: 'What do you like most about our service?',
          type: 'multiple_choice',
          responses: 115,
          data: {
            'Price': 34,
            'Quality': 52,
            'Customer Service': 41,
            'Speed': 23,
            'Other': 15,
          },
        },
        {
          questionId: 'q4',
          question: 'Any additional feedback?',
          type: 'text',
          responses: 67,
          sampleResponses: [
            'Great service, keep it up!',
            'Would love more product options',
            'Delivery could be faster',
          ],
        },
      ],
      demographics: {
        byDate: [
          { date: '2026-02-01', responses: 12 },
          { date: '2026-02-05', responses: 23 },
          { date: '2026-02-10', responses: 31 },
          { date: '2026-02-15', responses: 28 },
          { date: '2026-02-20', responses: 33 },
        ],
      },
    };
  }

  /**
   * Publish/activate survey
   */
  async publishSurvey(tenantId: string, surveyId: string): Promise<any> {
    await this.simulateNetworkDelay();

    return {
      success: true,
      surveyId,
      status: 'active',
      publicUrl: `https://surveys.fiscalnext.com/${surveyId}`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=https://surveys.fiscalnext.com/${surveyId}`,
    };
  }

  /**
   * Close survey
   */
  async closeSurvey(tenantId: string, surveyId: string): Promise<any> {
    return {
      success: true,
      surveyId,
      status: 'closed',
      finalResponseCount: 127,
    };
  }

  /**
   * Duplicate survey
   */
  async duplicateSurvey(tenantId: string, surveyId: string): Promise<any> {
    const original = await this.getSurveyDetails(tenantId, surveyId);

    const duplicate = {
      ...original,
      id: this.generateId(),
      title: `${original.title} (Copy)`,
      status: 'draft',
      totalViews: 0,
      totalResponses: 0,
      createdAt: new Date(),
    };

    return duplicate;
  }

  /**
   * Delete survey
   */
  async deleteSurvey(tenantId: string, surveyId: string): Promise<any> {
    return {
      success: true,
      message: 'Survey deleted successfully',
    };
  }

  // Helper methods

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private async simulateNetworkDelay(): Promise<void> {
    const delay = 100 + Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

export const surveyService = new SurveyService();
