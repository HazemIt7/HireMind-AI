import '../services/api_service.dart';
import '../../domain/models/job_offer.dart';

class JobRepository {
  final ApiService _apiService;

  JobRepository({required ApiService apiService}) : _apiService = apiService;

  Future<List<JobOffer>> fetchJobs() async {
    try {
      final response = await _apiService.getJobs();
      if (response.data is List) {
        final list = response.data as List;
        return list.map((item) => JobOffer.fromJson(item as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<JobOffer?> fetchJobById(String id) async {
    try {
      final response = await _apiService.getJobById(id);
      if (response.data is Map<String, dynamic>) {
        return JobOffer.fromJson(response.data as Map<String, dynamic>);
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}
