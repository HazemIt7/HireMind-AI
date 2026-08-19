import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'ui/core/router.dart';
import 'ui/features/auth/view_models/auth_view_model.dart';
import 'ui/features/home/view_models/home_view_model.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/cv_repository.dart';
import 'data/services/api_service.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final ApiService apiService;
  late final AuthRepository authRepository;
  late final CvRepository cvRepository;

  @override
  void initState() {
    super.initState();
    apiService = ApiService(baseUrl: 'http://10.0.2.2:3000/api/v1');
    authRepository = AuthRepository(apiService: apiService);
    cvRepository = CvRepository(apiService: apiService);
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiService>.value(value: apiService),
        Provider<AuthRepository>.value(value: authRepository),
        Provider<CvRepository>.value(value: cvRepository),
        ChangeNotifierProvider(
          create: (_) => AuthViewModel(authRepository: authRepository),
        ),
        ChangeNotifierProvider(
          create: (_) => HomeViewModel(cvRepository: cvRepository),
        ),
      ],
      child: MaterialApp.router(
        routerConfig: router,
        title: 'HireMind AI',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueAccent),
          useMaterial3: true,
          fontFamily: 'Roboto',
        ),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

