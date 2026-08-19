import '../services/api_service.dart';
import '../../domain/models/user.dart';

class AuthRepository {
  final ApiService _apiService;
  User? _currentUser;

  AuthRepository({required ApiService apiService}) : _apiService = apiService;

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;

  Future<User> login(String email, String password) async {
    final response = await _apiService.login(email, password);
    final token = response.data['accessToken'] as String;
    
    // Inject the token in ApiService headers
    _apiService.setToken(token);

    // Fetch the profile
    final profileResponse = await _apiService.getProfile();
    _currentUser = User.fromJson(profileResponse.data);
    return _currentUser!;
  }

  Future<User> register(String email, String password, String role) async {
    await _apiService.register(email, password, role);
    return await login(email, password);
  }

  Future<User> updateProfile(String firstName, String lastName) async {
    final response = await _apiService.updateProfile(firstName, lastName);
    _currentUser = User.fromJson(response.data);
    return _currentUser!;
  }

  Future<void> logout() async {
    _apiService.clearToken();
    _currentUser = null;
  }
}
