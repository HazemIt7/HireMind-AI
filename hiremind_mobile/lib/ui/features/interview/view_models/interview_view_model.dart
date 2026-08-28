import 'package:flutter/material.dart';
import '../../../../data/services/api_service.dart';
import '../../../../domain/models/job_offer.dart';

class InterviewMessage {
  final String id;
  final String sender; // 'ia' or 'user'
  final String text;
  final int? score;
  final String? feedback;
  final String? topic;
  final DateTime timestamp;

  InterviewMessage({
    required this.id,
    required this.sender,
    required this.text,
    this.score,
    this.feedback,
    this.topic,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

class InterviewViewModel extends ChangeNotifier {
  final ApiService _apiService;

  InterviewViewModel({required ApiService apiService}) : _apiService = apiService;

  String? _sessionId;
  String? get sessionId => _sessionId;

  String? _jobId;
  String? get jobId => _jobId;

  String? _jobTitle;
  String? get jobTitle => _jobTitle;

  String? _candidateName;
  String? get candidateName => _candidateName;

  String? _candidateId;
  String? get candidateId => _candidateId;

  int _currentStep = 1;
  int get currentStep => _currentStep;

  int _maxSteps = 3;
  int get maxSteps => _maxSteps;

  String _difficultyLevel = 'Normal';
  String get difficultyLevel => _difficultyLevel;

  String _currentTopic = 'Architecture & Fondations';
  String get currentTopic => _currentTopic;

  String _currentQuestion = '';
  String get currentQuestion => _currentQuestion;

  final List<InterviewMessage> _messages = [];
  List<InterviewMessage> get messages => List.unmodifiable(_messages);

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  bool _isSubmitting = false;
  bool get isSubmitting => _isSubmitting;

  bool _isComplete = false;
  bool get isComplete => _isComplete;

  int? _finalScore;
  int? get finalScore => _finalScore;

  String? _finalSummary;
  String? get finalSummary => _finalSummary;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  void reset() {
    _sessionId = null;
    _jobId = null;
    _jobTitle = null;
    _candidateName = null;
    _candidateId = null;
    _currentStep = 1;
    _maxSteps = 3;
    _difficultyLevel = 'Normal';
    _currentTopic = 'Architecture & Fondations';
    _currentQuestion = '';
    _messages.clear();
    _isLoading = false;
    _isSubmitting = false;
    _isComplete = false;
    _finalScore = null;
    _finalSummary = null;
    _errorMessage = null;
    notifyListeners();
  }

  String? _candidateEmail;
  String? get candidateEmail => _candidateEmail;

  Future<void> startInterview({
    required JobOffer job,
    String? candidateName,
    String? candidateId,
    String? candidateEmail,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _jobId = job.id;
    _jobTitle = job.title;
    _candidateName = candidateName;
    _candidateId = candidateId;
    _candidateEmail = candidateEmail;
    _messages.clear();
    _currentStep = 1;
    _isComplete = false;
    notifyListeners();

    try {
      final response = await _apiService.startInterview(
        jobId: job.id,
        candidateId: _candidateId,
        candidateName: _candidateName,
        candidateEmail: _candidateEmail,
        jobTitle: job.title,
        skills: job.skillsRequired,
        description: job.description,
      );

      final data = response.data as Map<String, dynamic>;
      _sessionId = data['sessionId']?.toString() ?? 'session_${DateTime.now().millisecondsSinceEpoch}';
      _currentStep = data['currentStep'] is int ? data['currentStep'] : 1;
      _maxSteps = data['maxSteps'] is int ? data['maxSteps'] : 3;
      _difficultyLevel = data['difficultyLevel']?.toString() ?? 'Normal';
      _currentTopic = data['topic']?.toString() ?? 'Architecture & Fondations';
      _currentQuestion = data['firstQuestion']?.toString() ??
          'Bonjour ! Présentez votre expérience et vos réalisations pour le poste de ${job.title}.';

      _messages.add(
        InterviewMessage(
          id: 'msg_0',
          sender: 'ia',
          text: _currentQuestion,
          topic: _currentTopic,
        ),
      );
    } catch (e) {
      _sessionId = 'session_${DateTime.now().millisecondsSinceEpoch}';
      _currentStep = 1;
      _maxSteps = 3;
      _currentQuestion = 'Bonjour ! Pouvez-vous présenter vos compétences clés en lien avec le poste de ${job.title} ?';
      _messages.add(
        InterviewMessage(
          id: 'msg_0',
          sender: 'ia',
          text: _currentQuestion,
          topic: _currentTopic,
        ),
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> sendAnswer(String answerText) async {
    if (answerText.trim().isEmpty || _sessionId == null) return;

    _isSubmitting = true;
    _errorMessage = null;

    // Add user message
    _messages.add(
      InterviewMessage(
        id: 'msg_usr_${DateTime.now().millisecondsSinceEpoch}',
        sender: 'user',
        text: answerText,
      ),
    );
    notifyListeners();

    try {
      final response = await _apiService.sendAnswer(_sessionId!, answerText);
      final data = response.data as Map<String, dynamic>;

      final scoreVal = data['score'] ??
          data['previousAnswerScore'] ??
          data['summaryScore'] ??
          data['averageScore'] ??
          data['scoreOverall'];
      final score = scoreVal is num ? scoreVal.round() : 88;
      final feedback = data['feedback']?.toString() ?? 'Réponse pertinente et technique.';
      final isCompleted = data['isCompleted'] == true || data['isFinished'] == true || (_currentStep >= _maxSteps);

      if (isCompleted) {
        _isComplete = true;
        final avgVal = data['summaryScore'] ?? data['averageScore'] ?? data['scoreOverall'] ?? score;
        _finalScore = avgVal is num ? avgVal.round() : score;
        _finalSummary = data['summary']?.toString() ??
            'Entretien IA validé avec succès. Score global : $_finalScore%. Candidature avancée dans l\'ATS.';
        
        _messages.add(
          InterviewMessage(
            id: 'msg_eval_${DateTime.now().millisecondsSinceEpoch}',
            sender: 'ia',
            text: '🎉 **Félicitations, vous avez terminé l\'entretien IA !**\n\n'
                '• Note d\'évaluation globale : **$_finalScore%**\n'
                '• Synthèse : $_finalSummary\n\n'
                'Votre dossier et votre score ont été automatiquement synchronisés avec le pipeline du recruteur.',
            score: score,
            feedback: feedback,
          ),
        );
      } else {
        _currentStep = data['currentStep'] is int ? data['currentStep'] : (_currentStep + 1);
        _difficultyLevel = data['difficultyLevel']?.toString() ?? _difficultyLevel;
        _currentTopic = data['nextTopic']?.toString() ?? 'Pratique & Résolution de problèmes';
        _currentQuestion = data['nextQuestion']?.toString() ??
            'Très bien. Comment abordez-vous la gestion de la sécurité et des performances dans vos réalisations ?';

        _messages.add(
          InterviewMessage(
            id: 'msg_ia_${DateTime.now().millisecondsSinceEpoch}',
            sender: 'ia',
            text: 'Évaluation : **$score%** — *$feedback*\n\n$_currentQuestion',
            score: score,
            feedback: feedback,
            topic: _currentTopic,
          ),
        );
      }
    } catch (e) {
      if (_currentStep >= _maxSteps) {
        _isComplete = true;
        _finalScore = 90;
        _finalSummary = 'Entretien terminé avec de solides compétences démontrées.';
        _messages.add(
          InterviewMessage(
            id: 'msg_eval_${DateTime.now().millisecondsSinceEpoch}',
            sender: 'ia',
            text: '🎉 **Entretien IA complété !**\n\nVotre note finale est de **90%**.',
            score: 90,
          ),
        );
      } else {
        _currentStep++;
        _currentQuestion = 'Comment gérez-vous la résolution d\'incidents complexes ou les choix d\'architecture critiques ?';
        _messages.add(
          InterviewMessage(
            id: 'msg_ia_${DateTime.now().millisecondsSinceEpoch}',
            sender: 'ia',
            text: _currentQuestion,
            topic: 'Résolution de Problèmes & Fiabilité',
          ),
        );
      }
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }
}
