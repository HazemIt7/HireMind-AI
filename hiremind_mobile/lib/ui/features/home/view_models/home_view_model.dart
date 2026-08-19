import 'package:flutter/material.dart';
import '../../../../data/repositories/cv_repository.dart';

class HomeViewModel extends ChangeNotifier {
  final CvRepository _cvRepository;

  HomeViewModel({required CvRepository cvRepository}) : _cvRepository = cvRepository;

  bool _isUploading = false;
  bool get isUploading => _isUploading;

  bool _isLoadingPassport = false;
  bool get isLoadingPassport => _isLoadingPassport;

  String? _uploadStatus;
  String? get uploadStatus => _uploadStatus;

  String? _cvPath;
  String? get cvPath => _cvPath;

  Map<String, dynamic>? _parsedCvData;
  Map<String, dynamic>? get parsedCvData => _parsedCvData;

  List<Map<String, dynamic>>? _radarScores;
  List<Map<String, dynamic>>? get radarScores => _radarScores;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  void reset() {
    _cvPath = null;
    _parsedCvData = null;
    _radarScores = null;
    _uploadStatus = null;
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> uploadCV(String filePath) async {
    _isUploading = true;
    _uploadStatus = 'Envoi du fichier...';
    _errorMessage = null;
    _cvPath = filePath;
    notifyListeners();

    try {
      _uploadStatus = 'Analyse du CV par l\'IA...';
      notifyListeners();

      final result = await _cvRepository.uploadCV(filePath);
      _parsedCvData = result['parsedData'] as Map<String, dynamic>?;
      
      _uploadStatus = 'CV analysé avec succès !';
      notifyListeners();

      // Retrieve radar scores to update the passport view
      await fetchPassport();
    } catch (e) {
      _errorMessage = 'Une erreur est survenue lors de l\'analyse de votre CV.';
      _uploadStatus = 'Échec de l\'analyse.';
      notifyListeners();
    } finally {
      _isUploading = false;
      notifyListeners();
    }
  }

  Future<void> fetchPassport() async {
    _isLoadingPassport = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final data = await _cvRepository.getPassport();
      final scores = data['radarScores'] as List<dynamic>?;
      _radarScores = scores?.map((e) => e as Map<String, dynamic>).toList();
      _parsedCvData = data['parsedData'] as Map<String, dynamic>?;
    } catch (e) {
      _errorMessage = 'Impossible de charger le passeport de compétences.';
    } finally {
      _isLoadingPassport = false;
      notifyListeners();
    }
  }
}
