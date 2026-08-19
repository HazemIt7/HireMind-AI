import 'package:dio/dio.dart';

class ApiService {
  final Dio _dio;

  ApiService({required String baseUrl})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 60),
          headers: {
            'Content-Type': 'application/json',
          },
        ));

  void setToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  void clearToken() {
    _dio.options.headers.remove('Authorization');
  }

  // Auth endpoints
  Future<Response> register(String email, String password, String role) async {
    return await _dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      'role': role,
    });
  }

  Future<Response> login(String email, String password) async {
    return await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
  }

  Future<Response> getProfile() async {
    return await _dio.get('/auth/me');
  }

  Future<Response> updateProfile(String firstName, String lastName) async {
    return await _dio.put('/auth/me', data: {
      'firstName': firstName,
      'lastName': lastName,
    });
  }

  // CV endpoints
  Future<Response> uploadCV(String filePath) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
    });
    return await _dio.post('/cv/upload', data: formData);
  }

  Future<Response> getPassport() async {
    return await _dio.get('/candidates/me/passport');
  }

  // Interview endpoints
  Future<Response> startInterview(String jobId) async {
    return await _dio.post('/interviews/start', data: {'jobId': jobId});
  }

  Future<Response> sendAnswer(String sessionId, String message) async {
    return await _dio.post('/interviews/$sessionId/message', data: {
      'message': message,
    });
  }

  Future<Response> sendVoiceAnswer(String sessionId, String audioPath) async {
    final formData = FormData.fromMap({
      'audioFile': await MultipartFile.fromFile(audioPath),
    });
    return await _dio.post('/interviews/$sessionId/audio', data: formData);
  }
}
