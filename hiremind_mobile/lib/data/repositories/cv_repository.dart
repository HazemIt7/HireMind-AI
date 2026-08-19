import '../services/api_service.dart';

class CvRepository {
  final ApiService _apiService;

  CvRepository({required ApiService apiService}) : _apiService = apiService;

  Future<Map<String, dynamic>> uploadCV(String filePath) async {
    final response = await _apiService.uploadCV(filePath);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getPassport() async {
    final response = await _apiService.getPassport();
    return response.data as Map<String, dynamic>;
  }
}
